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

  const { data: portfolios, error } = await supabase
    .from('portfolios')
    .select(`
      *,
      assets (*)
    `)
    .eq('account_id', account.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return portfolios || []
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

export const useAIRecommendations = async () => {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()
  
  if (!user.value) return []

  const { data: recommendations, error } = await supabase
    .from('ai_recommendations')
    .select('*')
    .eq('user_id', user.value.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) throw error
  return recommendations || []
}