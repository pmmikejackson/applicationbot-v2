import nlp from 'compromise'
import { ParsedEmail } from '@/services/email/EmailService'

export interface ParsedJob {
  title: string
  company: string
  location?: string
  salaryMin?: number
  salaryMax?: number
  salaryRange?: string
  description?: string
  requirements?: string
  url?: string
  platform: string
  postedDate?: Date
  applicationDeadline?: Date
}

export class JobEmailParser {
  private static readonly PLATFORM_PATTERNS = {
    linkedin: [
      /linkedin\.com/i,
      /jobalerts-noreply@linkedin\.com/i,
      /noreply@linkedin\.com/i
    ],
    indeed: [
      /indeed\.com/i,
      /noreply@indeed\.com/i,
      /no-reply@indeed\.com/i
    ],
    builtin: [
      /builtin\.com/i,
      /team@builtin\.com/i,
      /jobs@builtin\.com/i
    ],
    ziprecruiter: [
      /ziprecruiter\.com/i,
      /no-reply@ziprecruiter\.com/i,
      /noreply@ziprecruiter\.com/i
    ]
  }

  private static readonly JOB_TITLE_PATTERNS = [
    /job title[:\s]+([^\n]+)/i,
    /position[:\s]+([^\n]+)/i,
    /role[:\s]+([^\n]+)/i,
    /opening[:\s]+([^\n]+)/i,
    /opportunity[:\s]+([^\n]+)/i,
    /hiring[:\s]+([^\n]+)/i
  ]

  private static readonly COMPANY_PATTERNS = [
    /company[:\s]+([^\n]+)/i,
    /employer[:\s]+([^\n]+)/i,
    /organization[:\s]+([^\n]+)/i,
    /at\s+([A-Z][a-zA-Z\s&.,]+(?:Inc|LLC|Corp|Company|Ltd)?)/,
    /by\s+([A-Z][a-zA-Z\s&.,]+(?:Inc|LLC|Corp|Company|Ltd)?)/
  ]

  private static readonly LOCATION_PATTERNS = [
    /location[:\s]+([^\n]+)/i,
    /based in[:\s]+([^\n]+)/i,
    /office[:\s]+([^\n]+)/i,
    /([A-Z][a-zA-Z\s]+,\s*[A-Z]{2}(?:\s+\d{5})?)/,
    /(Remote|Work from home|WFH)/i
  ]

  private static readonly SALARY_PATTERNS = [
    /salary[:\s]+\$?([\d,]+)(?:\s*-\s*\$?([\d,]+))?/i,
    /compensation[:\s]+\$?([\d,]+)(?:\s*-\s*\$?([\d,]+))?/i,
    /pay[:\s]+\$?([\d,]+)(?:\s*-\s*\$?([\d,]+))?/i,
    /\$?([\d,]+)(?:k)?\s*-\s*\$?([\d,]+)(?:k)?/i,
    /\$?([\d,]+)\s*per\s+year/i
  ]

  private static readonly URL_PATTERNS = [
    /https?:\/\/[^\s\n<>]+/g,
    /apply[:\s]+([^\s\n]+)/i,
    /view job[:\s]+([^\s\n]+)/i,
    /more details[:\s]+([^\s\n]+)/i
  ]

  static parseJobEmail(email: ParsedEmail): ParsedJob | null {
    try {
      const platform = this.detectPlatform(email)
      const content = this.getEmailContent(email)
      
      if (!content || !platform) {
        return null
      }

      const doc = nlp(content)
      
      const job: ParsedJob = {
        title: this.extractJobTitle(content, doc),
        company: this.extractCompany(content, doc),
        location: this.extractLocation(content, doc),
        platform,
        description: this.extractDescription(content),
        url: this.extractUrl(content),
        postedDate: email.date
      }

      // Extract salary information
      const salaryInfo = this.extractSalary(content)
      if (salaryInfo) {
        job.salaryMin = salaryInfo.min
        job.salaryMax = salaryInfo.max
        job.salaryRange = salaryInfo.range
      }

      // Only return if we have at least a title and company
      if (job.title && job.company) {
        return job
      }

      return null
    } catch (error) {
      console.error('Job parsing error:', error)
      return null
    }
  }

  private static detectPlatform(email: ParsedEmail): string {
    const fromEmail = email.from.toLowerCase()
    const content = this.getEmailContent(email).toLowerCase()

    for (const [platform, patterns] of Object.entries(this.PLATFORM_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(fromEmail) || pattern.test(content)) {
          return platform
        }
      }
    }

    return 'other'
  }

  private static getEmailContent(email: ParsedEmail): string {
    // Prefer text content, fall back to HTML with tags stripped
    if (email.text) {
      return email.text
    } else if (email.html) {
      return email.html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    } else {
      return email.subject || ''
    }
  }

  private static extractJobTitle(content: string, doc: any): string {
    // Try specific patterns first
    for (const pattern of this.JOB_TITLE_PATTERNS) {
      const match = content.match(pattern)
      if (match && match[1]) {
        return this.cleanText(match[1])
      }
    }

    // Try to find job titles using NLP
    const sentences = doc.sentences().out('array')
    for (const sentence of sentences) {
      const sentenceDoc = nlp(sentence)
      const nouns = sentenceDoc.nouns().out('array')
      
      // Look for sentences with job-related keywords
      if (sentence.toLowerCase().includes('position') || 
          sentence.toLowerCase().includes('role') ||
          sentence.toLowerCase().includes('job') ||
          sentence.toLowerCase().includes('opening')) {
        
        // Extract capitalized phrases that might be job titles
        const titleMatch = sentence.match(/([A-Z][a-zA-Z\s]{2,50}(?:Manager|Developer|Engineer|Analyst|Specialist|Coordinator|Director|Lead|Senior|Junior))/i)
        if (titleMatch) {
          return this.cleanText(titleMatch[1])
        }
      }
    }

    return ''
  }

  private static extractCompany(content: string, doc: any): string {
    // Try specific patterns first
    for (const pattern of this.COMPANY_PATTERNS) {
      const match = content.match(pattern)
      if (match && match[1]) {
        return this.cleanText(match[1])
      }
    }

    // Use NLP to find organizations
    const organizations = doc.organizations().out('array')
    if (organizations.length > 0) {
      return organizations[0]
    }

    // Look for capitalized company names
    const companyMatch = content.match(/([A-Z][a-zA-Z\s&.,]{2,50}(?:Inc|LLC|Corp|Company|Ltd|Technologies|Systems|Solutions))/i)
    if (companyMatch) {
      return this.cleanText(companyMatch[1])
    }

    return ''
  }

  private static extractLocation(content: string, doc: any): string | undefined {
    // Try specific patterns
    for (const pattern of this.LOCATION_PATTERNS) {
      const match = content.match(pattern)
      if (match && match[1]) {
        return this.cleanText(match[1])
      }
    }

    // Use NLP to find places
    const places = doc.places().out('array')
    if (places.length > 0) {
      return places[0]
    }

    return undefined
  }

  private static extractSalary(content: string): { min?: number; max?: number; range?: string } | undefined {
    for (const pattern of this.SALARY_PATTERNS) {
      const match = content.match(pattern)
      if (match) {
        const min = match[1] ? parseInt(match[1].replace(/,/g, '')) : undefined
        const max = match[2] ? parseInt(match[2].replace(/,/g, '')) : undefined
        
        if (min || max) {
          return {
            min,
            max,
            range: match[0]
          }
        }
      }
    }

    return undefined
  }

  private static extractDescription(content: string): string | undefined {
    // Look for description sections
    const descriptionPatterns = [
      /description[:\s]+([\s\S]{50,500})/i,
      /responsibilities[:\s]+([\s\S]{50,500})/i,
      /about this role[:\s]+([\s\S]{50,500})/i,
      /job summary[:\s]+([\s\S]{50,500})/i
    ]

    for (const pattern of descriptionPatterns) {
      const match = content.match(pattern)
      if (match && match[1]) {
        return this.cleanText(match[1]).substring(0, 500)
      }
    }

    // Fall back to first substantial paragraph
    const paragraphs = content.split('\n\n').filter(p => p.length > 50)
    if (paragraphs.length > 0) {
      return this.cleanText(paragraphs[0]).substring(0, 500)
    }

    return undefined
  }

  private static extractUrl(content: string): string | undefined {
    const urlMatches = content.match(this.URL_PATTERNS[0])
    if (urlMatches && urlMatches.length > 0) {
      // Return the first HTTP URL found
      return urlMatches.find(url => url.startsWith('http'))
    }

    return undefined
  }

  private static cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s&.,()-]/g, '')
      .trim()
  }

  // Batch parse multiple emails
  static parseJobEmails(emails: ParsedEmail[]): ParsedJob[] {
    const jobs: ParsedJob[] = []
    
    for (const email of emails) {
      const job = this.parseJobEmail(email)
      if (job) {
        jobs.push(job)
      }
    }

    return jobs
  }

  // Check if an email likely contains a job listing
  static isJobEmail(email: ParsedEmail): boolean {
    const content = this.getEmailContent(email).toLowerCase()
    const subject = email.subject.toLowerCase()
    
    const jobKeywords = [
      'job', 'position', 'role', 'opening', 'opportunity', 'career',
      'hiring', 'employment', 'vacancy', 'application', 'interview'
    ]

    return jobKeywords.some(keyword => 
      subject.includes(keyword) || content.includes(keyword)
    )
  }
}