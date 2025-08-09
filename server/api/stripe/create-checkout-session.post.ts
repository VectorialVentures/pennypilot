import Stripe from 'stripe'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  const supabase = await useSupabaseServiceRole()

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
    const { priceId, customerId, accountId } = body

    if (!priceId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Price ID is required'
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

    // Extract plan and currency from request or use defaults
    const { plan, currency = 'sek' } = body

    let actualPriceId = priceId

    // If a plan type was provided instead of direct price ID
    if (plan && ['basic', 'premium'].includes(plan)) {
      actualPriceId = priceMappings[plan as keyof typeof priceMappings]?.[currency as 'sek' | 'usd' | 'eur']

      if (!actualPriceId) {
        throw createError({
          statusCode: 400,
          statusMessage: `Price not configured for ${plan} plan in ${currency.toUpperCase()}`
        })
      }
    }

    // Verify the price exists in Stripe
    let stripePrice
    try {
      stripePrice = await stripe.prices.retrieve(actualPriceId)
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
          price: actualPriceId,
          quantity: 1
        }
      ],
      subscription_data: {
        trial_period_days: planInfo.trial_period_days,
        metadata: {
          account_id: accountId || '',
          plan_name: planInfo.name
        }
      },
      success_url: `${getHeader(event, 'origin')}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getHeader(event, 'origin')}/pricing?canceled=true`,
      metadata: {
        priceId,
        accountId: accountId || '',
        plan_name: planInfo.name
      }
    }

    // Handle customer assignment
    if (customerId) {
      sessionConfig.customer = customerId
    } else {
      const customerEmail = await getCustomerEmail(event, accountId)
      if (customerEmail) {
        sessionConfig.customer_email = customerEmail
      }
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

    return {
      sessionId: session.id,
      url: session.url
    }
  } catch (error) {
    console.error('Stripe checkout session error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create checkout session'
    })
  }
})

async function getCustomerEmail(event: any, accountId?: string): Promise<string | undefined> {
  if (!accountId) return undefined

  try {
    const supabase = await useSupabaseServiceRole()
    const { data } = await supabase
      .from('accounts')
      .select('billing_email')
      .eq('id', accountId)
      .single()

    return data?.billing_email || undefined
  } catch (error) {
    console.error('Error getting customer email:', error)
    return undefined
  }
}
