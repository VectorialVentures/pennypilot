import type { Database } from './database'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Portfolio = Database['public']['Tables']['portfolios']['Row']
export type Asset = Database['public']['Tables']['assets']['Row']
export type PortfolioHistory = Database['public']['Tables']['portfolio_history']['Row']
export type AIRecommendation = Database['public']['Tables']['ai_recommendations']['Row']

export interface PortfolioWithAssets extends Portfolio {
  assets: Asset[]
}

export interface PortfolioWithHistory extends Portfolio {
  portfolio_history: PortfolioHistory[]
}

export interface DashboardData {
  profile: Profile
  portfolios: PortfolioWithAssets[]
  totalValue: number
  totalGainLoss: number
  totalGainLossPercentage: number
  recommendations: AIRecommendation[]
}

export interface ChartDataPoint {
  date: string
  value: number
}

export interface AssetPerformance {
  symbol: string
  name: string
  currentPrice: number
  change: number
  changePercentage: number
  marketValue: number
  weight: number
}

export type RecommendationType = 'buy' | 'sell' | 'hold' | 'watch'
export type AssetType = 'stock' | 'etf' | 'crypto' | 'bond' | 'commodity'
export type SubscriptionPlan = 'free' | 'pro' | 'premium'
export type SubscriptionStatus = 'active' | 'inactive' | 'trial' | 'cancelled'
