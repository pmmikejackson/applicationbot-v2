import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EmailService } from '@/services/email/EmailService'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { provider, emailAddress, password, senderFilters, subjectFilters } = await request.json()

    if (!provider || !emailAddress || !password) {
      return NextResponse.json(
        { error: 'Provider, email address, and password are required' },
        { status: 400 }
      )
    }

    // Get email configuration for the provider
    const emailConfig = EmailService.getProviderConfig(provider, emailAddress, password)
    
    // Encrypt the password before storing
    const encryptedPassword = EmailService.encryptPassword(password)
    
    // Check if user already has an email config for this address
    const existingConfig = await prisma.emailConfig.findFirst({
      where: {
        userId: session.user.id,
        emailAddress: emailAddress
      }
    })

    if (existingConfig) {
      // Update existing configuration
      await prisma.emailConfig.update({
        where: { id: existingConfig.id },
        data: {
          provider,
          imapHost: emailConfig.host,
          imapPort: emailConfig.port,
          username: emailAddress,
          password: encryptedPassword,
          senderFilters: senderFilters || [],
          subjectFilters: subjectFilters || [],
          isActive: true,
          updatedAt: new Date()
        }
      })
    } else {
      // Create new configuration
      await prisma.emailConfig.create({
        data: {
          userId: session.user.id,
          emailAddress,
          provider,
          imapHost: emailConfig.host,
          imapPort: emailConfig.port,
          username: emailAddress,
          password: encryptedPassword,
          senderFilters: senderFilters || [],
          subjectFilters: subjectFilters || [],
          isActive: true
        }
      })
    }

    return NextResponse.json(
      { success: true, message: 'Email configuration saved successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Email configuration error:', error)
    return NextResponse.json(
      { error: 'Failed to save email configuration' },
      { status: 500 }
    )
  }
}