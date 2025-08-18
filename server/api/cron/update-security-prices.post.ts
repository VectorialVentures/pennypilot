import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const supabase = await serverSupabaseServiceRole<Database>(event)

  // Verify cron authorization (for production deployments)
  const authHeader = getHeader(event, 'authorization')
  if (config.systemSecret && authHeader !== `Bearer ${config.systemSecret}`) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  // Check if TwelveData API key is configured
  if (!config.twelveDataApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'TwelveData API key not configured'
    })
  }

  try {
    console.log('Starting scheduled security price update...')

    // Check if market is open (basic NYSE hours check)
    const now = new Date()
    const nyTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}))
    const dayOfWeek = nyTime.getDay()
    const hour = nyTime.getHours()

    // Skip if weekend (Saturday = 6, Sunday = 0)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      console.log('Market is closed (weekend), skipping price update')
      return {
        success: true,
        message: 'Market closed (weekend)',
        updated: 0
      }
    }

    // Only update during extended hours (6 AM - 8 PM ET) to catch pre/post market
    if (hour < 6 || hour > 20) {
      console.log('Outside market hours, skipping price update')
      return {
        success: true,
        message: 'Outside market hours',
        updated: 0
      }
    }

    // Get all active portfolio securities
    const { data: portfolioSecurities, error: securitiesError } = await supabase
      .from('portfolio_securities')
      .select(`
        security_id,
        securities!inner(
          id,
          symbol,
          name,
          exchange
        )
      `)
      .gt('amount', 0) // Only securities with current holdings

    if (securitiesError) {
      console.error('Error fetching portfolio securities:', securitiesError)
      throw securitiesError
    }

    if (!portfolioSecurities || portfolioSecurities.length === 0) {
      return {
        success: true,
        message: 'No securities found in portfolios',
        updated: 0
      }
    }

    // Get unique securities
    const uniqueSecurities = portfolioSecurities.reduce((acc, item) => {
      const security = item.securities
      if (security && !acc.some(s => s.id === security.id)) {
        acc.push(security)
      }
      return acc
    }, [] as Array<{id: string, symbol: string, name: string, exchange: string}>)

    console.log(`Found ${uniqueSecurities.length} unique securities to update`)

    // Batch process securities with rate limiting
    const batchSize = 5 // Process 5 securities at a time
    const results = []
    const today = new Date().toISOString().split('T')[0]

    for (let i = 0; i < uniqueSecurities.length; i += batchSize) {
      const batch = uniqueSecurities.slice(i, i + batchSize)

      console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(uniqueSecurities.length/batchSize)}`)

      const batchPromises = batch.map(async (security) => {
        try {
          // Check if we already have today's price
          const { data: existingPrice } = await supabase
            .from('security_prices')
            .select('id, close')
            .eq('security_id', security.id)
            .eq('date', today)
            .single()

          if (existingPrice) {
            return {
              symbol: security.symbol,
              status: 'skipped',
              reason: 'Price already exists for today',
              price: existingPrice.close
            }
          }

          // Fetch from TwelveData with retry logic
          const priceData = await fetchSecurityPriceWithRetry(security.symbol, config.twelveDataApiKey, 3)

          if (!priceData) {
            return {
              symbol: security.symbol,
              status: 'error',
              reason: 'No price data returned from TwelveData'
            }
          }

          // Validate price data
          if (priceData.close <= 0 || isNaN(priceData.close)) {
            return {
              symbol: security.symbol,
              status: 'error',
              reason: 'Invalid price data received'
            }
          }

          // Upsert security price
          const { error: upsertError } = await supabase
            .from('security_prices')
            .upsert({
              security_id: security.id,
              date: today,
              open: priceData.open,
              high: priceData.high,
              low: priceData.low,
              close: priceData.close,
              volume: priceData.volume,
              source: 'twelvedata'
            }, {
              onConflict: 'security_id,date'
            })

          if (upsertError) {
            console.error(`Error upserting price for ${security.symbol}:`, upsertError)
            return {
              symbol: security.symbol,
              status: 'error',
              reason: upsertError.message
            }
          }

          console.log(`Successfully updated price for ${security.symbol}: $${priceData.close}`)
          return {
            symbol: security.symbol,
            status: 'success',
            price: priceData.close
          }

        } catch (error) {
          console.error(`Error processing ${security.symbol}:`, error)
          return {
            symbol: security.symbol,
            status: 'error',
            reason: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      })

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)

      // Rate limiting: wait between batches (TwelveData free tier: 8 calls/minute)
      if (i + batchSize < uniqueSecurities.length) {
        console.log('Waiting 60 seconds for rate limiting...')
        await new Promise(resolve => setTimeout(resolve, 60000))
      }
    }

    const successCount = results.filter(r => r.status === 'success').length
    const errorCount = results.filter(r => r.status === 'error').length
    const skippedCount = results.filter(r => r.status === 'skipped').length

    console.log(`Scheduled price update completed: ${successCount} updated, ${errorCount} errors, ${skippedCount} skipped`)

    // Log summary to database for monitoring
    await supabase.from('system_logs').insert({
      type: 'price_update',
      message: `Updated ${successCount} securities, ${errorCount} errors, ${skippedCount} skipped`,
      metadata: {
        total: uniqueSecurities.length,
        updated: successCount,
        errors: errorCount,
        skipped: skippedCount,
        batch_time: new Date().toISOString()
      }
    })

    return {
      success: true,
      message: `Updated prices for ${successCount} securities`,
      results: {
        total: uniqueSecurities.length,
        updated: successCount,
        errors: errorCount,
        skipped: skippedCount
      },
      details: results.filter(r => r.status === 'error') // Only return errors for debugging
    }

  } catch (error) {
    console.error('Scheduled security price update failed:', error)

    // Log error to database
    await supabase.from('system_logs').insert({
      type: 'price_update_error',
      message: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        error_time: new Date().toISOString(),
        stack: error instanceof Error ? error.stack : undefined
      }
    })

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update security prices'
    })
  }
})

async function fetchSecurityPriceWithRetry(symbol: string, apiKey: string, retries: number = 3): Promise<any> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const priceData = await fetchSecurityPrice(symbol, apiKey)
      if (priceData) {
        return priceData
      }

      if (attempt < retries) {
        console.log(`Attempt ${attempt} failed for ${symbol}, retrying in ${attempt * 2} seconds...`)
        await new Promise(resolve => setTimeout(resolve, attempt * 2000))
      }
    } catch (error) {
      console.error(`Attempt ${attempt} error for ${symbol}:`, error)
      if (attempt === retries) {
        throw error
      }
      await new Promise(resolve => setTimeout(resolve, attempt * 2000))
    }
  }

  return null
}

async function fetchSecurityPrice(symbol: string, apiKey: string) {
  try {
    // TwelveData Quote endpoint for real-time price
    const response = await fetch(
      `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${apiKey}&dp=2`,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      }
    )

    if (!response.ok) {
      throw new Error(`TwelveData API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    // Check for API error response
    if (data.status === 'error' || data.code) {
      throw new Error(`TwelveData API error: ${data.message || data.code}`)
    }

    // Handle rate limit
    if (data.code === 429) {
      throw new Error('API rate limit exceeded')
    }

    // Validate required fields
    if (!data.open || !data.high || !data.low || !data.close) {
      throw new Error('Invalid price data structure')
    }

    return {
      open: parseFloat(data.open),
      high: parseFloat(data.high),
      low: parseFloat(data.low),
      close: parseFloat(data.close),
      volume: data.volume ? parseInt(data.volume.replace(/,/g, '')) : 0
    }

  } catch (error) {
    throw error
  }
}
