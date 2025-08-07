import Stripe from 'stripe'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  
  if (!config.stripeSecretKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Stripe secret key not configured'
    })
  }

  const stripe = new Stripe(config.stripeSecretKey, {
    apiVersion: '2024-06-20'
  })

  try {
    const { priceId, customerId } = body
    
    if (!priceId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Price ID is required'
      })
    }

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      success_url: `${getHeader(event, 'origin')}/dashboard?success=true`,
      cancel_url: `${getHeader(event, 'origin')}/pricing?canceled=true`,
      metadata: {
        priceId
      }
    }

    if (customerId) {
      sessionConfig.customer = customerId
    } else {
      sessionConfig.customer_email = await getCustomerEmail(event)
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

    return {
      sessionId: session.id
    }
  } catch (error) {
    console.error('Stripe checkout session error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create checkout session'
    })
  }
})

async function getCustomerEmail(event: any): Promise<string | undefined> {
  // This would typically get the email from the authenticated user
  // For now, we'll return undefined to let Stripe collect the email
  return undefined
}