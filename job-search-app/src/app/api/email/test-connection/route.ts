import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
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

    const { provider, emailAddress, password } = await request.json()

    if (!provider || !emailAddress || !password) {
      return NextResponse.json(
        { error: 'Provider, email address, and password are required' },
        { status: 400 }
      )
    }

    // Get email configuration for the provider
    const emailConfig = EmailService.getProviderConfig(provider, emailAddress, password)
    
    // Create email service instance
    const emailService = new EmailService(emailConfig)
    
    // Test connection
    const isConnected = await emailService.testConnection()
    
    if (isConnected) {
      return NextResponse.json(
        { success: true, message: 'Connection successful' },
        { status: 200 }
      )
    } else {
      return NextResponse.json(
        { error: 'Failed to connect to email server' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Email connection test error:', error)
    
    let errorMessage = 'Connection test failed'
    if (error instanceof Error) {
      if (error.message.includes('authentication')) {
        errorMessage = 'Authentication failed. Please check your email and password.'
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Connection timeout. Please check your network connection.'
      } else if (error.message.includes('ENOTFOUND')) {
        errorMessage = 'Email server not found. Please check your provider settings.'
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}