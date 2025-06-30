import Imap from 'imap'
import { simpleParser } from 'mailparser'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export interface EmailConfig {
  host: string
  port: number
  user: string
  password: string
  tls: boolean
}

export interface ParsedEmail {
  messageId: string
  from: string
  to: string
  subject: string
  date: Date
  text?: string
  html?: string
  attachments?: any[]
}

export class EmailService {
  private config: EmailConfig
  private imap: Imap | null = null
  
  constructor(config: EmailConfig) {
    this.config = config
  }

  // Get email configuration for different providers
  static getProviderConfig(provider: string, email: string, password: string): EmailConfig {
    const configs: Record<string, Omit<EmailConfig, 'user' | 'password'>> = {
      gmail: {
        host: 'imap.gmail.com',
        port: 993,
        tls: true
      },
      outlook: {
        host: 'outlook.office365.com',
        port: 993,
        tls: true
      },
      icloud: {
        host: 'imap.mail.me.com',
        port: 993,
        tls: true
      },
      yahoo: {
        host: 'imap.mail.yahoo.com',
        port: 993,
        tls: true
      }
    }

    const providerConfig = configs[provider.toLowerCase()]
    if (!providerConfig) {
      throw new Error(`Unsupported email provider: ${provider}`)
    }

    return {
      ...providerConfig,
      user: email,
      password: password
    }
  }

  private connect(): Promise<Imap> {
    return new Promise((resolve, reject) => {
      this.imap = new Imap({
        user: this.config.user,
        password: this.config.password,
        host: this.config.host,
        port: this.config.port,
        tls: this.config.tls,
        tlsOptions: { rejectUnauthorized: false }
      })

      this.imap.once('ready', () => {
        resolve(this.imap!)
      })

      this.imap.once('error', (err: Error) => {
        reject(err)
      })

      this.imap.connect()
    })
  }

  private disconnect(): void {
    if (this.imap) {
      this.imap.end()
      this.imap = null
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.connect()
      this.disconnect()
      return true
    } catch (error) {
      console.error('Email connection test failed:', error)
      return false
    }
  }

  async fetchEmails(
    folderName: string = 'INBOX',
    searchCriteria: string[] = ['UNSEEN'],
    limit: number = 50
  ): Promise<ParsedEmail[]> {
    try {
      const imap = await this.connect()
      
      return new Promise((resolve, reject) => {
        imap.openBox(folderName, false, (err, box) => {
          if (err) {
            reject(err)
            return
          }

          imap.search(searchCriteria, (err, results) => {
            if (err) {
              reject(err)
              return
            }

            if (!results || results.length === 0) {
              resolve([])
              return
            }

            // Limit results
            const limitedResults = results.slice(0, limit)
            const emails: ParsedEmail[] = []
            let processedCount = 0

            const fetch = imap.fetch(limitedResults, {
              bodies: '',
              markSeen: false
            })

            fetch.on('message', (msg, seqno) => {
              let buffer = ''

              msg.on('body', (stream, info) => {
                stream.on('data', (chunk) => {
                  buffer += chunk.toString('utf8')
                })

                stream.once('end', async () => {
                  try {
                    const parsed = await simpleParser(buffer)
                    
                    emails.push({
                      messageId: parsed.messageId || `${seqno}-${Date.now()}`,
                      from: this.extractEmail(parsed.from?.text || ''),
                      to: this.extractEmail(parsed.to?.text || ''),
                      subject: parsed.subject || '',
                      date: parsed.date || new Date(),
                      text: parsed.text,
                      html: parsed.html?.toString(),
                      attachments: parsed.attachments
                    })

                    processedCount++
                    if (processedCount === limitedResults.length) {
                      this.disconnect()
                      resolve(emails)
                    }
                  } catch (parseError) {
                    console.error('Email parsing error:', parseError)
                    processedCount++
                    if (processedCount === limitedResults.length) {
                      this.disconnect()
                      resolve(emails)
                    }
                  }
                })
              })

              msg.once('error', (err) => {
                console.error('Message error:', err)
                processedCount++
                if (processedCount === limitedResults.length) {
                  this.disconnect()
                  resolve(emails)
                }
              })
            })

            fetch.once('error', (err) => {
              this.disconnect()
              reject(err)
            })

            fetch.once('end', () => {
              if (processedCount === 0) {
                this.disconnect()
                resolve([])
              }
            })
          })
        })
      })
    } catch (error) {
      this.disconnect()
      throw error
    }
  }

  async fetchEmailsSince(
    since: Date,
    folderName: string = 'INBOX',
    limit: number = 100
  ): Promise<ParsedEmail[]> {
    const sinceStr = since.toISOString().split('T')[0] // YYYY-MM-DD format
    const searchCriteria = ['SINCE', sinceStr]
    
    return this.fetchEmails(folderName, searchCriteria, limit)
  }

  private extractEmail(text: string): string {
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/
    const match = text.match(emailRegex)
    return match ? match[1] : text
  }

  // Filter emails based on sender patterns
  filterEmailsBySender(emails: ParsedEmail[], senderFilters: string[]): ParsedEmail[] {
    if (!senderFilters || senderFilters.length === 0) {
      return emails
    }

    return emails.filter(email => {
      return senderFilters.some(filter => {
        if (filter.includes('*')) {
          // Wildcard matching
          const regex = new RegExp(filter.replace(/\*/g, '.*'), 'i')
          return regex.test(email.from)
        } else {
          // Exact or domain matching
          return email.from.toLowerCase().includes(filter.toLowerCase())
        }
      })
    })
  }

  // Filter emails based on subject patterns
  filterEmailsBySubject(emails: ParsedEmail[], subjectFilters: string[]): ParsedEmail[] {
    if (!subjectFilters || subjectFilters.length === 0) {
      return emails
    }

    return emails.filter(email => {
      return subjectFilters.some(filter => {
        if (filter.includes('*')) {
          // Wildcard matching
          const regex = new RegExp(filter.replace(/\*/g, '.*'), 'i')
          return regex.test(email.subject)
        } else {
          // Keyword matching
          return email.subject.toLowerCase().includes(filter.toLowerCase())
        }
      })
    })
  }

  // Encrypt password for storage
  static encryptPassword(password: string): string {
    const algorithm = 'aes-256-cbc'
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32)
    const iv = crypto.randomBytes(16)
    
    const cipher = crypto.createCipher(algorithm, key)
    let encrypted = cipher.update(password, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    return `${iv.toString('hex')}:${encrypted}`
  }

  // Decrypt password from storage
  static decryptPassword(encryptedPassword: string): string {
    const algorithm = 'aes-256-cbc'
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32)
    
    const [ivHex, encrypted] = encryptedPassword.split(':')
    const iv = Buffer.from(ivHex, 'hex')
    
    const decipher = crypto.createDecipher(algorithm, key)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  }
}