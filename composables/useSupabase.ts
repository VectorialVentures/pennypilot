import type { Database } from '~/types/database'

export const useProfile = async () => {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()
  
  if (!user.value) return null

  // Get account data 
  const { data: account, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('owner_id', user.value.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw error
  }

  return account
}

export const useCreateAccount = async (userData: {
  email: string
  fullName?: string
}) => {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()
  
  if (!user.value) throw new Error('No user found')

  const { data, error } = await supabase
    .from('accounts')
    .insert({
      name: userData.fullName || userData.email.split('@')[0],
      slug: `user-${user.value.id}`,
      owner_id: user.value.id,
      billing_email: userData.email,
      status: 'active',
      onboarding_completed: false
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export const useUpdateProfile = async (updates: Partial<Database['public']['Tables']['accounts']['Update']>) => {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()
  
  if (!user.value) throw new Error('No user found')

  const { data, error } = await supabase
    .from('accounts')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('owner_id', user.value.id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const usePortfolios = async () => {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()
  
  if (!user.value) return []

  // Get user's account_id first
  const { data: account } = await supabase
    .from('accounts')
    .select('id')
    .eq('owner_id', user.value.id)
    .single()

  if (!account) return []

  // Load just basic portfolio data to avoid complex queries
  const { data: portfolios, error } = await supabase
    .from('portfolios')
    .select('*')
    .eq('account_id', account.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  
  // Add empty arrays for data that will be loaded separately
  const portfoliosWithStructure = (portfolios || []).map(portfolio => ({
    ...portfolio,
    portfolio_securities: [],
    portfolio_liquidfunds: [],
    portfolio_analysis: []
  }))

  return portfoliosWithStructure
}

export const useCreatePortfolio = async (portfolioData: {
  name: string
  description?: string
  isDefault?: boolean
}) => {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()
  
  if (!user.value) throw new Error('No user found')

  // Get user's account_id
  const { data: account } = await supabase
    .from('accounts')
    .select('id')
    .eq('owner_id', user.value.id)
    .single()

  if (!account) throw new Error('No account found for user')

  const { data, error } = await supabase
    .from('portfolios')
    .insert({
      user_id: user.value.id,
      account_id: account.id,
      name: portfolioData.name,
      description: portfolioData.description || null,
      is_default: portfolioData.isDefault || false
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export const usePortfolioAssets = async (portfolioId?: string) => {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()
  
  if (!user.value) return []

  // Get user's account_id first
  const { data: account } = await supabase
    .from('accounts')
    .select('id')
    .eq('owner_id', user.value.id)
    .single()

  if (!account) return []

  // Simplified query - get portfolio securities with basic security info
  let portfolioSecuritiesQuery = supabase
    .from('portfolio_securities')
    .select(`
      *,
      security:securities (
        id,
        symbol,
        name,
        asset_type
      )
    `)

  // Filter by portfolio if specified
  if (portfolioId) {
    portfolioSecuritiesQuery = portfolioSecuritiesQuery.eq('portfolio_id', portfolioId)
  } else {
    // If no specific portfolio, get all securities for user's portfolios
    const { data: userPortfolios } = await supabase
      .from('portfolios')
      .select('id')
      .eq('account_id', account.id)
    
    if (!userPortfolios || userPortfolios.length === 0) return []
    
    const portfolioIds = userPortfolios.map(p => p.id)
    portfolioSecuritiesQuery = portfolioSecuritiesQuery.in('portfolio_id', portfolioIds)
  }

  const { data: portfolioSecurities, error } = await portfolioSecuritiesQuery

  if (error) throw error
  return portfolioSecurities || []
}

export const usePortfolioSecurities = async (portfolioId: string) => {
  const supabase = useSupabaseClient<Database>()
  
  const { data: securities, error } = await supabase
    .from('portfolio_securities')
    .select(`
      *,
      security:securities (
        id,
        symbol,
        name,
        asset_type
      )
    `)
    .eq('portfolio_id', portfolioId)

  if (error) throw error
  return securities || []
}

export const useAIRecommendations = async () => {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()
  
  if (!user.value) return []

  // Get user's account_id first
  const { data: account } = await supabase
    .from('accounts')
    .select('id')
    .eq('owner_id', user.value.id)
    .single()

  if (!account) return []

  const { data: recommendations, error } = await supabase
    .from('portfolio_recommendations')
    .select(`
      *,
      portfolio:portfolios!inner (
        id,
        name
      ),
      security:securities (
        id,
        symbol,
        name
      )
    `)
    .eq('portfolio.account_id', account.id)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) throw error
  return recommendations || []
}

export const usePortfolioLiquidFunds = async (portfolioId: string) => {
  const supabase = useSupabaseClient<Database>()
  
  const { data: liquidFunds, error } = await supabase
    .from('portfolio_liquidfunds')
    .select('*')
    .eq('portfolio_id', portfolioId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return liquidFunds || []
}

export const useUpdateLiquidFunds = async (portfolioId: string, change: number, comment: string) => {
  const supabase = useSupabaseClient<Database>()
  
  // Get current balance
  const { data: currentFunds } = await supabase
    .from('portfolio_liquidfunds')
    .select('balance')
    .eq('portfolio_id', portfolioId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const currentBalance = currentFunds?.balance || 0
  const newBalance = currentBalance + change

  const { data, error } = await supabase
    .from('portfolio_liquidfunds')
    .insert({
      portfolio_id: portfolioId,
      balance: newBalance,
      change: change,
      comment: comment
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export const useSecurityDetails = async (securityId: string) => {
  const supabase = useSupabaseClient<Database>()
  
  const { data: security, error } = await supabase
    .from('securities')
    .select(`
      *,
      security_prices (
        price,
        date
      ),
      security_news (
        id,
        summary,
        url,
        published_at,
        sentiment,
        created_at
      ),
      security_analysis (
        id,
        assessment,
        recommendation,
        created_at
      )
    `)
    .eq('id', securityId)
    .single()

  if (error) throw error
  
  // Sort prices by date (most recent first)
  if (security.security_prices) {
    security.security_prices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }
  
  // Sort news by published date (most recent first)
  if (security.security_news) {
    security.security_news.sort((a, b) => 
      new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime()
    )
  }

  // Sort analysis by date (most recent first)
  if (security.security_analysis) {
    security.security_analysis.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }

  return security
}

export const useSecurityBySymbol = async (symbol: string) => {
  const supabase = useSupabaseClient<Database>()
  
  const { data: security, error } = await supabase
    .from('securities')
    .select(`
      *,
      security_prices (
        price,
        date
      ),
      security_news (
        id,
        summary,
        url,
        published_at,
        sentiment,
        created_at
      ),
      security_analysis (
        id,
        assessment,
        recommendation,
        created_at
      )
    `)
    .eq('symbol', symbol.toUpperCase())
    .single()

  if (error) throw error
  
  // Sort prices by date (most recent first)
  if (security.security_prices) {
    security.security_prices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }
  
  // Sort news by published date (most recent first)
  if (security.security_news) {
    security.security_news.sort((a, b) => 
      new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime()
    )
  }

  // Sort analysis by date (most recent first)
  if (security.security_analysis) {
    security.security_analysis.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }

  return security
}

export const usePortfolioAnalysis = async (portfolioId: string) => {
  const supabase = useSupabaseClient<Database>()
  
  const { data: analysis, error } = await supabase
    .from('portfolio_analysis')
    .select('*')
    .eq('portfolio_id', portfolioId)
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) throw error
  return analysis || []
}

export const useLatestPortfolioAnalysis = async (portfolioId: string) => {
  const supabase = useSupabaseClient<Database>()
  
  const { data: analysis, error } = await supabase
    .from('portfolio_analysis')
    .select('*')
    .eq('portfolio_id', portfolioId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return analysis
}

export const usePortfoliosWithAnalysis = async () => {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()
  
  if (!user.value) return []

  // Get user's account_id first
  const { data: account } = await supabase
    .from('accounts')
    .select('id')
    .eq('owner_id', user.value.id)
    .single()

  if (!account) return []

  const { data: portfolios, error } = await supabase
    .from('portfolios')
    .select(`
      *,
      portfolio_securities (*),
      portfolio_liquidfunds (
        balance,
        created_at
      ),
      portfolio_analysis (
        id,
        assessment,
        rating,
        created_at
      )
    `)
    .eq('account_id', account.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  
  // Sort analysis by date for each portfolio
  const portfoliosWithSortedAnalysis = (portfolios || []).map(portfolio => ({
    ...portfolio,
    portfolio_analysis: portfolio.portfolio_analysis?.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }))

  return portfoliosWithSortedAnalysis
}