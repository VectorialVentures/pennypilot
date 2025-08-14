import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database'

export default defineEventHandler(async (event) => {
  const portfolioId = getRouterParam(event, 'id')
  const supabase = await serverSupabaseServiceRole<Database>(event)

  if (!portfolioId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Portfolio ID is required'
    })
  }

  try {
    console.log(`Updating portfolio value for portfolio: ${portfolioId}`)

    // Get portfolio securities with current holdings and latest prices
    const today = new Date().toISOString().split('T')[0]
    
    const { data: portfolioSecurities, error: securitiesError } = await supabase
      .from('portfolio_securities')
      .select(`
        id,
        security_id,
        amount,
        worth,
        securities!inner(
          id,
          symbol,
          name
        ),
        security_prices(
          close,
          date
        )
      `)
      .eq('portfolio_id', portfolioId)
      .gt('amount', 0)

    if (securitiesError) {
      console.error('Error fetching portfolio securities:', securitiesError)
      throw securitiesError
    }

    if (!portfolioSecurities || portfolioSecurities.length === 0) {
      // Portfolio has no securities, update with just liquid funds
      const { data: portfolio } = await supabase
        .from('portfolios')
        .select('liquid_funds')
        .eq('id', portfolioId)
        .single()

      const totalValue = portfolio?.liquid_funds || 0

      // Update portfolio history
      await supabase
        .from('portfolio_history')
        .upsert({
          portfolio_id: portfolioId,
          date: today,
          value: totalValue
        }, {
          onConflict: 'portfolio_id,date'
        })

      return {
        success: true,
        portfolioValue: totalValue,
        securitiesValue: 0,
        liquidFunds: portfolio?.liquid_funds || 0
      }
    }

    let totalSecuritiesValue = 0
    const updatedSecurities = []

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
      } else {
        // Fallback to stored worth divided by amount for average price
        currentPrice = portfolioSecurity.amount > 0 ? portfolioSecurity.worth / portfolioSecurity.amount : 0
        console.warn(`No recent price found for security ${portfolioSecurity.securities.symbol}, using average price: ${currentPrice}`)
      }

      const currentWorth = portfolioSecurity.amount * currentPrice
      totalSecuritiesValue += currentWorth

      // Update portfolio_securities with current worth
      if (latestPrice && Math.abs(currentWorth - portfolioSecurity.worth) > 0.01) {
        await supabase
          .from('portfolio_securities')
          .update({
            worth: currentWorth,
            updated_at: new Date().toISOString()
          })
          .eq('id', portfolioSecurity.id)

        console.log(`Updated worth for ${portfolioSecurity.securities.symbol}: ${portfolioSecurity.worth} -> ${currentWorth}`)
      }

      updatedSecurities.push({
        symbol: portfolioSecurity.securities.symbol,
        amount: portfolioSecurity.amount,
        price: currentPrice,
        worth: currentWorth,
        priceDate: latestPrice?.date || 'N/A'
      })
    }

    // Get liquid funds
    const { data: portfolio } = await supabase
      .from('portfolios')
      .select('liquid_funds')
      .eq('id', portfolioId)
      .single()

    const liquidFunds = portfolio?.liquid_funds || 0
    const totalPortfolioValue = totalSecuritiesValue + liquidFunds

    // Update or create portfolio history entry for today
    const { error: historyError } = await supabase
      .from('portfolio_history')
      .upsert({
        portfolio_id: portfolioId,
        date: today,
        value: totalPortfolioValue
      }, {
        onConflict: 'portfolio_id,date'
      })

    if (historyError) {
      console.error('Error updating portfolio history:', historyError)
      throw historyError
    }

    console.log(`Portfolio ${portfolioId} value updated: $${totalPortfolioValue.toFixed(2)} (Securities: $${totalSecuritiesValue.toFixed(2)}, Liquid: $${liquidFunds.toFixed(2)})`)

    return {
      success: true,
      portfolioValue: totalPortfolioValue,
      securitiesValue: totalSecuritiesValue,
      liquidFunds: liquidFunds,
      securities: updatedSecurities,
      date: today
    }

  } catch (error) {
    console.error(`Error updating portfolio ${portfolioId} value:`, error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update portfolio value'
    })
  }
})