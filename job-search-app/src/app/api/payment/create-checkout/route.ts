import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { StripeService } from '@/services/payment/StripeService'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Create Stripe customer if doesn't exist
    let customerId = user.customerId
    if (!customerId) {
      customerId = await StripeService.createCustomer(
        user.email,
        `${user.firstName} ${user.lastName}`.trim()
      )
      
      await prisma.user.update({
        where: { id: user.id },
        data: { customerId }
      })
    }

    // Create checkout session
    const checkoutSession = await StripeService.createCheckoutSession(
      customerId,
      process.env.STRIPE_PRICE_ID!, // $9/month price ID
      `${process.env.NEXTAUTH_URL}/dashboard?payment=success`,
      `${process.env.NEXTAUTH_URL}/dashboard?payment=cancelled`
    )

    return NextResponse.json({ 
      checkoutUrl: checkoutSession.url 
    })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}