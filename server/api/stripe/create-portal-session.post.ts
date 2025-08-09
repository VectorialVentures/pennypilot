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
    const { customerId } = body
    
    if (!customerId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Customer ID is required'
      })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${getHeader(event, 'origin')}/subscription`
    })

    return {
      url: session.url
    }
  } catch (error: any) {
    console.error('Stripe portal session error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to create portal session'
    })
  }
})

