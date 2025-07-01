import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth/utils'
import { sendVerificationEmail } from '@/lib/email/verification'

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, email, password } = await request.json()

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Calculate trial end date (2 weeks from now)
    const trialEndDate = new Date()
    trialEndDate.setDate(trialEndDate.getDate() + 14)

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        subscriptionStatus: 'trial',
        trialStartDate: new Date(),
        trialEndDate
      }
    })

    // Send verification email (only if email service is configured)
    try {
      if (process.env.SMTP_HOST) {
        await sendVerificationEmail(user.email, user.id)
        return NextResponse.json(
          { message: 'User created successfully. Please check your email for verification.' },
          { status: 201 }
        )
      } else {
        // If no email service is configured, mark user as verified
        await prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() }
        })
        return NextResponse.json(
          { message: 'User created successfully. You can now sign in.' },
          { status: 201 }
        )
      }
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      // User is created, but email failed - let them know
      return NextResponse.json(
        { message: 'User created successfully, but email verification failed. You can try signing in.' },
        { status: 201 }
      )
    }
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}