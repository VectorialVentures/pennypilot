import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const supabase = await serverSupabaseServiceRole<Database>(event)

  // Check if TwelveData API key is configured
  if (!config.twelveDataApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'TwelveData API key not configured'
    })
  }

  try {
    console.log('Starting security price update process...')

    // 1. Query for all distinct securities that are referenced by portfolios
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

    // 2. Fetch current prices from TwelveData and update security_prices
    const results = []
    const today = new Date().toISOString().split('T')[0]
    
    for (const security of uniqueSecurities) {
      try {
        console.log(`Fetching price for ${security.symbol}...`)
        
        // Check if we already have today's price
        const { data: existingPrice } = await supabase
          .from('security_prices')
          .select('id')
          .eq('security_id', security.id)
          .eq('date', today)
          .single()

        if (existingPrice) {
          console.log(`Price already exists for ${security.symbol} on ${today}, skipping...`)
          results.push({
            symbol: security.symbol,
            status: 'skipped',
            reason: 'Price already exists for today'
          })
          continue
        }

        // Fetch from TwelveData
        const priceData = await fetchSecurityPrice(security.symbol, config.twelveDataApiKey)
        
        if (!priceData) {
          results.push({
            symbol: security.symbol,
            status: 'error',
            reason: 'No price data returned from TwelveData'
          })
          continue
        }

        // 3. Create or update security_price row
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
            source: 'twelvedata',
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'security_id,date'
          })

        if (upsertError) {
          console.error(`Error upserting price for ${security.symbol}:`, upsertError)
          results.push({
            symbol: security.symbol,
            status: 'error',
            reason: upsertError.message
          })
          continue
        }

        console.log(`Successfully updated price for ${security.symbol}: $${priceData.close}`)
        results.push({
          symbol: security.symbol,
          status: 'success',
          price: priceData.close
        })

        // Add delay to respect API rate limits (TwelveData free tier: 8 calls/minute)
        await new Promise(resolve => setTimeout(resolve, 8000))

      } catch (error) {
        console.error(`Error processing ${security.symbol}:`, error)
        results.push({
          symbol: security.symbol,
          status: 'error',
          reason: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    const successCount = results.filter(r => r.status === 'success').length
    const errorCount = results.filter(r => r.status === 'error').length
    const skippedCount = results.filter(r => r.status === 'skipped').length

    console.log(`Price update completed: ${successCount} updated, ${errorCount} errors, ${skippedCount} skipped`)

    return {
      success: true,
      message: `Updated prices for ${successCount} securities`,
      results: {
        total: uniqueSecurities.length,
        updated: successCount,
        errors: errorCount,
        skipped: skippedCount
      },
      details: results
    }

  } catch (error) {
    console.error('Security price update failed:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update security prices'
    })
  }
})

async function fetchSecurityPrice(symbol: string, apiKey: string) {
  try {
    // TwelveData Quote endpoint for real-time price
    const response = await fetch(
      `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${apiKey}`,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      console.error(`TwelveData API error for ${symbol}: ${response.status} ${response.statusText}`)
      return null
    }

    const data = await response.json()

    // Check for API error response
    if (data.status === 'error' || data.code) {
      console.error(`TwelveData API error for ${symbol}:`, data.message || data.code)
      return null
    }

    // Validate required fields
    if (!data.open || !data.high || !data.low || !data.close) {
      console.error(`Invalid price data for ${symbol}:`, data)
      return null
    }

    return {
      open: parseFloat(data.open),
      high: parseFloat(data.high),
      low: parseFloat(data.low),
      close: parseFloat(data.close),
      volume: data.volume ? parseInt(data.volume) : 0
    }

  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error)
    return null
  }
}