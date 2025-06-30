import bcrypt from 'bcryptjs'
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateTwoFactorSecret() {
  return speakeasy.generateSecret({
    name: 'Job Search Consolidation',
    length: 32
  })
}

export async function generateQRCode(secret: string, email: string): Promise<string> {
  const otpauthUrl = speakeasy.otpauthURL({
    secret: secret,
    label: email,
    name: 'Job Search Consolidation',
    issuer: 'Job Search Consolidation'
  })
  
  return QRCode.toDataURL(otpauthUrl)
}

export function verifyTwoFactorToken(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 1
  })
}