import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/database'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  
  // Verify admin user authentication - this is an admin-only operation
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required'
    })
  }

  // Use service role for database operations to access all portfolios
  const supabase = await serverSupabaseServiceRole<Database>(event)

  // Check if user has admin privileges using account_members table
  // For now, allowing any authenticated user - this should be restricted in production
  const { data: accountMember, error: memberError } = await supabase
    .from('account_members')
    .select('id, role, user_id')
    .eq('user_id', user.id)
    .single()

  if (memberError) {
    console.warn('Could not fetch user account membership:', memberError)
    // Allow operation to proceed but log the warning
  }

  // TODO: Implement proper admin role check here
  // Examples:
  // 1. Check if role is 'admin': if (accountMember?.role !== 'admin')
  // 2. Check admin email list: if (!ADMIN_EMAILS.includes(user.email))
  // 3. Check account owner status
  // 
  // For now, allowing any authenticated user to proceed
  console.log(`Admin operation initiated by user: ${user.email || 'unknown'} (${user.id}) with role: ${accountMember?.role || 'none'}`)

  const body = await readBody(event)
  const { 
    portfolioIds, 
    startDate, 
    endDate, 
    forceRecalculate = false 
  } = body || {}

  try {
    console.log('Starting historical portfolio value computation...')
    const startTime = Date.now()

    // Get portfolios to process
    let portfoliosQuery = supabase
      .from('portfolios')
      .select(`
        id, 
        name, 
        user_id,
        created_at
      `)

    if (portfolioIds && portfolioIds.length > 0) {
      portfoliosQuery = portfoliosQuery.in('id', portfolioIds)
    }

    const { data: portfolios, error: portfoliosError } = await portfoliosQuery

    if (portfoliosError) {
      console.error('Error fetching portfolios:', portfoliosError)
      throw portfoliosError
    }

    if (!portfolios || portfolios.length === 0) {
      return {
        success: true,
        message: 'No portfolios found to process',
        results: { processed: 0, totalDays: 0, totalValues: 0 }
      }
    }

    console.log(`Processing ${portfolios.length} portfolios for historical value computation`)

    const results = []
    let totalDaysProcessed = 0
    let totalValuesComputed = 0

    for (const portfolio of portfolios) {
      try {
        console.log(`Processing portfolio: ${portfolio.name} (${portfolio.id})`)

        // Determine date range for this portfolio
        const portfolioStartDate = startDate || portfolio.created_at.split('T')[0]
        const portfolioEndDate = endDate || new Date().toISOString().split('T')[0]

        console.log(`Date range for ${portfolio.name}: ${portfolioStartDate} to ${portfolioEndDate}`)

        // Get existing portfolio history to determine missing dates
        const { data: existingHistory } = await supabase
          .from('portfolio_history')
          .select('date')
          .eq('portfolio_id', portfolio.id)
          .gte('date', portfolioStartDate)
          .lte('date', portfolioEndDate)

        const existingDates = new Set(existingHistory?.map(h => h.date) || [])

        // Generate list of all dates in range
        const allDates = []
        const currentDate = new Date(portfolioStartDate)
        const endDateObj = new Date(portfolioEndDate)

        while (currentDate <= endDateObj) {
          const dateStr = currentDate.toISOString().split('T')[0]
          if (forceRecalculate || !existingDates.has(dateStr)) {
            allDates.push(dateStr)
          }
          currentDate.setDate(currentDate.getDate() + 1)
        }

        console.log(`Computing values for ${allDates.length} dates for portfolio ${portfolio.name}`)

        let portfolioValuesComputed = 0

        for (const date of allDates) {
          try {
            const value = await computePortfolioValueForDate(supabase, portfolio.id, date)
            
            if (value !== null) {
              // Upsert the historical value
              const { error: historyError } = await supabase
                .from('portfolio_history')
                .upsert({
                  portfolio_id: portfolio.id,
                  date: date,
                  value: value
                }, {
                  onConflict: 'portfolio_id,date'
                })

              if (historyError) {
                console.error(`Error saving history for ${portfolio.name} on ${date}:`, historyError)
              } else {
                portfolioValuesComputed++
                totalValuesComputed++
              }
            }
          } catch (error) {
            console.error(`Error computing value for ${portfolio.name} on ${date}:`, error)
          }
        }

        totalDaysProcessed += allDates.length

        results.push({
          portfolioId: portfolio.id,
          portfolioName: portfolio.name,
          status: 'success',
          datesProcessed: allDates.length,
          valuesComputed: portfolioValuesComputed,
          dateRange: {
            start: portfolioStartDate,
            end: portfolioEndDate
          }
        })

        console.log(`✓ Completed ${portfolio.name}: ${portfolioValuesComputed}/${allDates.length} values computed`)

      } catch (error) {
        console.error(`Error processing portfolio ${portfolio.id}:`, error)
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
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2)

    console.log(`Historical computation completed: ${successCount} portfolios, ${totalValuesComputed} values computed, ${processingTime}s`)

    return {
      success: true,
      message: `Processed ${successCount} portfolios with ${totalValuesComputed} historical values`,
      results: {
        total: portfolios.length,
        processed: successCount,
        errors: errorCount,
        totalDays: totalDaysProcessed,
        totalValues: totalValuesComputed,
        processingTimeSeconds: processingTime
      },
      details: results
    }

  } catch (error) {
    console.error('Historical portfolio value computation failed:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to compute historical portfolio values'
    })
  }
})

async function computePortfolioValueForDate(
  supabase: any, 
  portfolioId: string, 
  date: string
): Promise<number | null> {
  try {
    // Get all transactions up to this date to determine holdings
    const { data: transactions, error: transactionsError } = await supabase
      .from('portfolio_transactions')
      .select(`
        security_id,
        action,
        amount,
        date
      `)
      .eq('portfolio_id', portfolioId)
      .lte('date', date)
      .order('date', { ascending: true })

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError)
      return null
    }

    // Calculate holdings for each security as of this date
    const holdings = new Map<string, number>()
    
    if (transactions) {
      for (const transaction of transactions) {
        if (!transaction.security_id || !transaction.amount) continue
        
        const currentAmount = holdings.get(transaction.security_id) || 0
        
        if (transaction.action === 'buy') {
          holdings.set(transaction.security_id, currentAmount + transaction.amount)
        } else if (transaction.action === 'sell') {
          holdings.set(transaction.security_id, currentAmount - transaction.amount)
        }
      }
    }

    // Remove zero or negative holdings
    for (const [securityId, amount] of holdings.entries()) {
      if (amount <= 0) {
        holdings.delete(securityId)
      }
    }

    let totalSecuritiesValue = 0

    // Get prices for each held security on or before this date
    for (const [securityId, amount] of holdings.entries()) {
      const { data: priceData } = await supabase
        .from('security_prices')
        .select('close')
        .eq('security_id', securityId)
        .lte('date', date)
        .order('date', { ascending: false })
        .limit(1)
        .single()

      if (priceData?.close) {
        totalSecuritiesValue += amount * priceData.close
      } else {
        // If no price data available, try to get the most recent price
        const { data: fallbackPrice } = await supabase
          .from('security_prices')
          .select('close')
          .eq('security_id', securityId)
          .order('date', { ascending: false })
          .limit(1)
          .single()

        if (fallbackPrice?.close) {
          totalSecuritiesValue += amount * fallbackPrice.close
        }
        // If still no price, we skip this security (value = 0)
      }
    }

    // Get liquid funds for this date (simplified - using current liquid funds)
    // In a more sophisticated system, you'd track liquid fund changes over time
    const { data: portfolio } = await supabase
      .from('portfolios')
      .select('id')
      .eq('id', portfolioId)
      .single()

    // Get liquid funds changes up to this date
    const { data: liquidFundsChanges } = await supabase
      .from('portfolio_liquidfunds')
      .select('balance, change, created_at')
      .eq('portfolio_id', portfolioId)
      .lte('created_at', `${date}T23:59:59.999Z`)
      .order('created_at', { ascending: false })
      .limit(1)

    const liquidFunds = liquidFundsChanges?.[0]?.balance || 0

    const totalValue = totalSecuritiesValue + liquidFunds

    return totalValue

  } catch (error) {
    console.error(`Error computing portfolio value for date ${date}:`, error)
    return null
  }
}