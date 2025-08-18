import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database'
import { 
  callOpenAI, 
  submitBatch, 
  parseOpenAIResponse, 
  validateAssessmentResponse,
  SECURITY_ASSESSMENT_SCHEMA,
  type BatchRequestOptions 
} from '~/server/utils/OpenAIService'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const supabase = await serverSupabaseServiceRole<Database>(event)

  // Check if OpenAI API key is configured
  if (!config.openaiApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'OpenAI API key not configured'
    })
  }

  try {
    // Read request body to check for options
    const body = await readBody(event).catch(() => ({}))
    const useBatching = body.useBatching !== false // Default to true unless explicitly set to false
    
    console.log(`Starting AI security assessment process... (batching: ${useBatching})`)

    // 0. Check if there's already an active batch job today to prevent concurrent jobs (only for batching)
    const today = new Date().toISOString().split('T')[0]
    if (useBatching) {
      const { data: activeJob } = await supabase
        .from('jobs')
        .select('id, created_at')
        .eq('type', 'security_analysis')
        .eq('active', true)
        .gte('created_at', today + 'T00:00:00.000Z')
        .lt('created_at', today + 'T23:59:59.999Z')
        .single()

      if (activeJob) {
        return {
          success: false,
          message: `There is already an active assessment job running today (Job ID: ${activeJob.id})`,
          processed: 0
        }
      }
    }

    // 1. Query for all distinct securities that are referenced by portfolios
    const { data: portfolioSecurities, error: securitiesError } = await supabase
      .from('portfolio_securities')
      .select(`
        security_id,
        securities!inner(
          id,
          symbol,
          name,
          exchange,
          sector,
          industry
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
        processed: 0
      }
    }

    // Get unique securities
    const uniqueSecurities = portfolioSecurities.reduce((acc, item) => {
      const security = item.securities
      if (security && !acc.some(s => s.id === security.id)) {
        acc.push(security)
      }
      return acc
    }, [] as Array<{id: string, symbol: string, name: string, exchange: string, sector: string | null, industry: string | null}>)

    console.log(`Found ${uniqueSecurities.length} unique securities to assess`)

    // 2. Filter securities that need assessment (max one per day)
    const securitiesToAssess = []

    for (const security of uniqueSecurities) {
      // Check if we already have an assessment today
      const { data: existingAssessment } = await supabase
        .from('security_analysis')
        .select('id')
        .eq('security_id', security.id)
        .gte('created_at', today + 'T00:00:00.000Z')
        .lt('created_at', today + 'T23:59:59.999Z')
        .single()

      if (!existingAssessment) {
        securitiesToAssess.push(security)
      }
    }

    console.log(`${securitiesToAssess.length} securities need new assessments`)

    if (securitiesToAssess.length === 0) {
      return {
        success: true,
        message: 'All securities already have recent assessments',
        processed: 0
      }
    }

    if (useBatching) {
      // 3a. Use OpenAI Batch API for cost-effective processing (50% savings)
      return await processBatchAssessments(securitiesToAssess, supabase, config)
    } else {
      // 3b. Process assessments immediately using regular OpenAI API
      return await processImmediateAssessments(securitiesToAssess, supabase, config)
    }

  } catch (error) {
    console.error('AI assessment process failed:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate AI assessments'
    })
  }
})

async function processBatchAssessments(securitiesToAssess: any[], supabase: any, config: any) {
  console.log(`Creating OpenAI batch job for ${securitiesToAssess.length} securities`)

  // Create batch requests for all securities
  const batchRequests: BatchRequestOptions[] = []
  const securityMetadata = [] // Store metadata separately since OpenAI doesn't preserve custom fields
  
  for (const security of securitiesToAssess) {
    const assessmentData = await gatherSecurityData(security, supabase)
    if (assessmentData) {
      try {
        const prompt = createSecurityAssessmentPrompt(security, assessmentData)
        
        // Use a safer custom_id format that avoids symbol parsing issues
        const safeCustomId = `assessment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        const batchRequest: BatchRequestOptions = {
          custom_id: safeCustomId,
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a professional financial analyst providing investment recommendations.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000,
          json_schema: SECURITY_ASSESSMENT_SCHEMA
        }
        
        batchRequests.push(batchRequest)
        securityMetadata.push({
          custom_id: safeCustomId,
          security_id: security.id,
          symbol: security.symbol,
          name: security.name
        })
      } catch (error) {
        console.error(`Error creating batch request for ${security.symbol}:`, error)
      }
    }
  }

  if (batchRequests.length === 0) {
    return {
      success: true,
      message: 'No valid assessment data found',
      processed: 0
    }
  }

  // Submit batch to OpenAI using the service
  const batchResult = await submitBatch(batchRequests, config.openaiApiKey)
  
  if (!batchResult) {
    return {
      success: false,
      message: 'Failed to submit batch to OpenAI',
      processed: 0
    }
  }

  // Create job record in database for tracking
  const { data: jobRecord, error: jobError } = await supabase
    .from('jobs')
    .insert({
      type: 'security_analysis',
      active: true,
      external_id: batchResult.batch_id,
      data: {
        file_id: batchResult.file_id,
        status: batchResult.status,
        security_metadata: securityMetadata, // Store the custom_id to security mapping
        total_assessments: batchRequests.length,
        submitted_at: new Date().toISOString()
      }
    })
    .select()
    .single()

  if (jobError) {
    console.error('Failed to create job record:', jobError)
    // Don't fail the entire operation, just log the error
  }

  return {
    success: true,
    message: `Submitted batch job for ${batchRequests.length} assessments. Job ID: ${jobRecord?.id || 'unknown'}`,
    results: {
      total: securitiesToAssess.length,
      submitted: batchRequests.length,
      batch_id: batchResult.batch_id,
      job_id: jobRecord?.id,
      estimated_completion: '24 hours'
    }
  }
}

async function processImmediateAssessments(securitiesToAssess: any[], supabase: any, config: any) {
  console.log(`Processing ${securitiesToAssess.length} securities immediately`)

  let processedCount = 0
  let errorCount = 0
  const results = []

  for (const security of securitiesToAssess) {
    try {
      console.log(`Processing assessment for ${security.symbol}...`)

      const assessmentData = await gatherSecurityData(security, supabase)
      if (!assessmentData) {
        console.log(`No assessment data found for ${security.symbol}, skipping`)
        errorCount++
        results.push({
          symbol: security.symbol,
          status: 'error',
          error: 'No assessment data available'
        })
        continue
      }

      // Generate the assessment using direct OpenAI API call
      const assessment = await generateImmediateAssessment(security, assessmentData, config.openaiApiKey)
      
      if (!assessment) {
        console.log(`Failed to generate assessment for ${security.symbol}`)
        errorCount++
        results.push({
          symbol: security.symbol,
          status: 'error',
          error: 'Failed to generate assessment'
        })
        continue
      }

      // Validate and save the assessment
      if (assessment.analysis && assessment.recommendation) {
        const validRecommendations = ['buy', 'hold', 'sell']
        const normalizedRecommendation = assessment.recommendation.toLowerCase()
        
        if (!validRecommendations.includes(normalizedRecommendation)) {
          console.error(`Invalid recommendation for ${security.symbol}: ${assessment.recommendation}`)
          errorCount++
          results.push({
            symbol: security.symbol,
            status: 'error',
            error: `Invalid recommendation: ${assessment.recommendation}`
          })
          continue
        }

        // Check for existing assessment today to prevent duplicates
        const today = new Date().toISOString().split('T')[0]
        const { data: existingAssessment } = await supabase
          .from('security_analysis')
          .select('id')
          .eq('security_id', security.id)
          .gte('created_at', today + 'T00:00:00.000Z')
          .lt('created_at', today + 'T23:59:59.999Z')
          .single()

        if (existingAssessment) {
          console.log(`Assessment already exists for ${security.symbol} today, skipping`)
          results.push({
            symbol: security.symbol,
            status: 'skipped',
            reason: 'Assessment already exists today'
          })
          continue
        }

        // Insert the assessment
        const { error: insertError } = await supabase
          .from('security_analysis')
          .insert({
            security_id: security.id,
            assessment: assessment.analysis,
            recommendation: normalizedRecommendation
          })

        if (!insertError) {
          processedCount++
          console.log(`Created assessment for ${security.symbol}`)
          results.push({
            symbol: security.symbol,
            status: 'success'
          })
        } else {
          console.error(`Error inserting assessment for ${security.symbol}:`, insertError)
          errorCount++
          results.push({
            symbol: security.symbol,
            status: 'error',
            error: insertError.message
          })
        }
      } else {
        console.error(`Missing analysis or recommendation for ${security.symbol}`)
        errorCount++
        results.push({
          symbol: security.symbol,
          status: 'error',
          error: 'Missing analysis or recommendation in AI response'
        })
      }

      // Add a small delay to avoid hitting rate limits too hard
      await new Promise(resolve => setTimeout(resolve, 500))

    } catch (error) {
      console.error(`Error processing ${security.symbol}:`, error)
      errorCount++
      results.push({
        symbol: security.symbol,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  return {
    success: true,
    message: `Processed ${processedCount} assessments immediately with ${errorCount} errors`,
    results: {
      total: securitiesToAssess.length,
      processed: processedCount,
      errors: errorCount,
      mode: 'immediate'
    },
    details: results
  }
}

function createSecurityAssessmentPrompt(security: any, assessmentData: any): string {
  // Calculate price performance metrics
  const prices = assessmentData.priceHistory
  let priceMetrics = 'No recent price data available'
  
  if (prices.length > 0) {
    const currentPrice = prices[0].close
    const oldestPrice = prices[prices.length - 1].close
    const monthlyReturn = ((currentPrice - oldestPrice) / oldestPrice * 100).toFixed(2)
    
    const highs = prices.map(p => p.high)
    const lows = prices.map(p => p.low)
    const monthHigh = Math.max(...highs)
    const monthLow = Math.min(...lows)
    
    priceMetrics = `Current: $${currentPrice}, Monthly return: ${monthlyReturn}%, Month high: $${monthHigh}, Month low: $${monthLow}`
  }
  
  // Summarize news sentiment
  const news = assessmentData.newsArticles
  let newsSummary = 'No recent news available'
  
  if (news.length > 0) {
    const sentiments = news.map(n => n.sentiment).filter(s => s)
    const positive = sentiments.filter(s => s === 'positive').length
    const negative = sentiments.filter(s => s === 'negative').length
    const neutral = sentiments.filter(s => s === 'neutral').length
    
    const recentNews = news.slice(0, 3).map(n => `"${n.summary}"`).join('; ')
    newsSummary = `Sentiment: ${positive} positive, ${negative} negative, ${neutral} neutral. Recent headlines: ${recentNews}`
  }

  // Summarize prior assessments for context
  const priorAssessments = assessmentData.priorAssessments
  let priorContext = ''
  
  if (priorAssessments.length > 0) {
    const assessmentSummaries = priorAssessments.map((assessment, index) => {
      const date = new Date(assessment.created_at).toLocaleDateString()
      const shortAnalysis = assessment.assessment.substring(0, 200) + (assessment.assessment.length > 200 ? '...' : '')
      return `${index + 1}. ${date}: ${assessment.recommendation.toUpperCase()} - ${shortAnalysis}`
    }).join('\n')
    
    priorContext = `
Previous Assessments (for context and consistency):
${assessmentSummaries}`
  }
  
  return `You are a financial analyst providing investment recommendations. Analyze the following security and provide a concise assessment with a recommendation.

Security: ${assessmentData.security.name} (${assessmentData.security.symbol})
Exchange: ${assessmentData.security.exchange}
Sector: ${assessmentData.security.sector || 'Unknown'}
Industry: ${assessmentData.security.industry || 'Unknown'}

Price Performance (Past Month): ${priceMetrics}

News Analysis (Past Month): ${newsSummary}${priorContext}

Please provide:
1. A comprehensive but concise analysis (3-4 paragraphs) covering fundamentals, technical analysis, and market sentiment
2. A clear investment recommendation: BUY, HOLD, or SELL
3. Consider any previous assessments for consistency, but prioritize current data and market conditions`
}

// This function is now replaced by the OpenAI service
// Keeping for reference during migration
// TODO: Remove after migration is complete

async function generateImmediateAssessment(security: any, assessmentData: any, openaiApiKey: string) {
  try {
    const prompt = createSecurityAssessmentPrompt(security, assessmentData)

    // Make API call using the service
    const result = await callOpenAI({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional financial analyst providing investment recommendations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
      json_schema: SECURITY_ASSESSMENT_SCHEMA
    }, openaiApiKey)

    if (!result?.choices?.[0]?.message?.content) {
      console.error(`No content in OpenAI response for ${security.symbol}`)
      return null
    }

    // Parse and validate the response using the service
    const content = result.choices[0].message.content
    const parsedResponse = parseOpenAIResponse(content, security.symbol)
    
    if (!parsedResponse) {
      return null
    }
    
    return validateAssessmentResponse(parsedResponse, security.symbol)

  } catch (error) {
    console.error(`Error generating immediate assessment for ${security.symbol}:`, error)
    return null
  }
}

async function gatherSecurityData(security: any, supabase: any) {
  try {
    // Get past month's price history
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    const startDate = oneMonthAgo.toISOString().split('T')[0]

    const { data: priceHistory } = await supabase
      .from('security_prices')
      .select('date, open, high, low, close, volume')
      .eq('security_id', security.id)
      .gte('date', startDate)
      .order('date', { ascending: false })
      .limit(30)

    // Get recent news articles (past month)
    const { data: newsArticles } = await supabase
      .from('security_news')
      .select('summary, published_at, sentiment')
      .eq('security_id', security.id)
      .gte('created_at', oneMonthAgo.toISOString())
      .order('published_at', { ascending: false })
      .limit(10)

    // Get the most recent prior assessments (last 3)
    const { data: priorAssessments } = await supabase
      .from('security_analysis')
      .select('assessment, recommendation, created_at')
      .eq('security_id', security.id)
      .order('created_at', { ascending: false })
      .limit(3)

    return {
      security: {
        symbol: security.symbol,
        name: security.name,
        exchange: security.exchange,
        sector: security.sector,
        industry: security.industry
      },
      priceHistory: priceHistory || [],
      newsArticles: newsArticles || [],
      priorAssessments: priorAssessments || []
    }

  } catch (error) {
    console.error(`Error gathering data for ${security.symbol}:`, error)
    return null
  }
}

