export default defineNuxtRouteMiddleware(async (to) => {
  // Only run on client side and for authenticated users
  if (process.server) return
  
  const user = useSupabaseUser()
  if (!user.value) return

  const supabase = useSupabaseClient()
  
  try {
    // Get user's account and subscription status
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

    if (!account) {
      // No account found, redirect to plan selection
      return navigateTo('/auth/signup')
    }

    // Get active subscription or default to free plan
    const activeSubscription = account.subscriptions?.find(
      (sub: any) => sub.status === 'active' || sub.status === 'trialing'
    )

    let currentPlan = activeSubscription?.subscription_plans
    
    if (!currentPlan) {
      // User is on free plan
      const { data: freePlan } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('stripe_price_id', 'free')
        .single()
      
      currentPlan = freePlan
    }

    // Store plan info in global state for easy access
    useState('currentPlan', () => currentPlan)
    useState('currentSubscription', () => activeSubscription)
    useState('currentAccount', () => account)

    // Check if user has access to the requested route
    const planLimits = currentPlan?.limits || {}
    const planName = currentPlan?.name?.toLowerCase() || 'free'

    // Define route access rules
    const accessRules = {
      '/dashboard': true, // All plans have access
      '/portfolio': true, // All plans have access
      '/subscription': true, // All plans have access
      '/ai-recommendations': planName !== 'free', // Paid plans only
      '/advanced-analytics': planName === 'premium', // Premium only
      '/real-time-data': planName === 'premium', // Premium only
    }

    // Check if route requires specific plan access
    const requiredAccess = accessRules[to.path as keyof typeof accessRules]
    
    if (requiredAccess === false) {
      // User doesn't have access, redirect to subscription page
      throw createError({
        statusCode: 403,
        statusMessage: `This feature requires a ${getRequiredPlan(to.path)} plan. Please upgrade your subscription.`
      })
    }

    // Additional checks for feature limits
    if (to.path.includes('/portfolio') && to.query.create === 'true') {
      // Check portfolio creation limit
      const { count: portfolioCount } = await supabase
        .from('portfolio')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.value.id)
      
      const maxPortfolios = planLimits.portfolios
      if (maxPortfolios > 0 && (portfolioCount || 0) >= maxPortfolios) {
        return navigateTo('/subscription?upgrade=portfolios')
      }
    }

  } catch (error) {
    console.error('Subscription middleware error:', error)
    // On error, allow access but log the issue
    return
  }
})

function getRequiredPlan(path: string): string {
  if (path.includes('advanced-analytics') || path.includes('real-time-data')) {
    return 'Premium'
  }
  if (path.includes('ai-recommendations')) {
    return 'Basic or Premium'
  }
  return 'paid'
}