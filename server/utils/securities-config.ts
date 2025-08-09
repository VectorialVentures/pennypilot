/**
 * Configuration for securities data sources
 * Add your JSON data source URLs here
 */

export interface SecurityDataSource {
  url: string
  name: string
  description?: string
  exchange?: string // Optional exchange for stocks (e.g., NYSE, NASDAQ)
  defaultAssetType?: 'stock' | 'etf' | 'crypto' | 'bond' | 'commodity'
}

export const SECURITY_DATA_SOURCES: SecurityDataSource[] = [
  {
    url: 'https://raw.githubusercontent.com/rreichel3/US-Stock-Symbols/refs/heads/main/nasdaq/nasdaq_full_tickers.json',
    name: 'NASDAQ Stocks',
    description: 'US listed stocks with sector and industry data',
    defaultAssetType: 'stock',
    exchange: 'NASDAQ'
  },
  {
    url: 'https://raw.githubusercontent.com/rreichel3/US-Stock-Symbols/refs/heads/main/nyse/nyse_full_tickers.json',
    name: 'NYSE Stocks',
    description: 'US listed stocks with sector and industry data',
    defaultAssetType: 'stock',
    exchange: 'NYSE'
  }
  // Add more data sources as needed
  // {
  //   url: 'https://api.example.com/securities/crypto.json',
  //   name: 'Cryptocurrencies',
  //   description: 'Major cryptocurrencies',
  //   defaultAssetType: 'crypto'
  // }
]

/**
 * Configuration for batch processing
 */
export const SYNC_CONFIG = {
  BATCH_SIZE: 100,
  DELAY_BETWEEN_BATCHES: 1000, // milliseconds
  REQUEST_TIMEOUT: 30000, // 30 seconds
  MAX_RETRIES: 3,
  RETRY_DELAY: 5000, // 5 seconds
}

/**
 * Expected JSON structure for security data
 * Your JSON files should contain an array of objects with these fields:
 *
 * Required fields:
 * - symbol: string (ticker symbol, e.g., "AAPL")
 * - name: string (company/security name, e.g., "Apple Inc.")
 *
 * Optional fields:
 * - sector: string (e.g., "Technology")
 * - industry: string (e.g., "Consumer Electronics")
 * - asset_type: string ("stock" | "etf" | "crypto" | "bond" | "commodity")
 * - exchange: string (e.g., "NASDAQ")
 * - currency: string (e.g., "USD")
 *
 * Example JSON structure:
 * [
 *   {
 *     "symbol": "AAPL",
 *     "name": "Apple Inc.",
 *     "sector": "Technology",
 *     "industry": "Consumer Electronics",
 *     "asset_type": "stock",
 *     "exchange": "NASDAQ",
 *     "currency": "USD"
 *   },
 *   {
 *     "symbol": "MSFT",
 *     "name": "Microsoft Corporation",
 *     "sector": "Technology",
 *     "industry": "Software",
 *     "asset_type": "stock",
 *     "exchange": "NASDAQ",
 *     "currency": "USD"
 *   }
 * ]
 */
