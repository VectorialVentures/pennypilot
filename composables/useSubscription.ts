interface PlanLimits {
  portfolios: number
  ai_recommendations: number
  reports_per_month: number
}

interface SubscriptionPlan {
  id: string
  name: string
  description: string
  amount: number
  currency: string
  interval: string
  features: string[]
  limits: PlanLimits
  active: boolean
}

interface Subscription {
  id: string
  stripe_subscription_id: string
  status: string
  current_period_start: string
  current_period_end: string
  trial_start?: string
  trial_end?: string
  cancel_at_period_end: boolean
}

export const useSubscription = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  
  // Global state from middleware
  const currentPlan = useState<SubscriptionPlan>('currentPlan')
  const currentSubscription = useState<Subscription>('currentSubscription')
  const currentAccount = useState('currentAccount')

  // Reactive getters
  const isFreePlan = computed(() => currentPlan.value?.name?.toLowerCase() === 'free')
  const isBasicPlan = computed(() => currentPlan.value?.name?.toLowerCase() === 'basic')
  const isPremiumPlan = computed(() => currentPlan.value?.name?.toLowerCase() === 'premium')
  const isPaidPlan = computed(() => !isFreePlan.value)
  
  const isTrialing = computed(() => {
    const subscription = currentSubscription.value
    return subscription?.status === 'trialing' || 
           (subscription?.trial_end && new Date(subscription.trial_end) > new Date())
  })

  const trialDaysLeft = computed(() => {
    const subscription = currentSubscription.value
    if (!subscription?.trial_end) return 0
    
    const trialEnd = new Date(subscription.trial_end)
    const now = new Date()
    const diffTime = trialEnd.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return Math.max(0, diffDays)
  })

  const planLimits = computed(() => currentPlan.value?.limits || {
    portfolios: 1,
    ai_recommendations: 0,
    reports_per_month: 1
  })

  // Feature access checks
  const canCreatePortfolio = async () => {
    if (!user.value) return false
    
    const limit = planLimits.value.portfolios
    if (limit === -1) return true // Unlimited
    
    const { count } = await supabase
      .from('portfolio')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.value.id)
    
    return (count || 0) < limit
  }

  const canAccessAIRecommendations = computed(() => {
    return planLimits.value.ai_recommendations > 0 || planLimits.value.ai_recommendations === -1
  })

  const canAccessAdvancedAnalytics = computed(() => {
    return isPremiumPlan.value
  })

  const canAccessRealTimeData = computed(() => {
    return isPremiumPlan.value
  })

  const hasFeature = (feature: string): boolean => {
    const features = currentPlan.value?.features || []
    return features.some(f => f.toLowerCase().includes(feature.toLowerCase()))
  }

  // Usage tracking
  const getUsageCount = async (metric: 'portfolios' | 'ai_recommendations' | 'reports') => {
    if (!user.value) return 0
    
    switch (metric) {
      case 'portfolios':
        const { count: portfolioCount } = await supabase
          .from('portfolio')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.value.id)
        return portfolioCount || 0
      
      case 'ai_recommendations':
        // TODO: Implement AI recommendations tracking
        return 0
      
      case 'reports':
        // TODO: Implement reports tracking
        return 0
        
      default:
        return 0
    }
  }

  const getUsagePercentage = async (metric: 'portfolios' | 'ai_recommendations' | 'reports') => {
    const usage = await getUsageCount(metric)
    const limit = planLimits.value[metric]
    
    if (limit === -1) return 0 // Unlimited
    if (limit === 0) return 100 // No access
    
    return Math.min(100, (usage / limit) * 100)
  }

  // Plan management
  const needsUpgrade = (feature: string): boolean => {
    switch (feature) {
      case 'ai_recommendations':
        return isFreePlan.value
      case 'advanced_analytics':
        return !isPremiumPlan.value
      case 'real_time_data':
        return !isPremiumPlan.value
      case 'unlimited_portfolios':
        return !isPremiumPlan.value
      default:
        return false
    }
  }

  const getUpgradeMessage = (feature: string): string => {
    if (needsUpgrade(feature)) {
      switch (feature) {
        case 'ai_recommendations':
          return 'AI recommendations are available with Basic and Premium plans.'
        case 'advanced_analytics':
          return 'Advanced analytics require a Premium plan.'
        case 'real_time_data':
          return 'Real-time data is available with Premium plan.'
        case 'unlimited_portfolios':
          return 'Unlimited portfolios require a Premium plan.'
        default:
          return 'This feature requires a paid plan.'
      }
    }
    return ''
  }

  const refreshSubscription = async () => {
    if (!user.value) return
    
    try {
      const { data: account } = await supabase
        .from('accounts')
        .select(`
          *,
          subscriptions (
            *,
            subscription_plans (*)
          )
        `)
        .eq('owner_id', user.value.id)
        .single()

      if (account) {
        const activeSubscription = account.subscriptions?.find(
          (sub: any) => sub.status === 'active' || sub.status === 'trialing'
        )

        let plan = activeSubscription?.subscription_plans
        
        if (!plan) {
          const { data: freePlan } = await supabase
            .from('subscription_plans')
            .select('*')
            .eq('stripe_price_id', 'free')
            .single()
          
          plan = freePlan
        }

        currentPlan.value = plan
        currentSubscription.value = activeSubscription
        currentAccount.value = account
      }
    } catch (error) {
      console.error('Error refreshing subscription:', error)
    }
  }

  return {
    // State
    currentPlan: readonly(currentPlan),
    currentSubscription: readonly(currentSubscription),
    currentAccount: readonly(currentAccount),
    
    // Computed
    isFreePlan,
    isBasicPlan,
    isPremiumPlan,
    isPaidPlan,
    isTrialing,
    trialDaysLeft,
    planLimits,
    
    // Feature access
    canCreatePortfolio,
    canAccessAIRecommendations,
    canAccessAdvancedAnalytics,
    canAccessRealTimeData,
    hasFeature,
    
    // Usage tracking
    getUsageCount,
    getUsagePercentage,
    
    // Plan management
    needsUpgrade,
    getUpgradeMessage,
    refreshSubscription
  }
}