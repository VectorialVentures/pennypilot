import Stripe from 'stripe'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database'

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

    // Get price ID from subscription_plans table
    const supabase = await serverSupabaseServiceRole<Database>(event)

    const { data: subscriptionPlan, error: planError } = await supabase
      .from('subscription_plans')
      .select('stripe_price_id, name')
      .ilike('name', plan)
      .ilike('currency', currency)
      .eq('active', true)
      .single()

    if (planError || !subscriptionPlan) {
      throw createError({
        statusCode: 400,
        statusMessage: `No active ${plan} plan found for ${currency.toUpperCase()} currency`
      })
    }

    console.log("Found plan", subscriptionPlan);
    const priceId = subscriptionPlan.stripe_price_id

    // Verify the price exists in Stripe
    let stripePrice
    try {
      console.log('Retrieving price:', priceId)
      stripePrice = await stripe.prices.retrieve(priceId)
    } catch (error) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid price ID ' + priceId + ' or price not found in Stripe'
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
