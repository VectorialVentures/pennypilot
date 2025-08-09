import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database'
import { SECURITY_DATA_SOURCES, SYNC_CONFIG } from '~/server/utils/securities-config'

interface SecurityData {
  symbol: string
  name: string
  sector?: string
  industry?: string
  asset_type?: 'stock' | 'etf' | 'crypto' | 'bond' | 'commodity'
  exchange?: string
  currency?: string
}

export default defineEventHandler(async (event) => {
  try {
    // Initialize Supabase client with service role for full access
    const supabase = await serverSupabaseServiceRole<Database>(event)

    const results = {
      processed: 0,
      created: 0,
      updated: 0,
      errors: [] as string[],
      sources: [] as string[]
    }

    // Process each data source URL
    for (const source of SECURITY_DATA_SOURCES) {
      try {
        console.log(`Fetching data from: ${source.name} (${source.url})`)
        results.sources.push(source.name)

        // Fetch JSON data from URL with retry logic
        const data = await fetchWithRetry(source.url)

        if (!Array.isArray(data)) {
          throw new Error('Expected JSON array of securities')
        }

        console.log(`Processing ${data.length} securities from ${source.name}`)

        // Process securities in batches to avoid overwhelming the database
        for (let i = 0; i < data.length; i += SYNC_CONFIG.BATCH_SIZE) {
          const batch = data.slice(i, i + SYNC_CONFIG.BATCH_SIZE)

          for (const item of batch) {
            try {
              const security = await processSecurityItem(item, supabase, results, source.defaultAssetType, source.exchange)
              if (security) {
                results.processed++
              }
            } catch (error) {
              console.error(`Error processing security item:`, error)
              results.errors.push(`${source.name} - Item ${i}: ${error instanceof Error ? error.message : 'Unknown error'}`)
            }
          }

          // Add delay between batches to be respectful to the database
          if (i + SYNC_CONFIG.BATCH_SIZE < data.length) {
            await new Promise(resolve => setTimeout(resolve, SYNC_CONFIG.DELAY_BETWEEN_BATCHES))
          }
        }

      } catch (error) {
        console.error(`Error fetching from ${source.name}:`, error)
        results.errors.push(`${source.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return {
      success: true,
      message: `Processed ${results.processed} securities from ${results.sources.length} sources`,
      data: results
    }

  } catch (error) {
    console.error('Sync securities error:', error)

    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      error: error instanceof Error ? error.stack : undefined
    }
  }
})

async function fetchWithRetry(url: string, retries = SYNC_CONFIG.MAX_RETRIES): Promise<any[]> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'PennyPilot/1.0',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(SYNC_CONFIG.REQUEST_TIMEOUT)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Attempt ${attempt}/${retries} failed for ${url}:`, error)

      if (attempt === retries) {
        throw error
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, SYNC_CONFIG.RETRY_DELAY))
    }
  }

  throw new Error('Failed to fetch after all retries')
}

async function processSecurityItem(
  item: any,
  supabase: any,
  results: { created: number; updated: number; errors: string[] },
  defaultAssetType?: 'stock' | 'etf' | 'crypto' | 'bond' | 'commodity',
  exchange?: string
): Promise<SecurityData | null> {

  // Validate required fields
  if (!item.symbol || typeof item.symbol !== 'string') {
    throw new Error('Missing or invalid symbol field')
  }

  if (!item.name || typeof item.name !== 'string') {
    throw new Error('Missing or invalid name field')
  }

  // Clean and prepare the security data
  const securityData: Database['public']['Tables']['securities']['Insert'] = {
    symbol: item.symbol.toUpperCase().trim(),
    name: item.name.trim(),
    sector: item.sector?.trim() || null,
    industry: item.industry?.trim() || null,
    asset_type: validateAssetType(item.asset_type) || defaultAssetType || 'stock',
    exchange: item.exchange?.trim() || exchange,
    currency: item.currency?.toUpperCase().trim() || 'USD'
  }

  // Check if security already exists
  const { data: existingSecurity, error: selectError } = await supabase
    .from('securities')
    .select('id, symbol, name, sector, industry, updated_at')
    .eq('symbol', securityData.symbol)
    .single()

  if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = no rows returned
    throw new Error(`Database select error: ${selectError.message}`)
  }

  if (existingSecurity) {
    // Update existing security if data has changed
    const hasChanges =
      existingSecurity.name !== securityData.name ||
      existingSecurity.sector !== securityData.sector ||
      existingSecurity.industry !== securityData.industry

    if (hasChanges) {
      const { error: updateError } = await supabase
        .from('securities')
        .update({
          name: securityData.name,
          sector: securityData.sector,
          industry: securityData.industry,
          asset_type: securityData.asset_type,
          exchange: securityData.exchange,
          currency: 'USD',
          updated_at: new Date().toISOString()
        })
        .eq('symbol', securityData.symbol)

      if (updateError) {
        throw new Error(`Database update error: ${updateError.message}`)
      }

      results.updated++
      console.log(`Updated security: ${securityData.symbol}`)
    }
  } else {
    // Create new security
    const { error: insertError } = await supabase
      .from('securities')
      .insert(securityData)

    if (insertError) {
      throw new Error(`Database insert error: ${insertError.message}`)
    }

    results.created++
    console.log(`Created security: ${securityData.symbol}`)
  }

  return securityData
}

function validateAssetType(type: any): 'stock' | 'etf' | 'crypto' | 'bond' | 'commodity' | null {
  if (typeof type !== 'string') return null

  const normalizedType = type.toLowerCase().trim()
  const validTypes = ['stock', 'etf', 'crypto', 'bond', 'commodity']

  return validTypes.includes(normalizedType)
    ? normalizedType as 'stock' | 'etf' | 'crypto' | 'bond' | 'commodity'
    : null
}
