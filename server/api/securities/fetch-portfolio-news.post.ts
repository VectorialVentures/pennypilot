import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const supabase = await serverSupabaseServiceRole<Database>(event)

  // Check if Marketaux API key is configured
  if (!config.marketauxApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Marketaux API key not configured'
    })
  }

  try {
    console.log('Starting portfolio news fetch process...')

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
    }, [] as Array<{id: string, symbol: string, name: string, exchange: string}>)

    console.log(`Found ${uniqueSecurities.length} unique securities to fetch news for`)

    // 2. Fetch news from Marketaux and create security_news records
    const results = []
    const today = new Date().toISOString().split('T')[0]

    for (const security of uniqueSecurities) {
      try {
        console.log(`Fetching news for ${security.symbol}...`)

        // Check if we already fetched news recently using the last_news_fetch timestamp
        const { data: securityWithTimestamp } = await supabase
          .from('securities')
          .select('last_news_fetch')
          .eq('id', security.id)
          .single()

        if (securityWithTimestamp?.last_news_fetch) {
          const lastFetch = new Date(securityWithTimestamp.last_news_fetch)
          const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
          
          if (lastFetch > twentyFourHoursAgo) {
            console.log(`News for ${security.symbol} was fetched recently (${lastFetch.toISOString()}), skipping...`)
            results.push({
              symbol: security.symbol,
              status: 'skipped',
              reason: `Recent fetch at ${lastFetch.toISOString()}`
            })
            continue
          }
        }

        // Fetch from Marketaux
        const newsData = await fetchSecurityNews(security.symbol, config.marketauxApiKey)

        if (!newsData || newsData.length === 0) {
          results.push({
            symbol: security.symbol,
            status: 'no_news',
            reason: 'No news articles found'
          })
          continue
        }

        // 3. Create security_news records
        const newsRecords = newsData.map(article => ({
          security_id: security.id,
          summary: article.summary,
          url: article.url,
          published_at: article.published_at,
          sentiment: article.sentiment || null,
          created_at: new Date().toISOString()
        }))

        const { data: insertedNews, error: insertError } = await supabase
          .from('security_news')
          .insert(newsRecords)
          .select()

        if (insertError) {
          console.error(`Error inserting news for ${security.symbol}:`, insertError)
          results.push({
            symbol: security.symbol,
            status: 'error',
            reason: insertError.message
          })
          continue
        }

        console.log(`Successfully inserted ${insertedNews?.length || 0} news articles for ${security.symbol}`)
        
        // Update the last_news_fetch timestamp for this security
        const { error: updateError } = await supabase
          .from('securities')
          .update({ last_news_fetch: new Date().toISOString() })
          .eq('id', security.id)
          
        if (updateError) {
          console.error(`Error updating last_news_fetch for ${security.symbol}:`, updateError)
        }
        
        results.push({
          symbol: security.symbol,
          status: 'success',
          articles_count: insertedNews?.length || 0
        })

        // Add delay to respect API rate limits (Marketaux: 100 requests/day on free tier)
        await new Promise(resolve => setTimeout(resolve, 2000))

      } catch (error) {
        console.error(`Error processing news for ${security.symbol}:`, error)
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
    const noNewsCount = results.filter(r => r.status === 'no_news').length
    const totalArticles = results
      .filter(r => r.status === 'success')
      .reduce((sum, r) => sum + (r.articles_count || 0), 0)

    console.log(`News fetch completed: ${successCount} securities processed, ${totalArticles} articles added, ${errorCount} errors, ${skippedCount} skipped, ${noNewsCount} no news`)

    return {
      success: true,
      message: `Fetched news for ${successCount} securities with ${totalArticles} total articles`,
      results: {
        total: uniqueSecurities.length,
        processed: successCount,
        articles_added: totalArticles,
        errors: errorCount,
        skipped: skippedCount,
        no_news: noNewsCount
      },
      details: results
    }

  } catch (error) {
    console.error('Portfolio news fetch failed:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch portfolio news'
    })
  }
})

async function fetchSecurityNews(symbol: string, apiKey: string) {
  try {
    // Marketaux News API endpoint
    const url = new URL('https://api.marketaux.com/v1/news/all')
    url.searchParams.append('symbols', symbol)
    url.searchParams.append('filter_entities', 'true')
    url.searchParams.append('language', 'en')
    url.searchParams.append('limit', '3') // Reduce limit to avoid rate limiting
    url.searchParams.append('published_after', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]) // Last 7 days, date only
    url.searchParams.append('api_token', apiKey)

    console.log(`Fetching news for ${symbol} from: ${url.toString().replace(apiKey, '[API_KEY]')}`)

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PennyPilot/1.0'
      }
    })

    console.log(`Marketaux API response for ${symbol}: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Marketaux API error for ${symbol}: ${response.status} ${response.statusText}`, errorText)
      return null
    }

    const data = await response.json()

    // Check for API error response
    if (data.error) {
      console.error(`Marketaux API error for ${symbol}:`, data.error)
      return null
    }

    // Return the news data
    if (!data.data || !Array.isArray(data.data)) {
      console.log(`No news data found for ${symbol}`)
      return []
    }

    console.log(`Found ${data.data.length} news articles for ${symbol}`)

    return data.data.map((article: any) => ({
      summary: article.description || article.snippet || article.title,
      url: article.url,
      published_at: article.published_at,
      sentiment: mapSentiment(article.entities?.[symbol]?.sentiment_score)
    })).filter((article: any) => article.summary && article.url)

  } catch (error) {
    console.error(`Error fetching news for ${symbol}:`, error)
    return null
  }
}

function mapSentiment(sentimentScore?: number): Database['public']['Enums']['sentiment'] | null {
  if (typeof sentimentScore !== 'number') return null

  // Use more conservative thresholds for financial news sentiment
  if (sentimentScore >= 0.2) return 'positive'
  if (sentimentScore <= -0.2) return 'negative'
  return 'neutral'
}
