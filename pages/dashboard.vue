<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Welcome Header -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold gradient-text">Welcome back{{ profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : '' }}!</h1>
          <p class="text-secondary-600 mt-2">Here's what's happening with your investments today</p>
        </div>
        <div class="hidden md:flex items-center space-x-4">
          <div class="text-right">
            <div class="text-sm text-secondary-600">Market Status</div>
            <div class="flex items-center space-x-2">
              <div class="w-2 h-2 bg-accent-500 rounded-full animate-pulse"></div>
              <span class="text-sm font-medium text-secondary-900">Markets Open</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Portfolio Summary Cards -->
    <PortfolioSummary
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
    <div ref="recommendationsSection" class="card mt-8">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-semibold text-secondary-900">AI Recommendations</h2>
          <p class="text-sm text-secondary-600">Personalized insights based on market analysis</p>
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
          <span class="text-sm text-secondary-600">Loading AI recommendations...</span>
        </div>
      </div>

      <div v-else-if="recommendations.length === 0" class="text-center py-8">
        <LightBulbIcon class="w-12 h-12 text-secondary-400 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-secondary-900 mb-2">No recommendations available</h3>
        <p class="text-secondary-600">Our AI is analyzing your portfolio. Check back soon for personalized insights.</p>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="recommendation in recommendations.slice(0, 5)"
          :key="recommendation.id"
          class="flex items-start space-x-4 p-4 border border-secondary-200 rounded-lg hover:border-secondary-300 transition-colors duration-200"
        >
          <div
            :class="[
              'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
              recommendation.recommendation_type === 'buy' ? 'bg-accent-100 text-accent-600' :
              recommendation.recommendation_type === 'sell' ? 'bg-danger-100 text-danger-600' :
              recommendation.recommendation_type === 'hold' ? 'bg-primary-100 text-primary-600' :
              'bg-secondary-100 text-secondary-600'
            ]"
          >
            <component 
              :is="getRecommendationIcon(recommendation.recommendation_type)" 
              class="w-5 h-5" 
            />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="text-sm font-medium text-secondary-900">
                  {{ recommendation.recommendation_type.toUpperCase() }} {{ recommendation.asset_symbol }}
                </h4>
                <p class="text-sm text-secondary-600 mt-1">{{ recommendation.reasoning }}</p>
              </div>
              <div class="text-right">
                <div class="text-sm font-medium text-secondary-900">
                  {{ Math.round(recommendation.confidence_score) }}% confidence
                </div>
                <div v-if="recommendation.target_price" class="text-xs text-secondary-500">
                  Target: ${{ recommendation.target_price.toFixed(2) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="card mt-8">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-semibold text-secondary-900">Recent Activity</h2>
          <p class="text-sm text-secondary-600">Your latest portfolio changes</p>
        </div>
      </div>

      <div class="space-y-4">
        <div v-for="activity in recentActivity" :key="activity.id" class="flex items-center space-x-4">
          <div class="flex-shrink-0 w-8 h-8 bg-secondary-100 rounded-full flex items-center justify-center">
            <component :is="activity.icon" class="w-4 h-4 text-secondary-600" />
          </div>
          <div class="flex-1">
            <p class="text-sm text-secondary-900">{{ activity.description }}</p>
            <p class="text-xs text-secondary-500">{{ activity.timestamp }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Add Asset Modal (placeholder) -->
  <div v-if="showAddAssetModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
      <h3 class="text-lg font-semibold text-secondary-900 mb-4">Add New Asset</h3>
      <p class="text-secondary-600 mb-4">This feature will be implemented in the next phase.</p>
      <div class="flex justify-end space-x-3">
        <button @click="showAddAssetModal = false" class="btn-secondary">
          Close
        </button>
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
const profile = ref(null)
const loading = ref({
  profile: false,
  recommendations: false
})

const showAddAssetModal = ref(false)
const selectedPortfolioId = ref<string | null>(null)
const recommendationsSection = ref<HTMLElement>()

// Mock data for demonstration
const dashboardData = ref({
  totalValue: 127840,
  totalGainLoss: 12840,
  totalGainLossPercentage: 11.15,
  numberOfPositions: 18,
  numberOfPortfolios: 3,
  performanceScore: 87
})

const recommendations = ref([
  {
    id: '1',
    asset_symbol: 'AAPL',
    recommendation_type: 'buy' as const,
    confidence_score: 87,
    reasoning: 'Strong earnings growth and technical breakout pattern suggest upward momentum',
    target_price: 195.50
  },
  {
    id: '2',
    asset_symbol: 'TSLA',
    recommendation_type: 'sell' as const,
    confidence_score: 73,
    reasoning: 'Overvalued based on current metrics, consider taking profits',
    target_price: null
  },
  {
    id: '3',
    asset_symbol: 'SPY',
    recommendation_type: 'hold' as const,
    confidence_score: 92,
    reasoning: 'Maintain position in this diversified ETF for stability',
    target_price: 485.00
  }
])

const recentActivity = ref([
  {
    id: '1',
    description: 'Added 10 shares of NVDA to Tech Portfolio',
    timestamp: '2 hours ago',
    icon: PlusIcon
  },
  {
    id: '2',
    description: 'Sold 5 shares of META from Growth Portfolio',
    timestamp: '1 day ago',
    icon: ArrowsRightLeftIcon
  },
  {
    id: '3',
    description: 'Rebalanced Conservative Portfolio',
    timestamp: '3 days ago',
    icon: ArrowsRightLeftIcon
  }
])

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

onMounted(() => {
  loadProfile()
})

useHead({
  title: 'Dashboard - StockAdvisor'
})
</script>