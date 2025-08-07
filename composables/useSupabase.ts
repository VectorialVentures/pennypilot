import type { Database } from '~/types/database'

export const useProfile = async () => {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()
  
  if (!user.value) return null

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.value.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw error
  }

  return profile
}

export const useCreateProfile = async (userData: {
  email: string
  fullName?: string
}) => {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()
  
  if (!user.value) throw new Error('No user found')

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: user.value.id,
      email: userData.email,
      full_name: userData.fullName || null,
      subscription_status: 'trial',
      subscription_plan: 'free',
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export const useUpdateProfile = async (updates: Partial<Database['public']['Tables']['profiles']['Update']>) => {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()
  
  if (!user.value) throw new Error('No user found')

  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.value.id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const usePortfolios = async () => {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()
  
  if (!user.value) return []

  const { data: portfolios, error } = await supabase
    .from('portfolios')
    .select(`
      *,
      assets (*)
    `)
    .eq('user_id', user.value.id)
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

  const { data, error } = await supabase
    .from('portfolios')
    .insert({
      user_id: user.value.id,
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