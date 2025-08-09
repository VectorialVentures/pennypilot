import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database'

export default defineEventHandler(async (event) => {
  // This endpoint should only be used during setup and should be protected
  const config = useRuntimeConfig()
  
  if (!config.stripeSecretKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Stripe not configured'
    })
  }

  const supabase = await serverSupabaseServiceRole<Database>(event)

  try {
    // Define the subscription plans with multi-currency support
    const plans = [
      // Free plan (currency-agnostic)
      {
        name: 'Free',
        description: 'Perfect to get started with basic portfolio tracking',
        amount: 0,
        currency: 'usd',
        interval: 'month',
        interval_count: 1,
        trial_period_days: null,
        stripe_price_id: 'free',
        stripe_product_id: 'prod_free',
        features: [
          '1 Portfolio',
          'Basic tracking',
          'Monthly reports',
          'Community support'
        ],
        limits: {
          portfolios: 1,
          ai_recommendations: 0,
          reports_per_month: 1
        },
        active: true
      },
      
      // Basic plans for each currency
      {
        name: 'Basic',
        description: 'For serious investors who want more insights',
        amount: 9900, // 99.00 SEK in cents
        currency: 'sek',
        interval: 'month',
        interval_count: 1,
        trial_period_days: 14,
        stripe_price_id: 'price_1RtyCzPmwvHOz1q62Gb9J8bK', // Actual SEK price ID
        stripe_product_id: 'prod_basic_sek',
        features: [
          '5 Portfolios',
          'Advanced analytics',
          'AI recommendations',
          'Weekly reports',
          'Email support'
        ],
        limits: {
          portfolios: 5,
          ai_recommendations: 50,
          reports_per_month: 4
        },
        active: true
      },
      {
        name: 'Basic',
        description: 'For serious investors who want more insights',
        amount: 999, // $9.99 USD in cents
        currency: 'usd',
        interval: 'month',
        interval_count: 1,
        trial_period_days: 14,
        stripe_price_id: 'price_1RtyK5PmwvHOz1q62vXPGDJz', // USD price ID from create-checkout-session
        stripe_product_id: 'prod_basic_usd',
        features: [
          '5 Portfolios',
          'Advanced analytics',
          'AI recommendations',
          'Weekly reports',
          'Email support'
        ],
        limits: {
          portfolios: 5,
          ai_recommendations: 50,
          reports_per_month: 4
        },
        active: true
      },
      {
        name: 'Basic',
        description: 'For serious investors who want more insights',
        amount: 899, // €8.99 EUR in cents
        currency: 'eur',
        interval: 'month',
        interval_count: 1,
        trial_period_days: 14,
        stripe_price_id: 'price_1RtyK5PmwvHOz1q6FRtF4WFd', // EUR price ID from create-checkout-session
        stripe_product_id: 'prod_basic_eur',
        features: [
          '5 Portfolios',
          'Advanced analytics',
          'AI recommendations',
          'Weekly reports',
          'Email support'
        ],
        limits: {
          portfolios: 5,
          ai_recommendations: 50,
          reports_per_month: 4
        },
        active: true
      },
      
      // Premium plans for each currency
      {
        name: 'Premium',
        description: 'For professional traders who need everything',
        amount: 24900, // 249.00 SEK in cents
        currency: 'sek',
        interval: 'month',
        interval_count: 1,
        trial_period_days: 14,
        stripe_price_id: 'price_1RtyDiPmwvHOz1q6qpTh1MmT', // Actual SEK price ID
        stripe_product_id: 'prod_premium_sek',
        features: [
          'Unlimited portfolios',
          'Real-time data',
          'Advanced AI insights',
          'Daily reports',
          'Priority support',
          'Custom alerts'
        ],
        limits: {
          portfolios: -1, // Unlimited
          ai_recommendations: -1, // Unlimited
          reports_per_month: 30
        },
        active: true
      },
      {
        name: 'Premium',
        description: 'For professional traders who need everything',
        amount: 2499, // $24.99 USD in cents
        currency: 'usd',
        interval: 'month',
        interval_count: 1,
        trial_period_days: 14,
        stripe_price_id: 'price_1RtyJgPmwvHOz1q61TYNauaV', // USD price ID from create-checkout-session
        stripe_product_id: 'prod_premium_usd',
        features: [
          'Unlimited portfolios',
          'Real-time data',
          'Advanced AI insights',
          'Daily reports',
          'Priority support',
          'Custom alerts'
        ],
        limits: {
          portfolios: -1, // Unlimited
          ai_recommendations: -1, // Unlimited
          reports_per_month: 30
        },
        active: true
      },
      {
        name: 'Premium',
        description: 'For professional traders who need everything',
        amount: 2299, // €22.99 EUR in cents
        currency: 'eur',
        interval: 'month',
        interval_count: 1,
        trial_period_days: 14,
        stripe_price_id: 'price_1RtyJgPmwvHOz1q6zQvw0I4s', // EUR price ID from create-checkout-session
        stripe_product_id: 'prod_premium_eur',
        features: [
          'Unlimited portfolios',
          'Real-time data',
          'Advanced AI insights',
          'Daily reports',
          'Priority support',
          'Custom alerts'
        ],
        limits: {
          portfolios: -1, // Unlimited
          ai_recommendations: -1, // Unlimited
          reports_per_month: 30
        },
        active: true
      }
    ]

    // Insert or update plans
    for (const plan of plans) {
      await supabase
        .from('subscription_plans')
        .upsert(plan, {
          onConflict: 'stripe_price_id'
        })
    }

    return {
      success: true,
      message: 'Subscription plans initialized successfully',
      plans: plans.length,
      details: {
        free: 1,
        basic: 3, // SEK, USD, EUR
        premium: 3, // SEK, USD, EUR
        currencies: ['sek', 'usd', 'eur'],
        stripe_price_ids: plans.map(p => ({
          name: p.name,
          currency: p.currency,
          stripe_price_id: p.stripe_price_id,
          amount: p.amount
        }))
      }
    }

  } catch (error) {
    console.error('Error initializing subscription plans:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to initialize subscription plans'
    })
  }
})