import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/database'
import { 
  callOpenAI, 
  parseOpenAIResponse,
  PORTFOLIO_ANALYSIS_SCHEMA
} from '~/server/utils/OpenAIService'

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

  // Check if OpenAI API key is configured
  if (!config.openaiApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'OpenAI API key not configured'
    })
  }

  console.log(`Portfolio analysis operation initiated by user: ${user.email || 'unknown'} (${user.id}) with role: ${accountMember?.role || 'none'}`)

  try {
    const body = await readBody(event).catch(() => ({}))
    const { portfolioIds } = body || {}

    console.log('Starting AI portfolio analysis process...')

    // Get portfolios to analyze
    let portfoliosQuery = supabase
      .from('portfolios')
      .select(`
        id, 
        name, 
        description,
        risk_level,
        sectors,
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
        message: 'No portfolios found to analyze',
        processed: 0
      }
    }

    console.log(`Found ${portfolios.length} portfolios to analyze`)

    let processedCount = 0
    let errorCount = 0
    const results = []

    for (const portfolio of portfolios) {
      try {
        console.log(`Processing analysis for portfolio: ${portfolio.name} (${portfolio.id})`)

        // Gather comprehensive portfolio data
        const portfolioData = await gatherPortfolioData(portfolio, supabase)
        if (!portfolioData) {
          console.log(`No analysis data found for ${portfolio.name}, skipping`)
          errorCount++
          results.push({
            portfolioId: portfolio.id,
            portfolioName: portfolio.name,
            status: 'error',
            error: 'No portfolio data available'
          })
          continue
        }

        // Generate the portfolio analysis using OpenAI
        const analysis = await generatePortfolioAnalysis(portfolio, portfolioData, config.openaiApiKey)
        
        if (!analysis) {
          console.log(`Failed to generate analysis for ${portfolio.name}`)
          errorCount++
          results.push({
            portfolioId: portfolio.id,
            portfolioName: portfolio.name,
            status: 'error',
            error: 'Failed to generate analysis'
          })
          continue
        }

        // Validate the analysis response
        if (!analysis.title || !analysis.assessment || !analysis.rating || !analysis.actions || !analysis.risk_assessment) {
          console.error(`Invalid analysis structure for ${portfolio.name}:`, analysis)
          errorCount++
          results.push({
            portfolioId: portfolio.id,
            portfolioName: portfolio.name,
            status: 'error',
            error: 'Invalid analysis structure from AI (missing title, assessment, rating, actions, or risk_assessment)'
          })
          continue
        }

        // Check for existing analysis today to prevent duplicates
        const today = new Date().toISOString().split('T')[0]
        const { data: existingAnalysis } = await supabase
          .from('portfolio_analysis')
          .select('id')
          .eq('portfolio_id', portfolio.id)
          .gte('created_at', today + 'T00:00:00.000Z')
          .lt('created_at', today + 'T23:59:59.999Z')
          .single()

        if (existingAnalysis) {
          console.log(`Analysis already exists for ${portfolio.name} today, skipping`)
          results.push({
            portfolioId: portfolio.id,
            portfolioName: portfolio.name,
            status: 'skipped',
            reason: 'Analysis already exists today'
          })
          continue
        }

        // Insert the portfolio analysis
        const { error: insertError } = await supabase
          .from('portfolio_analysis')
          .insert({
            portfolio_id: portfolio.id,
            title: analysis.title,
            assessment: analysis.assessment,
            rating: analysis.rating
          })

        if (!insertError) {
          // Also store the recommended actions as portfolio recommendations
          if (analysis.actions && analysis.actions.length > 0) {
            console.log(`Processing ${analysis.actions.length} actions for ${portfolio.name}`)
            
            for (const action of analysis.actions) {
              try {
                // Only process actionable recommendations with valid actions
                if (!['buy', 'sell', 'hold'].includes(action.action)) {
                  console.log(`Skipping non-actionable recommendation: ${action.action}`)
                  continue
                }

                let securityId = null
                
                // Resolve symbol to security_id if provided
                if (action.symbol) {
                  const { data: security } = await supabase
                    .from('securities')
                    .select('id')
                    .eq('symbol', action.symbol.toUpperCase())
                    .single()
                  
                  if (security) {
                    securityId = security.id
                  } else {
                    console.warn(`Security not found for symbol: ${action.symbol}`)
                  }
                }

                // Insert portfolio recommendation
                const { error: recommendationError } = await supabase
                  .from('portfolio_recommendations')
                  .insert({
                    portfolio_id: portfolio.id,
                    security_id: securityId,
                    action: action.action as 'buy' | 'sell' | 'hold',
                    amount: action.amount || null,
                    justification: action.reasoning, // Use 'justification' to match database schema
                    date: new Date().toISOString().split('T')[0] // Current date
                  })

                if (recommendationError) {
                  console.error(`Error inserting recommendation for ${portfolio.name}:`, recommendationError)
                } else {
                  console.log(`Created ${action.action} recommendation for ${portfolio.name}${action.symbol ? ` (${action.symbol})` : ''}`)
                }
              } catch (actionError) {
                console.error(`Error processing action for ${portfolio.name}:`, actionError)
              }
            }
          }

          processedCount++
          console.log(`Created analysis for ${portfolio.name}`)
          results.push({
            portfolioId: portfolio.id,
            portfolioName: portfolio.name,
            status: 'success',
            rating: analysis.rating,
            actionsCount: analysis.actions?.length || 0
          })
        } else {
          console.error(`Error inserting analysis for ${portfolio.name}:`, insertError)
          errorCount++
          results.push({
            portfolioId: portfolio.id,
            portfolioName: portfolio.name,
            status: 'error',
            error: insertError.message
          })
        }

        // Add a small delay to avoid hitting rate limits
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error) {
        console.error(`Error processing ${portfolio.name}:`, error)
        errorCount++
        results.push({
          portfolioId: portfolio.id,
          portfolioName: portfolio.name,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return {
      success: true,
      message: `Processed ${processedCount} portfolio analyses with ${errorCount} errors`,
      results: {
        total: portfolios.length,
        processed: processedCount,
        errors: errorCount
      },
      details: results
    }

  } catch (error) {
    console.error('Portfolio analysis process failed:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate portfolio analyses'
    })
  }
})

async function gatherPortfolioData(portfolio: { id: string; name: string; description: string | null; risk_level: string | null; sectors: unknown; created_at: string }, supabase: unknown) {
  try {
    console.log(`Gathering data for portfolio: ${portfolio.name} (${portfolio.id})`)
    
    // Get current portfolio holdings
    const { data: holdings, error: holdingsError } = await supabase
      .from('portfolio_securities')
      .select(`
        amount,
        created_at,
        securities!inner(
          id,
          symbol,
          name,
          sector,
          industry,
          asset_type
        )
      `)
      .eq('portfolio_id', portfolio.id)
      .gt('amount', 0)
    
    if (holdingsError) {
      console.error(`Error fetching holdings for ${portfolio.name}:`, holdingsError)
    }
    console.log(`Found ${holdings?.length || 0} holdings for portfolio ${portfolio.name}`)
    
    if (holdings && holdings.length > 0) {
      console.log('Holdings details:', holdings.map(h => `${h.securities?.symbol}: ${h.amount} shares`))
    }

    // Get current liquid funds
    const { data: liquidFunds } = await supabase
      .from('portfolio_liquidfunds')
      .select('balance, currency')
      .eq('portfolio_id', portfolio.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Get recent portfolio performance history (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const startDate = thirtyDaysAgo.toISOString().split('T')[0]

    const { data: performanceHistory } = await supabase
      .from('portfolio_history')
      .select('date, value')
      .eq('portfolio_id', portfolio.id)
      .gte('date', startDate)
      .order('date', { ascending: false })
      .limit(30)

    // Get recent security analyses for holdings
    const securityIds = holdings?.map(h => h.securities.id) || []
    const { data: securityAnalyses } = await supabase
      .from('security_analysis')
      .select('security_id, assessment, recommendation, created_at')
      .in('security_id', securityIds)
      .gte('created_at', startDate)
      .order('created_at', { ascending: false })

    // Get previous portfolio analyses (last 3)
    const { data: priorAnalyses } = await supabase
      .from('portfolio_analysis')
      .select('title, assessment, rating, created_at')
      .eq('portfolio_id', portfolio.id)
      .order('created_at', { ascending: false })
      .limit(3)

    return {
      portfolio: {
        id: portfolio.id,
        name: portfolio.name,
        description: portfolio.description,
        risk_level: portfolio.risk_level,
        sectors: portfolio.sectors,
        created_at: portfolio.created_at
      },
      holdings: holdings || [],
      liquidFunds: liquidFunds || { balance: 0, currency: 'USD' },
      performanceHistory: performanceHistory || [],
      securityAnalyses: securityAnalyses || [],
      priorAnalyses: priorAnalyses || []
    }

  } catch (error) {
    console.error(`Error gathering data for ${portfolio.name}:`, error)
    return null
  }
}

async function generatePortfolioAnalysis(portfolio: { id: string; name: string }, portfolioData: unknown, openaiApiKey: string) {
  try {
    const prompt = createPortfolioAnalysisPrompt(portfolio, portfolioData)

    // Make API call using the OpenAI service
    const result = await callOpenAI({
      model: 'gpt-4o',  // Using GPT-4 for more sophisticated portfolio analysis
      messages: [
        {
          role: 'system',
          content: 'You are an expert portfolio manager and investment advisor. Provide comprehensive, actionable portfolio analysis based on current holdings, performance, and risk parameters.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,  // Increased for more detailed analysis
      json_schema: PORTFOLIO_ANALYSIS_SCHEMA
    }, openaiApiKey)

    if (!result?.choices?.[0]?.message?.content) {
      console.error(`No content in OpenAI response for portfolio ${portfolio.name}`)
      return null
    }

    // Parse and validate the response using the service
    const content = result.choices[0].message.content
    const parsedResponse = parseOpenAIResponse(content, portfolio.name)
    
    return parsedResponse

  } catch (error) {
    console.error(`Error generating portfolio analysis for ${portfolio.name}:`, error)
    return null
  }
}

function createPortfolioAnalysisPrompt(portfolio: { name: string }, portfolioData: Record<string, unknown>): string {
  // Calculate portfolio metrics
  const portfolioDataObj = portfolioData as Record<string, unknown>
  const { holdings, liquidFunds, performanceHistory, securityAnalyses } = portfolioDataObj
  
  // Validate data types and convert to arrays
  const holdingsArray = Array.isArray(holdings) ? holdings as unknown[] : []
  const performanceArray = Array.isArray(performanceHistory) ? performanceHistory as unknown[] : []
  const securityAnalysesArray = Array.isArray(securityAnalyses) ? securityAnalyses as unknown[] : []
  
  console.log(`Portfolio ${portfolio.name} data summary:`)
  console.log(`- Holdings: ${holdingsArray.length} items`)
  console.log(`- Performance history: ${performanceArray.length} items`)
  console.log(`- Security analyses: ${securityAnalysesArray.length} items`)
  
  // Portfolio composition analysis
  let portfolioComposition = 'No current holdings'
  if (holdingsArray.length > 0) {
    console.log('Processing holdings for portfolio composition...')
    
    // Calculate total shares for percentage calculations (using share counts)
    const totalShares = holdingsArray.reduce((sum: number, holding: unknown) => {
      const holdingObj = holding as Record<string, unknown>
      return sum + (typeof holdingObj.amount === 'number' ? holdingObj.amount : 0)
    }, 0)
    
    const compositionDetails = holdingsArray.map((holding: unknown) => {
      const holdingObj = holding as Record<string, unknown>
      const securities = holdingObj.securities as Record<string, unknown>
      const amount = typeof holdingObj.amount === 'number' ? holdingObj.amount : 0
      const percentage = totalShares > 0 ? ((amount / totalShares) * 100).toFixed(1) : '0'
      return `${securities.symbol} (${securities.name}): ${amount} shares, ${percentage}% of holdings - ${securities.sector || 'Unknown sector'} (${securities.asset_type || 'Unknown type'})`
    }).join('\n')
    
    portfolioComposition = `Total Holdings: ${holdingsArray.length} securities, ${totalShares} total shares\n${compositionDetails}`
    console.log(`Generated portfolio composition with ${holdingsArray.length} holdings`)
  } else {
    console.log('No holdings found for portfolio composition')
  }

  // Performance metrics
  let performanceMetrics = 'No recent performance data available'
  if (performanceArray.length > 1) {
    const performanceData = performanceArray as Record<string, unknown>[]
    const latestValue = performanceData[0].value as number
    const oldestValue = performanceData[performanceData.length - 1].value as number
    const periodReturn = ((latestValue - oldestValue) / oldestValue * 100).toFixed(2)
    const daysTracked = performanceData.length
    performanceMetrics = `Current Portfolio Value: $${latestValue}, ${daysTracked}-day return: ${periodReturn}%`
  }

  // Security analysis summary
  let securityAnalysisContext = 'No recent security analyses available'
  if (securityAnalysesArray.length > 0 && holdingsArray.length > 0) {
    const analysisSummary = securityAnalysesArray.map((analysis: unknown) => {
      const analysisObj = analysis as Record<string, unknown>
      const security = holdingsArray.find((h: unknown) => {
        const holdingObj = h as Record<string, unknown>
        const securities = holdingObj.securities as Record<string, unknown>
        return securities.id === analysisObj.security_id
      })
      const securityObj = security as Record<string, unknown> | undefined
      const securitiesObj = securityObj?.securities as Record<string, unknown> | undefined
      const symbol = securitiesObj?.symbol || 'Unknown'
      const recommendation = typeof analysisObj.recommendation === 'string' ? analysisObj.recommendation : 'unknown'
      const assessment = typeof analysisObj.assessment === 'string' ? analysisObj.assessment : 'No assessment'
      return `${symbol}: ${recommendation.toUpperCase()} - ${assessment.substring(0, 150)}...`
    }).join('\n')
    securityAnalysisContext = `Recent Security Analyses:\n${analysisSummary}`
  }

  // Previous portfolio analyses context
  let priorAnalysisContext = ''
  const priorAnalysesArray = portfolioDataObj.priorAnalyses as unknown[]
  if (priorAnalysesArray && priorAnalysesArray.length > 0) {
    const priorSummary = priorAnalysesArray.map((analysis: unknown, index: number) => {
      const analysisObj = analysis as Record<string, unknown>
      const createdAt = typeof analysisObj.created_at === 'string' ? analysisObj.created_at : new Date().toISOString()
      const date = new Date(createdAt).toLocaleDateString()
      const assessment = typeof analysisObj.assessment === 'string' ? analysisObj.assessment : 'No assessment'
      const rating = typeof analysisObj.rating === 'number' ? analysisObj.rating : 0
      const shortAssessment = assessment.substring(0, 200) + (assessment.length > 200 ? '...' : '')
      return `${index + 1}. ${date} (Rating: ${rating}/10): ${shortAssessment}`
    }).join('\n')
    
    priorAnalysisContext = `\n\nPrevious Portfolio Analyses (for context and consistency):\n${priorSummary}`
  }

  return `You are analyzing a portfolio for comprehensive investment guidance. Please provide a thorough analysis with specific, actionable recommendations.

Portfolio Details:
Name: ${portfolioData.portfolio.name}
Description: ${(portfolioDataObj.portfolio as Record<string, unknown>).description || 'No description provided'}
Target Risk Level: ${(portfolioDataObj.portfolio as Record<string, unknown>).risk_level || 'Not specified'}
Preferred Sectors: ${(portfolioDataObj.portfolio as Record<string, unknown>).sectors ? JSON.stringify((portfolioDataObj.portfolio as Record<string, unknown>).sectors) : 'Not specified'}

Current Holdings:
${portfolioComposition}

Liquid Funds Available: $${(liquidFunds as Record<string, unknown>).balance} (${(liquidFunds as Record<string, unknown>).currency})

Portfolio Performance:
${performanceMetrics}

${securityAnalysisContext}${priorAnalysisContext}

Please provide:
1. A short, descriptive title for your portfolio analysis (3-8 words that capture the main theme, e.g., "Well-Diversified Growth Portfolio", "Over-Concentrated Tech Holdings", "Conservative Income Strategy")

2. A comprehensive assessment of the current portfolio including:
   - Diversification analysis
   - Risk level evaluation vs. target
   - Performance assessment
   - Sector allocation review
   - Individual holding analysis

3. An overall portfolio rating (1-10) based on:
   - Risk-return alignment
   - Diversification quality
   - Performance potential
   - Strategic positioning

4. Specific actionable recommendations including:
   - Securities to buy/sell with specific reasoning
   - Portfolio rebalancing suggestions
   - Cash deployment strategies
   - Risk management improvements
   - Each action should include priority level and reasoning

5. Risk assessment covering:
   - Current risk level vs. target risk profile
   - Alignment recommendations
   - Risk management suggestions

Consider the user's stated risk tolerance and investment preferences. Provide practical, implementable advice that can improve portfolio performance and risk management.`
}