import Stripe from 'stripe'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  
  if (!config.stripeSecretKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Stripe secret key not configured'
    })
  }

  const stripe = new Stripe(config.stripeSecretKey, {
    apiVersion: '2024-06-20'
  })

  const supabase = await serverSupabaseServiceRole<Database>(event)

  try {
    console.log('Starting Stripe products and prices sync...')

    // Define the products we want to create
    const productsToCreate = [
      {
        name: 'PennyPilot Basic',
        description: 'For serious investors who want more insights',
        planName: 'basic',
        prices: [
          { amount: 9900, currency: 'sek' }, // 99 SEK
          { amount: 999, currency: 'usd' },  // $9.99
          { amount: 899, currency: 'eur' }   // €8.99
        ]
      },
      {
        name: 'PennyPilot Premium',
        description: 'For professional traders who need advanced features',
        planName: 'premium',
        prices: [
          { amount: 24900, currency: 'sek' }, // 249 SEK
          { amount: 2499, currency: 'usd' },  // $24.99
          { amount: 2299, currency: 'eur' }   // €22.99
        ]
      }
    ]

    const results = []

    for (const productDef of productsToCreate) {
      console.log(`Creating/updating product: ${productDef.name}`)

      // Create or get existing product
      let product: Stripe.Product
      try {
        // Try to find existing product by name
        const existingProducts = await stripe.products.list({ limit: 100 })
        const existingProduct = existingProducts.data.find(p => p.name === productDef.name)
        
        if (existingProduct) {
          product = existingProduct
          console.log(`Found existing product: ${product.id}`)
        } else {
          // Create new product
          product = await stripe.products.create({
            name: productDef.name,
            description: productDef.description,
            type: 'service'
          })
          console.log(`Created new product: ${product.id}`)
        }
      } catch (error) {
        console.error(`Error with product ${productDef.name}:`, error)
        continue
      }

      // Create prices for each currency
      for (const priceInfo of productDef.prices) {
        try {
          // Check if price already exists
          const existingPrices = await stripe.prices.list({
            product: product.id,
            currency: priceInfo.currency,
            limit: 10
          })

          let price: Stripe.Price
          const existingPrice = existingPrices.data.find(p => 
            p.unit_amount === priceInfo.amount && 
            p.currency === priceInfo.currency &&
            p.recurring?.interval === 'month'
          )

          if (existingPrice) {
            price = existingPrice
            console.log(`Found existing price: ${price.id} (${priceInfo.amount/100} ${priceInfo.currency.toUpperCase()})`)
          } else {
            // Create new price
            price = await stripe.prices.create({
              product: product.id,
              unit_amount: priceInfo.amount,
              currency: priceInfo.currency,
              recurring: {
                interval: 'month'
              },
              nickname: `${productDef.planName}_${priceInfo.currency}`
            })
            console.log(`Created new price: ${price.id} (${priceInfo.amount/100} ${priceInfo.currency.toUpperCase()})`)
          }

          // Update or insert into subscription_plans table
          const planData = {
            name: productDef.planName,
            description: productDef.description,
            amount: priceInfo.amount,
            currency: priceInfo.currency,
            interval: 'month' as const,
            interval_count: 1,
            trial_period_days: productDef.planName === 'basic' || productDef.planName === 'premium' ? 14 : null,
            stripe_price_id: price.id,
            stripe_product_id: product.id,
            features: getFeatures(productDef.planName),
            limits: getLimits(productDef.planName),
            active: true
          }

          // Upsert the plan
          const { error: upsertError } = await supabase
            .from('subscription_plans')
            .upsert(planData, {
              onConflict: 'name,currency',
              ignoreDuplicates: false
            })

          if (upsertError) {
            console.error('Error upserting plan:', upsertError)
          } else {
            console.log(`Upserted plan: ${productDef.planName} (${priceInfo.currency})`)
          }

          results.push({
            plan: productDef.planName,
            currency: priceInfo.currency,
            product_id: product.id,
            price_id: price.id,
            amount: priceInfo.amount
          })

        } catch (error) {
          console.error(`Error creating price for ${productDef.planName} ${priceInfo.currency}:`, error)
        }
      }
    }

    // Also ensure free plan exists
    const freeplanData = {
      name: 'free',
      description: 'Get started with basic portfolio tracking',
      amount: 0,
      currency: 'usd',
      interval: 'month' as const,
      interval_count: 1,
      trial_period_days: null,
      stripe_price_id: 'free',
      stripe_product_id: 'free',
      features: getFeatures('free'),
      limits: getLimits('free'),
      active: true
    }

    await supabase
      .from('subscription_plans')
      .upsert(freeplanData, {
        onConflict: 'name,currency',
        ignoreDuplicates: false
      })

    console.log('Stripe sync completed successfully')

    return {
      success: true,
      message: 'Products and prices synced successfully',
      results: results
    }

  } catch (error) {
    console.error('Stripe sync error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to sync products and prices'
    })
  }
})

function getFeatures(planName: string): string[] {
  switch (planName) {
    case 'free':
      return [
        '1 Portfolio',
        'Basic tracking',
        'Monthly reports',
        'Community support'
      ]
    case 'basic':
      return [
        '5 Portfolios',
        'Advanced analytics',
        'AI recommendations',
        'Weekly reports',
        'Email support'
      ]
    case 'premium':
      return [
        'Unlimited portfolios',
        'Real-time data',
        'Advanced AI insights',
        'Daily reports',
        'Priority support',
        'Custom alerts'
      ]
    default:
      return []
  }
}

function getLimits(planName: string): Record<string, any> {
  switch (planName) {
    case 'free':
      return {
        portfolios: 1,
        ai_recommendations: 0,
        reports_per_month: 1
      }
    case 'basic':
      return {
        portfolios: 5,
        ai_recommendations: 10,
        reports_per_month: 4
      }
    case 'premium':
      return {
        portfolios: -1, // unlimited
        ai_recommendations: -1, // unlimited
        reports_per_month: -1 // unlimited
      }
    default:
      return {}
  }
}