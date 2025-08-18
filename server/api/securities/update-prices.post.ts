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

    // 2. Fetch historical prices from TwelveData to ensure 365 days of data
    const results = []
    const today = new Date().toISOString().split('T')[0]
    
    for (const security of uniqueSecurities) {
      try {
        console.log(`Processing price data for ${security.symbol}...`)
        
        // Check what dates we have for the past 365 days
        const oneYearAgo = new Date()
        oneYearAgo.setDate(oneYearAgo.getDate() - 365)
        const startDate = oneYearAgo.toISOString().split('T')[0]
        
        const { data: existingPrices } = await supabase
          .from('security_prices')
          .select('date')
          .eq('security_id', security.id)
          .gte('date', startDate)
          .lte('date', today)
          .order('date')

        // Generate all business days for the past 365 days
        const allBusinessDays = generateBusinessDays(startDate, today)
        
        // Find missing dates
        const existingDates = new Set(existingPrices?.map(p => p.date) || [])
        const missingDates = allBusinessDays.filter(date => !existingDates.has(date))
        
        console.log(`${security.symbol}: Found ${existingDates.size} existing prices, ${missingDates.length} missing dates`)
        
        // If no missing dates, skip this security
        if (missingDates.length === 0) {
          console.log(`${security.symbol} has complete price data for past 365 days, skipping...`)
          results.push({
            symbol: security.symbol,
            status: 'skipped',
            reason: 'Complete price data already exists'
          })
          continue
        }

        // Fetch historical data for missing dates
        const historicalData = await fetchHistoricalPrices(
          security.symbol, 
          config.twelveDataApiKey,
          startDate,
          today
        )
        
        if (!historicalData || historicalData.length === 0) {
          results.push({
            symbol: security.symbol,
            status: 'error',
            reason: 'No historical price data returned from TwelveData'
          })
          continue
        }

        // Filter historical data to only missing dates
        const dataToInsert = historicalData.filter(priceData => 
          missingDates.includes(priceData.date)
        )

        if (dataToInsert.length === 0) {
          results.push({
            symbol: security.symbol,
            status: 'skipped',
            reason: 'No new data to insert'
          })
          continue
        }

        // Insert missing price data
        const priceRecords = dataToInsert.map(priceData => ({
          security_id: security.id,
          date: priceData.date,
          open: priceData.open,
          high: priceData.high,
          low: priceData.low,
          close: priceData.close,
          volume: priceData.volume,
          source: 'twelvedata',
          updated_at: new Date().toISOString()
        }))

        const { error: insertError } = await supabase
          .from('security_prices')
          .upsert(priceRecords, {
            onConflict: 'security_id,date'
          })

        if (insertError) {
          console.error(`Error inserting prices for ${security.symbol}:`, insertError)
          results.push({
            symbol: security.symbol,
            status: 'error',
            reason: insertError.message
          })
          continue
        }

        console.log(`Successfully inserted ${dataToInsert.length} price records for ${security.symbol}`)
        results.push({
          symbol: security.symbol,
          status: 'success',
          inserted_count: dataToInsert.length,
          date_range: `${Math.min(...dataToInsert.map(d => d.date))} to ${Math.max(...dataToInsert.map(d => d.date))}`
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
    const totalInserted = results
      .filter(r => r.status === 'success')
      .reduce((sum, r) => sum + ((r as any).inserted_count || 0), 0)

    console.log(`Historical price update completed: ${successCount} securities processed, ${totalInserted} price records inserted, ${errorCount} errors, ${skippedCount} skipped`)

    return {
      success: true,
      message: `Processed ${successCount} securities with ${totalInserted} historical price records inserted`,
      results: {
        total: uniqueSecurities.length,
        processed: successCount,
        records_inserted: totalInserted,
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

async function fetchHistoricalPrices(symbol: string, apiKey: string, startDate: string, endDate: string) {
  try {
    // TwelveData Time Series endpoint for historical data
    const response = await fetch(
      `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1day&start_date=${startDate}&end_date=${endDate}&apikey=${apiKey}`,
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

    // Validate data structure
    if (!data.values || !Array.isArray(data.values)) {
      console.error(`Invalid historical data structure for ${symbol}:`, data)
      return null
    }

    // Transform API response to our format
    return data.values.map((item: any) => ({
      date: item.datetime,
      open: parseFloat(item.open),
      high: parseFloat(item.high),
      low: parseFloat(item.low),
      close: parseFloat(item.close),
      volume: item.volume ? parseInt(item.volume) : 0
    })).filter((item: any) => 
      // Filter out invalid data
      !isNaN(item.open) && !isNaN(item.high) && !isNaN(item.low) && !isNaN(item.close)
    )

  } catch (error) {
    console.error(`Error fetching historical prices for ${symbol}:`, error)
    return null
  }
}

function generateBusinessDays(startDate: string, endDate: string): string[] {
  const businessDays = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  const current = new Date(start)
  while (current <= end) {
    const dayOfWeek = current.getDay()
    
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      businessDays.push(current.toISOString().split('T')[0])
    }
    
    current.setDate(current.getDate() + 1)
  }
  
  return businessDays
}

// Keep the old function for potential future use with real-time quotes
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