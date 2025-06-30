import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

export class StripeService {
  static async createCustomer(email: string, name?: string): Promise<string> {
    const customer = await stripe.customers.create({
      email,
      name
    })
    return customer.id
  }

  static async createSubscription(customerId: string, priceId: string): Promise<Stripe.Subscription> {
    return await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent']
    })
  }

  static async createCheckoutSession(customerId: string, priceId: string, successUrl: string, cancelUrl: string): Promise<Stripe.Checkout.Session> {
    return await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true
    })
  }

  static async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return await stripe.subscriptions.cancel(subscriptionId)
  }

  static async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return await stripe.subscriptions.retrieve(subscriptionId)
  }

  static async constructWebhookEvent(payload: string, signature: string): Promise<Stripe.Event> {
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  }

  static async createPrice(): Promise<string> {
    // Create the $9/month price (run once during setup)
    const price = await stripe.prices.create({
      unit_amount: 900, // $9.00
      currency: 'usd',
      recurring: { interval: 'month' },
      product_data: {
        name: 'Job Search Consolidation Premium',
        description: 'Premium features including unlimited job platforms, AI assistance, and advanced analytics'
      }
    })
    return price.id
  }
}