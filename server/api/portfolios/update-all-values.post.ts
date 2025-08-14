import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const supabase = await serverSupabaseServiceRole<Database>(event)

  // Verify authorization for batch operations
  const authHeader = getHeader(event, 'authorization')
  if (config.systemSecret && authHeader !== `Bearer ${config.systemSecret}`) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  try {
    console.log('Starting batch portfolio value update...')

    // Get all portfolios
    const { data: portfolios, error: portfoliosError } = await supabase
      .from('portfolios')
      .select('id, name, liquid_funds')

    if (portfoliosError) {
      console.error('Error fetching portfolios:', portfoliosError)
      throw portfoliosError
    }

    if (!portfolios || portfolios.length === 0) {
      return {
        success: true,
        message: 'No portfolios found',
        updated: 0
      }
    }

    console.log(`Found ${portfolios.length} portfolios to update`)

    const results = []
    const today = new Date().toISOString().split('T')[0]

    for (const portfolio of portfolios) {
      try {
        console.log(`Updating portfolio: ${portfolio.name} (${portfolio.id})`)

        // Get portfolio securities with latest prices
        const { data: portfolioSecurities, error: securitiesError } = await supabase
          .from('portfolio_securities')
          .select(`
            id,
            security_id,
            amount,
            worth,
            securities!inner(
              symbol,
              name
            )
          `)
          .eq('portfolio_id', portfolio.id)
          .gt('amount', 0)

        if (securitiesError) {
          throw securitiesError
        }

        let totalSecuritiesValue = 0
        let pricesFound = 0

        if (portfolioSecurities && portfolioSecurities.length > 0) {
          for (const portfolioSecurity of portfolioSecurities) {
            // Get the most recent price for this security
            const { data: latestPrice } = await supabase
              .from('security_prices')
              .select('close, date')
              .eq('security_id', portfolioSecurity.security_id)
              .order('date', { ascending: false })
              .limit(1)
              .single()

            let currentPrice = 0
            if (latestPrice) {
              currentPrice = latestPrice.close
              pricesFound++
            } else {
              // Fallback to average price from stored worth
              currentPrice = portfolioSecurity.amount > 0 ? portfolioSecurity.worth / portfolioSecurity.amount : 0
            }

            const currentWorth = portfolioSecurity.amount * currentPrice
            totalSecuritiesValue += currentWorth

            // Update portfolio_securities worth if price was found and different
            if (latestPrice && Math.abs(currentWorth - portfolioSecurity.worth) > 0.01) {
              await supabase
                .from('portfolio_securities')
                .update({
                  worth: currentWorth,
                  updated_at: new Date().toISOString()
                })
                .eq('id', portfolioSecurity.id)
            }
          }
        }

        const liquidFunds = portfolio.liquid_funds || 0
        const totalPortfolioValue = totalSecuritiesValue + liquidFunds

        // Update portfolio history
        const { error: historyError } = await supabase
          .from('portfolio_history')
          .upsert({
            portfolio_id: portfolio.id,
            date: today,
            value: totalPortfolioValue
          }, {
            onConflict: 'portfolio_id,date'
          })

        if (historyError) {
          throw historyError
        }

        results.push({
          portfolioId: portfolio.id,
          portfolioName: portfolio.name,
          status: 'success',
          totalValue: totalPortfolioValue,
          securitiesValue: totalSecuritiesValue,
          liquidFunds: liquidFunds,
          securitiesCount: portfolioSecurities?.length || 0,
          pricesFound: pricesFound
        })

        console.log(`✓ Updated ${portfolio.name}: $${totalPortfolioValue.toFixed(2)} (${pricesFound}/${portfolioSecurities?.length || 0} prices found)`)

      } catch (error) {
        console.error(`Error updating portfolio ${portfolio.id}:`, error)
        results.push({
          portfolioId: portfolio.id,
          portfolioName: portfolio.name,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    const successCount = results.filter(r => r.status === 'success').length
    const errorCount = results.filter(r => r.status === 'error').length
    const totalValue = results
      .filter(r => r.status === 'success')
      .reduce((sum, r) => sum + (r.totalValue || 0), 0)

    console.log(`Batch portfolio update completed: ${successCount} updated, ${errorCount} errors, total value: $${totalValue.toFixed(2)}`)

    // Log summary to database
    await supabase.from('system_logs').insert({
      type: 'portfolio_value_update',
      message: `Updated ${successCount} portfolios, ${errorCount} errors, total value: $${totalValue.toFixed(2)}`,
      metadata: {
        total_portfolios: portfolios.length,
        updated: successCount,
        errors: errorCount,
        total_value: totalValue,
        update_time: new Date().toISOString()
      }
    })

    return {
      success: true,
      message: `Updated ${successCount} portfolios`,
      results: {
        total: portfolios.length,
        updated: successCount,
        errors: errorCount,
        totalValue: totalValue
      },
      details: results
    }

  } catch (error) {
    console.error('Batch portfolio value update failed:', error)

    // Log error to database
    await supabase.from('system_logs').insert({
      type: 'portfolio_value_update_error',
      message: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        error_time: new Date().toISOString(),
        stack: error instanceof Error ? error.stack : undefined
      }
    })

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update portfolio values'
    })
  }
})
