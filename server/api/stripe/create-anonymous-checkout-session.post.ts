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
    const { plan, currency = 'sek' } = body

    if (!plan || !['basic', 'premium'].includes(plan)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Valid plan (basic or premium) is required'
      })
    }

    // Get price mappings by plan and currency
    const priceMappings = {
      basic: {
        sek: 'price_1RtyCzPmwvHOz1q62Gb9J8bK', // 99 SEK
        usd: 'price_1RtyK5PmwvHOz1q62vXPGDJz', // Will need to create
        eur: 'price_1RtyK5PmwvHOz1q6FRtF4WFd'  // Will need to create
      },
      premium: {
        sek: 'price_1RtyDiPmwvHOz1q6qpTh1MmT', // 249 SEK
        usd: 'price_1RtyJgPmwvHOz1q61TYNauaV', // Will need to create
        eur: 'price_1RtyJgPmwvHOz1q6zQvw0I4s'  // Will need to create
      }
    }

    const priceId = priceMappings[plan as keyof typeof priceMappings]?.[currency as 'sek' | 'usd' | 'eur']

    if (!priceId) {
      throw createError({
        statusCode: 400,
        statusMessage: `Price not configured for ${plan} plan in ${currency.toUpperCase()}`
      })
    }

    // Verify the price exists in Stripe
    let stripePrice
    try {
      stripePrice = await stripe.prices.retrieve(priceId)
    } catch (error) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid price ID or price not found in Stripe'
      })
    }

    const planInfo = {
      name: stripePrice.nickname || (stripePrice.product as any)?.name || 'Subscription Plan',
      amount: stripePrice.unit_amount,
      interval: stripePrice.recurring?.interval || 'month',
      trial_period_days: 14 // Default trial period
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
      subscription_data: {
        trial_period_days: planInfo.trial_period_days,
        metadata: {
          plan_name: planInfo.name,
          plan_type: plan,
          currency: currency
        }
      },
      success_url: `${getHeader(event, 'origin')}/auth/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getHeader(event, 'origin')}/pricing?canceled=true`,
      metadata: {
        plan_type: plan,
        plan_name: planInfo.name,
        currency: currency,
        anonymous_checkout: 'true'
      },
      // Collect customer information during checkout
      customer_creation: 'always',
      billing_address_collection: 'required'
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

    return {
      data: {
        sessionId: session.id,
        url: session.url
      }
    }
  } catch (error) {
    console.error('Stripe anonymous checkout session error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create anonymous checkout session'
    })
  }
})