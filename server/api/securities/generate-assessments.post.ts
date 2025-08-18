import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database'

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
    console.log('Starting AI security assessment process...')

    // 0. Check if there's already an active batch job today to prevent concurrent jobs
    const today = new Date().toISOString().split('T')[0]
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

    // 3. Use OpenAI Batch API for cost-effective processing (50% savings)
    console.log(`Creating OpenAI batch job for ${securitiesToAssess.length} securities`)

    // Create batch requests for all securities
    const batchRequests = []
    const securityMetadata = [] // Store metadata separately since OpenAI doesn't preserve custom fields
    
    for (const security of securitiesToAssess) {
      const assessmentData = await gatherSecurityData(security, supabase)
      if (assessmentData) {
        const batchRequest = await createBatchRequest(security, assessmentData)
        if (batchRequest) {
          batchRequests.push(batchRequest)
          securityMetadata.push({
            custom_id: batchRequest.custom_id,
            security_id: security.id,
            symbol: security.symbol,
            name: security.name
          })
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

    // Submit batch to OpenAI
    const batchResult = await submitOpenAIBatch(batchRequests, config.openaiApiKey)
    
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

  } catch (error) {
    console.error('AI assessment process failed:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate AI assessments'
    })
  }
})

async function createBatchRequest(security: any, assessmentData: any) {
  try {
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
    
    const prompt = `You are a financial analyst providing investment recommendations. Analyze the following security and provide a concise assessment with a recommendation.

Security: ${assessmentData.security.name} (${assessmentData.security.symbol})
Exchange: ${assessmentData.security.exchange}
Sector: ${assessmentData.security.sector || 'Unknown'}
Industry: ${assessmentData.security.industry || 'Unknown'}

Price Performance (Past Month): ${priceMetrics}

News Analysis (Past Month): ${newsSummary}

Please provide:
1. A comprehensive but concise analysis (3-4 paragraphs) covering fundamentals, technical analysis, and market sentiment
2. A clear investment recommendation: BUY, HOLD, or SELL

Format your response as JSON:
{
  "analysis": "Your detailed analysis here...",
  "recommendation": "buy|hold|sell"
}`

    // Use a safer custom_id format that avoids symbol parsing issues
    const safeCustomId = `assessment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return {
      custom_id: safeCustomId,
      method: "POST",
      url: "/v1/chat/completions",
      body: {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a professional financial analyst. Always respond with valid JSON containing analysis and recommendation fields."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      }
    }
  } catch (error) {
    console.error(`Error creating batch request for ${security.symbol}:`, error)
    return null
  }
}

async function submitOpenAIBatch(batchRequests: any[], openaiApiKey: string) {
  try {
    // Create the batch file content
    const batchContent = batchRequests.map(req => JSON.stringify(req)).join('\n')
    
    // Upload batch file to OpenAI
    const fileResponse = await fetch('https://api.openai.com/v1/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: (() => {
        const formData = new FormData()
        formData.append('purpose', 'batch')
        formData.append('file', new Blob([batchContent], { type: 'application/jsonl' }), 'batch_requests.jsonl')
        return formData
      })()
    })

    if (!fileResponse.ok) {
      console.error(`OpenAI file upload error: ${fileResponse.status} ${fileResponse.statusText}`)
      return null
    }

    const fileResult = await fileResponse.json()
    console.log(`Uploaded batch file: ${fileResult.id}`)

    // Create batch job
    const batchResponse = await fetch('https://api.openai.com/v1/batches', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input_file_id: fileResult.id,
        endpoint: '/v1/chat/completions',
        completion_window: '24h'
      })
    })

    if (!batchResponse.ok) {
      console.error(`OpenAI batch creation error: ${batchResponse.status} ${batchResponse.statusText}`)
      return null
    }

    const batchResult = await batchResponse.json()
    console.log(`Created batch job: ${batchResult.id}`)

    return {
      batch_id: batchResult.id,
      file_id: fileResult.id,
      status: batchResult.status
    }

  } catch (error) {
    console.error('Error submitting OpenAI batch:', error)
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

    return {
      security: {
        symbol: security.symbol,
        name: security.name,
        exchange: security.exchange,
        sector: security.sector,
        industry: security.industry
      },
      priceHistory: priceHistory || [],
      newsArticles: newsArticles || []
    }

  } catch (error) {
    console.error(`Error gathering data for ${security.symbol}:`, error)
    return null
  }
}

