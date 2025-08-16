<template>
  <!-- Background matching landing page -->
  <div class="min-h-full">
    <div class="absolute inset-0 bg-gradient-to-br from-background-950 via-background-900 to-background-950">
      <div class="absolute inset-0 bg-gradient-to-tr from-primary-900/20 via-transparent to-accent-900/20 animate-gradient-shift"></div>
      <div class="absolute inset-0 bg-gradient-to-bl from-transparent via-primary-800/30 to-transparent animate-gradient-pulse"></div>
    </div>
    
    <!-- Floating Gradient Orbs -->
    <div class="absolute top-20 left-1/4 w-64 h-64 bg-gradient-to-r from-primary-500/20 to-accent-500/20 rounded-full blur-2xl animate-float-slow"></div>
    <div class="absolute bottom-20 right-1/4 w-96 h-96 bg-gradient-to-l from-accent-400/15 to-primary-400/15 rounded-full blur-3xl animate-float-reverse"></div>
    
    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Welcome Header -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold gradient-text">Welcome back{{ profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : '' }}!</h1>
          <p class="text-white/70 mt-2">Here's what's happening with your investments today</p>
        </div>
        <div class="hidden md:flex items-center space-x-4">
          <div class="text-right">
            <div class="text-sm text-white/60">Market Status</div>
            <div class="flex items-center space-x-2">
              <div class="w-2 h-2 bg-accent-500 rounded-full animate-pulse"></div>
              <span class="text-sm font-medium text-white">Markets Open</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Portfolio Summary Cards -->
    <div v-if="loading.portfolios" class="flex items-center justify-center py-8">
      <div class="flex items-center space-x-2">
        <svg class="animate-spin h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-sm text-white/70">Loading your portfolios...</span>
      </div>
    </div>
    
    <div v-else-if="portfolios.length === 0" class="text-center py-12">
      <div class="mx-auto h-24 w-24 text-white/40 mb-4">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-white mb-2">No portfolios yet</h3>
      <p class="text-white/70 mb-4">Get started by creating your first investment portfolio</p>
      <button @click="navigateTo('/onboarding')" class="btn-primary">
        Create Your First Portfolio
      </button>
    </div>
    
    <PortfolioSummary
      v-else
      :total-value="dashboardData.totalValue"
      :total-gain-loss="dashboardData.totalGainLoss"
      :total-gain-loss-percentage="dashboardData.totalGainLossPercentage"
      :number-of-positions="dashboardData.numberOfPositions"
      :number-of-portfolios="dashboardData.numberOfPortfolios"
      :performance-score="dashboardData.performanceScore"
      @add-asset="showAddAssetModal = true"
      @rebalance="handleRebalance"
      @view-analytics="navigateTo('/portfolio')"
      @view-recommendations="scrollToRecommendations"
      @export-data="handleExportData"
      @view-reports="handleViewReports"
    />

    <!-- Portfolio Performance Chart -->
    <PortfolioChart :portfolio-id="selectedPortfolioId" />

    <!-- AI Recommendations -->
    <div ref="recommendationsSection" class="card-dark mt-8">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-semibold text-white">AI Recommendations</h2>
          <p class="text-sm text-white/70">Personalized insights based on market analysis</p>
        </div>
        <button class="btn-ghost text-sm">
          View All
        </button>
      </div>

      <div v-if="loading.recommendations" class="flex items-center justify-center py-8">
        <div class="flex items-center space-x-2">
          <svg class="animate-spin h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span class="text-sm text-white/70">Loading AI recommendations...</span>
        </div>
      </div>

      <div v-else-if="recommendations.length === 0" class="text-center py-8">
        <LightBulbIcon class="w-12 h-12 text-white/40 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-white mb-2">No recommendations available</h3>
        <p class="text-white/70">Our AI is analyzing your portfolio. Check back soon for personalized insights.</p>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="recommendation in recommendations.slice(0, 5)"
          :key="recommendation.id"
          class="flex items-start space-x-4 p-4 border border-white/20 rounded-lg hover:border-white/30 transition-colors duration-200 bg-white/5 backdrop-blur-sm"
        >
          <div
            :class="[
              'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
              recommendation.action === 'buy' ? 'bg-accent-100 text-accent-600' :
              recommendation.action === 'sell' ? 'bg-danger-100 text-danger-600' :
              'bg-primary-100 text-primary-600'
            ]"
          >
            <component 
              :is="getRecommendationIcon(recommendation.action)" 
              class="w-5 h-5" 
            />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="text-sm font-medium text-white">
                  {{ recommendation.action?.toUpperCase() }} {{ recommendation.securities?.symbol }}
                </h4>
                <p class="text-sm text-white/70 mt-1">{{ recommendation.description }}</p>
              </div>
              <div class="text-right">
                <div v-if="recommendation.amount" class="text-sm font-medium text-white">
                  ${{ recommendation.amount.toFixed(2) }}
                </div>
                <div class="text-xs text-white/50">
                  {{ formatDate(recommendation.created_at) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="card-dark mt-8">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-semibold text-white">Recent Activity</h2>
          <p class="text-sm text-white/70">Your latest portfolio changes</p>
        </div>
      </div>

      <div class="space-y-4">
        <div v-for="activity in recentActivity" :key="activity.id" class="flex items-center space-x-4">
          <div class="flex-shrink-0 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
            <component :is="activity.icon" class="w-4 h-4 text-white/70" />
          </div>
          <div class="flex-1">
            <p class="text-sm text-white">{{ activity.description }}</p>
            <p class="text-xs text-white/50">{{ activity.timestamp }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Add Asset Modal (placeholder) -->
  <div v-if="showAddAssetModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-background-900 border border-white/20 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
      <h3 class="text-lg font-semibold text-white mb-4">Add New Asset</h3>
      <p class="text-white/70 mb-4">This feature will be implemented in the next phase.</p>
      <div class="flex justify-end space-x-3">
        <button @click="showAddAssetModal = false" class="btn-secondary">
          Close
        </button>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  LightBulbIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  EyeIcon,
  PlusIcon,
  ArrowsRightLeftIcon
} from '@heroicons/vue/24/outline'

definePageMeta({
  middleware: 'auth'
})

const user = useSupabaseUser()
const supabase = useSupabaseClient()
const profile = ref(null)
const portfolios = ref([])
const loading = ref({
  profile: false,
  portfolios: true,
  recommendations: false
})

const showAddAssetModal = ref(false)
const selectedPortfolioId = ref<string | null>(null)
const recommendationsSection = ref<HTMLElement>()

// Calculate dashboard data from real portfolios with current market prices
const dashboardData = computed(() => {
  if (!portfolios.value.length) {
    return {
      totalValue: 0,
      totalGainLoss: 0,
      totalGainLossPercentage: 0,
      numberOfPositions: 0,
      numberOfPortfolios: 0,
      performanceScore: 0,
      currentMarketValue: 0,
      bookValue: 0
    }
  }

  let currentMarketValue = 0
  let bookValue = 0
  let totalPositions = 0
  let totalLiquidFunds = 0
  let historicalGainLoss = 0
  
  portfolios.value.forEach(portfolio => {
    // Add liquid funds
    totalLiquidFunds += portfolio.liquid_funds || 0
    
    // Calculate securities values
    if (portfolio.portfolio_securities) {
      portfolio.portfolio_securities.forEach(security => {
        totalPositions++
        
        // Book value (what was paid for the securities)
        const securityBookValue = security.worth || 0
        bookValue += securityBookValue
        
        // Current market value (current price * amount held)
        if (security.current_price && security.amount) {
          currentMarketValue += security.current_price * security.amount
        } else {
          // Fallback to book value if no current price available
          currentMarketValue += securityBookValue
        }
      })
    }
    
    // Calculate historical performance from portfolio_history
    if (portfolio.portfolio_history && portfolio.portfolio_history.length >= 2) {
      const latestValue = portfolio.portfolio_history[0]?.value || 0
      const previousValue = portfolio.portfolio_history[1]?.value || 0
      
      if (previousValue > 0) {
        historicalGainLoss += latestValue - previousValue
      }
    }
  })
  
  // Add liquid funds to totals
  const totalCurrentValue = currentMarketValue + totalLiquidFunds
  const totalBookValue = bookValue + totalLiquidFunds
  
  // Calculate gain/loss based on current market value vs book value
  const totalGainLoss = totalCurrentValue - totalBookValue
  const totalGainLossPercentage = totalBookValue > 0 ? (totalGainLoss / totalBookValue) * 100 : 0
  
  // Calculate performance score based on gain/loss percentage
  let performanceScore = 50 // Base score
  if (totalGainLossPercentage > 0) {
    performanceScore = Math.min(100, 50 + (totalGainLossPercentage * 2))
  } else {
    performanceScore = Math.max(0, 50 + (totalGainLossPercentage * 2))
  }
  
  return {
    totalValue: totalCurrentValue,
    totalGainLoss,
    totalGainLossPercentage,
    numberOfPositions: totalPositions,
    numberOfPortfolios: portfolios.value.length,
    performanceScore: Math.round(performanceScore),
    currentMarketValue,
    bookValue: totalBookValue,
    historicalGainLoss
  }
})

const recommendations = ref([])

const recentActivity = ref([])

const getRecommendationIcon = (type: string) => {
  switch (type) {
    case 'buy':
      return ArrowTrendingUpIcon
    case 'sell':
      return ArrowTrendingDownIcon
    case 'hold':
      return MinusIcon
    case 'watch':
      return EyeIcon
    default:
      return LightBulbIcon
  }
}

const handleRebalance = () => {
  // Implement rebalancing logic
  console.log('Rebalancing portfolio...')
}

const handleExportData = () => {
  // Implement data export
  console.log('Exporting portfolio data...')
}

const handleViewReports = () => {
  // Navigate to reports page
  navigateTo('/reports')
}

const scrollToRecommendations = () => {
  if (recommendationsSection.value) {
    recommendationsSection.value.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    })
  }
}

// Load user profile
const loadProfile = async () => {
  if (!user.value) return
  
  loading.value.profile = true
  try {
    const data = await useProfile()
    profile.value = data
  } catch (error) {
    console.error('Error loading profile:', error)
  } finally {
    loading.value.profile = false
  }
}

// Load user portfolios with securities, history, and current prices
const loadPortfolios = async () => {
  if (!user.value) return
  
  loading.value.portfolios = true
  try {
    // Get user's account_id first
    const { data: account } = await supabase
      .from('accounts')
      .select('id')
      .eq('owner_id', user.value.id)
      .single()

    if (!account) {
      portfolios.value = []
      loading.value.portfolios = false
      return
    }

    // Load portfolios with securities and their latest prices
    const { data, error } = await supabase
      .from('portfolios')
      .select(`
        *,
        portfolio_securities (
          *,
          securities (
            id,
            symbol,
            name,
            exchange,
            security_prices (
              price,
              date
            )
          )
        ),
        portfolio_history (
          date,
          value
        )
      `)
      .eq('account_id', account.id)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    // Process portfolios to get latest security prices
    const portfoliosWithCurrentPrices = await Promise.all((data || []).map(async (portfolio) => {
      if (portfolio.portfolio_securities) {
        // Get current prices for each security
        const securitiesWithPrices = await Promise.all(portfolio.portfolio_securities.map(async (ps) => {
          // Get the latest price for this security
          const { data: latestPrice } = await supabase
            .from('security_prices')
            .select('price, date')
            .eq('security_id', ps.security_id)
            .order('date', { ascending: false })
            .limit(1)
            .single()
          
          return {
            ...ps,
            current_price: latestPrice?.price || null,
            price_date: latestPrice?.date || null
          }
        }))
        
        portfolio.portfolio_securities = securitiesWithPrices
      }
      
      // Sort portfolio history by date (most recent first)
      if (portfolio.portfolio_history) {
        portfolio.portfolio_history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      }
      
      return portfolio
    }))
    
    portfolios.value = portfoliosWithCurrentPrices
    
    // Set default selected portfolio to the first one
    if (portfolios.value.length > 0 && !selectedPortfolioId.value) {
      selectedPortfolioId.value = portfolios.value[0].id
    }
  } catch (error) {
    console.error('Error loading portfolios:', error)
  } finally {
    loading.value.portfolios = false
  }
}

// Load recommendations
const loadRecommendations = async () => {
  if (!user.value || !portfolios.value.length) return
  
  loading.value.recommendations = true
  try {
    const portfolioIds = portfolios.value.map(p => p.id)
    
    const { data, error } = await supabase
      .from('portfolio_recommendations')
      .select(`
        *,
        securities (
          symbol,
          name
        )
      `)
      .in('portfolio_id', portfolioIds)
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (error) throw error
    recommendations.value = data || []
  } catch (error) {
    console.error('Error loading recommendations:', error)
  } finally {
    loading.value.recommendations = false
  }
}

// Load recent activity from transactions
const loadRecentActivity = async () => {
  if (!user.value || !portfolios.value.length) return
  
  try {
    const portfolioIds = portfolios.value.map(p => p.id)
    
    const { data, error } = await supabase
      .from('portfolio_transactions')
      .select(`
        *,
        securities (
          symbol,
          name
        ),
        portfolios (
          name
        )
      `)
      .in('portfolio_id', portfolioIds)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (error) throw error
    
    // Transform transactions into activity format
    const activities = (data || []).map(transaction => ({
      id: transaction.id,
      description: `${transaction.action === 'buy' ? 'Bought' : 'Sold'} ${transaction.amount} shares of ${transaction.securities?.symbol || 'Unknown'} in ${transaction.portfolios?.name || 'Portfolio'}`,
      timestamp: formatDate(transaction.created_at),
      icon: transaction.action === 'buy' ? PlusIcon : ArrowsRightLeftIcon
    }))
    
    recentActivity.value = activities
  } catch (error) {
    console.error('Error loading recent activity:', error)
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInHours / 24)
  
  if (diffInHours < 1) {
    return 'Just now'
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`
  } else {
    return date.toLocaleDateString()
  }
}

onMounted(async () => {
  await loadProfile()
  await loadPortfolios()
  await loadRecommendations()
  await loadRecentActivity()
})

useHead({
  title: 'Dashboard - StockAdvisor'
})
</script>