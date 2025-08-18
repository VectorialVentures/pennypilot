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
      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="flex items-center space-x-3">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span class="text-lg text-white">Loading security details...</span>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-12">
        <ExclamationTriangleIcon class="w-16 h-16 text-danger-500 mx-auto mb-4" />
        <h2 class="text-2xl font-bold text-white mb-2">Security Not Found</h2>
        <p class="text-white/70 mb-4">{{ error }}</p>
        <button @click="navigateTo('/portfolio')" class="btn-primary">
          Back to Portfolio
        </button>
      </div>

      <!-- Security Details -->
      <div v-else-if="security">
        <!-- Header -->
        <div class="mb-8">
          <div class="flex items-center justify-between">
            <div>
              <div class="flex items-center space-x-4 mb-2">
                <button @click="navigateTo('/portfolio')" class="text-white/70 hover:text-white">
                  <ArrowLeftIcon class="w-6 h-6" />
                </button>
                <h1 class="text-4xl font-bold text-white">{{ security.symbol }}</h1>
                <span
                  :class="[
                    'px-3 py-1 rounded-full text-sm font-medium',
                    getPriceChangeClass()
                  ]"
                >
                  {{ getPriceChange() }}
                </span>
              </div>
              <h2 class="text-xl text-white/80 mb-2">{{ security.name || security.symbol }}</h2>
              <div class="flex items-center space-x-6 text-sm text-white/60">
                <span v-if="security.exchange">Exchange: {{ security.exchange }}</span>
                <span v-if="security.sector">Sector: {{ security.sector }}</span>
                <span v-if="security.industry">Industry: {{ security.industry }}</span>
              </div>
            </div>
            <div class="text-right">
              <div class="text-3xl font-bold text-white mb-1">
                ${{ getCurrentPrice() }}
              </div>
              <div class="text-sm text-white/60">
                Last updated: {{ getLastUpdateTime() }}
              </div>
            </div>
          </div>
        </div>

        <!-- Price Chart -->
        <div class="card-dark mb-8">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-semibold text-white">Price History</h3>
            <div class="flex space-x-2">
              <button
                v-for="period in chartPeriods"
                :key="period.value"
                @click="selectedChartPeriod = period.value"
                :class="[
                  'px-3 py-1 text-xs font-medium rounded-md transition-colors duration-200',
                  selectedChartPeriod === period.value
                    ? 'bg-primary-600 text-white'
                    : 'text-white/60 hover:text-primary-600 hover:bg-primary-50/10'
                ]"
              >
                {{ period.label }}
              </button>
            </div>
          </div>
          <SecurityPriceChart 
            :security-id="security.id" 
            :symbol="security.symbol" 
            :period="selectedChartPeriod"
          />
        </div>

        <!-- Statistics Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <!-- Price Stats -->
          <div class="card-dark">
            <h4 class="text-lg font-semibold text-white mb-4">Price Statistics</h4>
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-white/60">Current Price:</span>
                <span class="text-white font-medium">${{ getCurrentPrice() }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-white/60">24h High:</span>
                <span class="text-white font-medium">${{ getDayHigh() }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-white/60">24h Low:</span>
                <span class="text-white font-medium">${{ getDayLow() }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-white/60">52w High:</span>
                <span class="text-white font-medium">${{ getYearHigh() }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-white/60">52w Low:</span>
                <span class="text-white font-medium">${{ getYearLow() }}</span>
              </div>
            </div>
          </div>

          <!-- Market Info -->
          <div class="card-dark">
            <h4 class="text-lg font-semibold text-white mb-4">Market Information</h4>
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-white/60">Asset Type:</span>
                <span class="text-white font-medium">{{ security.asset_type || 'Stock' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-white/60">Currency:</span>
                <span class="text-white font-medium">{{ security.currency || 'USD' }}</span>
              </div>
              <div v-if="security.sector" class="flex justify-between">
                <span class="text-white/60">Sector:</span>
                <span class="text-white font-medium">{{ security.sector }}</span>
              </div>
              <div v-if="security.industry" class="flex justify-between">
                <span class="text-white/60">Industry:</span>
                <span class="text-white font-medium">{{ security.industry }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-white/60">Data Points:</span>
                <span class="text-white font-medium">{{ security.security_prices?.length || 0 }}</span>
              </div>
            </div>
          </div>

          <!-- News Summary -->
          <div class="card-dark">
            <h4 class="text-lg font-semibold text-white mb-4">News Sentiment</h4>
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-white/60">Total Articles:</span>
                <span class="text-white font-medium">{{ security.security_news?.length || 0 }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-white/60">Positive:</span>
                <span class="text-accent-400 font-medium">{{ getNewsSentimentCount('positive') }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-white/60">Neutral:</span>
                <span class="text-white/60 font-medium">{{ getNewsSentimentCount('neutral') }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-white/60">Negative:</span>
                <span class="text-danger-400 font-medium">{{ getNewsSentimentCount('negative') }}</span>
              </div>
              <div class="mt-4">
                <div class="text-sm text-white/60 mb-2">Overall Sentiment</div>
                <div class="w-full bg-white/20 rounded-full h-2">
                  <div 
                    :class="getSentimentBarClass()"
                    class="h-2 rounded-full transition-all duration-500"
                    :style="{ width: `${getSentimentPercentage()}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- AI Analysis -->
        <div v-if="security.security_analysis && security.security_analysis.length > 0" class="card-dark mb-8">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-semibold text-white">AI Analysis</h3>
            <div class="text-sm text-white/60">
              Latest AI assessment
            </div>
          </div>

          <div class="space-y-4">
            <div
              v-for="analysis in security.security_analysis.slice(0, 3)"
              :key="analysis.id"
              class="border border-white/20 rounded-lg p-6 hover:border-white/30 transition-colors duration-200"
            >
              <div class="flex items-start justify-between mb-4">
                <div class="flex items-center space-x-3">
                  <span
                    :class="[
                      'px-3 py-1 text-sm font-medium rounded-full',
                      analysis.recommendation === 'buy' ? 'bg-accent-100 text-accent-800' :
                      analysis.recommendation === 'sell' ? 'bg-danger-100 text-danger-800' :
                      'bg-primary-100 text-primary-800'
                    ]"
                  >
                    {{ analysis.recommendation.toUpperCase() }}
                  </span>
                  <div class="text-sm text-white/60">
                    {{ formatNewsDate(analysis.created_at) }}
                  </div>
                </div>
                <div class="flex items-center space-x-2">
                  <LightBulbIcon class="w-5 h-5 text-primary-400" />
                  <span class="text-sm text-white/70">AI Assessment</span>
                </div>
              </div>
              
              <div class="text-white/90 leading-relaxed">
                {{ analysis.assessment }}
              </div>
            </div>
          </div>
        </div>

        <!-- Recent News -->
        <div class="card-dark">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-semibold text-white">Recent News</h3>
            <div class="text-sm text-white/60">
              {{ security.security_news?.length || 0 }} articles found
            </div>
          </div>

          <div v-if="!security.security_news || security.security_news.length === 0" class="text-center py-8">
            <NewspaperIcon class="w-12 h-12 text-white/40 mx-auto mb-4" />
            <h4 class="text-lg font-medium text-white mb-2">No news available</h4>
            <p class="text-white/70">No recent news articles found for this security.</p>
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="article in security.security_news.slice(0, 10)"
              :key="article.id"
              class="border border-white/20 rounded-lg p-4 hover:border-white/30 transition-colors duration-200"
            >
              <div class="flex items-start justify-between mb-3">
                <div class="flex-1">
                  <p class="text-white/90 leading-relaxed">{{ article.summary }}</p>
                </div>
                <div class="flex items-center space-x-2 ml-4">
                  <span
                    v-if="article.sentiment"
                    :class="[
                      'px-2 py-1 text-xs font-medium rounded-full',
                      article.sentiment === 'positive' ? 'bg-accent-100 text-accent-800' :
                      article.sentiment === 'negative' ? 'bg-danger-100 text-danger-800' :
                      'bg-secondary-100 text-secondary-800'
                    ]"
                  >
                    {{ article.sentiment }}
                  </span>
                </div>
              </div>
              <div class="flex items-center justify-between text-sm">
                <div class="text-white/60">
                  {{ formatNewsDate(article.published_at || article.created_at) }}
                </div>
                <a
                  v-if="article.url"
                  :href="article.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-primary-400 hover:text-primary-300 flex items-center space-x-1"
                >
                  <span>Read more</span>
                  <ArrowTopRightOnSquareIcon class="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  NewspaperIcon,
  ArrowTopRightOnSquareIcon,
  LightBulbIcon
} from '@heroicons/vue/24/outline'

definePageMeta({
  middleware: 'auth'
})

const route = useRoute()
const symbol = route.params.symbol as string

const loading = ref(true)
const error = ref<string | null>(null)
const security = ref<any>(null)
const selectedChartPeriod = ref('1M')

const chartPeriods = [
  { label: '1W', value: '1W' },
  { label: '1M', value: '1M' },
  { label: '3M', value: '3M' },
  { label: '6M', value: '6M' },
  { label: '1Y', value: '1Y' },
  { label: 'ALL', value: 'ALL' }
]

const loadSecurityData = async () => {
  if (!symbol) {
    error.value = 'No security symbol provided'
    loading.value = false
    return
  }

  try {
    loading.value = true
    error.value = null
    
    const data = await useSecurityBySymbol(symbol)
    security.value = data
  } catch (err: any) {
    console.error('Error loading security:', err)
    error.value = `Security "${symbol.toUpperCase()}" not found`
  } finally {
    loading.value = false
  }
}

const getCurrentPrice = () => {
  if (!security.value?.security_prices || security.value.security_prices.length === 0) {
    return '0.00'
  }
  return security.value.security_prices[0].close?.toFixed(2) || '0.00'
}

const getPriceChange = () => {
  if (!security.value?.security_prices || security.value.security_prices.length < 2) {
    return '+0.00%'
  }
  
  const current = security.value.security_prices[0].close || 0
  const previous = security.value.security_prices[1].close || 0
  
  if (previous === 0) return '+0.00%'
  
  const change = ((current - previous) / previous) * 100
  const sign = change >= 0 ? '+' : ''
  return `${sign}${change.toFixed(2)}%`
}

const getPriceChangeClass = () => {
  if (!security.value?.security_prices || security.value.security_prices.length < 2) {
    return 'bg-secondary-100 text-secondary-800'
  }
  
  const current = security.value.security_prices[0].close || 0
  const previous = security.value.security_prices[1].close || 0
  const change = current - previous
  
  if (change > 0) return 'bg-accent-100 text-accent-800'
  if (change < 0) return 'bg-danger-100 text-danger-800'
  return 'bg-secondary-100 text-secondary-800'
}

const getLastUpdateTime = () => {
  if (!security.value?.security_prices || security.value.security_prices.length === 0) {
    return 'No data'
  }
  
  const lastUpdate = new Date(security.value.security_prices[0].date)
  return lastUpdate.toLocaleDateString() + ' ' + lastUpdate.toLocaleTimeString()
}

const getDayHigh = () => {
  // Get prices from last 24 hours
  const oneDayAgo = new Date()
  oneDayAgo.setDate(oneDayAgo.getDate() - 1)
  
  const recentPrices = security.value?.security_prices?.filter(p => 
    new Date(p.date) >= oneDayAgo
  ) || []
  
  if (recentPrices.length === 0) return getCurrentPrice()
  
  const high = Math.max(...recentPrices.map(p => p.close || 0))
  return high.toFixed(2)
}

const getDayLow = () => {
  // Get prices from last 24 hours
  const oneDayAgo = new Date()
  oneDayAgo.setDate(oneDayAgo.getDate() - 1)
  
  const recentPrices = security.value?.security_prices?.filter(p => 
    new Date(p.date) >= oneDayAgo
  ) || []
  
  if (recentPrices.length === 0) return getCurrentPrice()
  
  const low = Math.min(...recentPrices.map(p => p.close || 0))
  return low.toFixed(2)
}

const getYearHigh = () => {
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  
  const yearPrices = security.value?.security_prices?.filter(p => 
    new Date(p.date) >= oneYearAgo
  ) || []
  
  if (yearPrices.length === 0) return getCurrentPrice()
  
  const high = Math.max(...yearPrices.map(p => p.close || 0))
  return high.toFixed(2)
}

const getYearLow = () => {
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  
  const yearPrices = security.value?.security_prices?.filter(p => 
    new Date(p.date) >= oneYearAgo
  ) || []
  
  if (yearPrices.length === 0) return getCurrentPrice()
  
  const low = Math.min(...yearPrices.map(p => p.close || 0))
  return low.toFixed(2)
}

const getNewsSentimentCount = (sentiment: string) => {
  return security.value?.security_news?.filter(news => news.sentiment === sentiment).length || 0
}

const getSentimentPercentage = () => {
  const total = security.value?.security_news?.length || 0
  if (total === 0) return 50
  
  const positive = getNewsSentimentCount('positive')
  const negative = getNewsSentimentCount('negative')
  
  if (positive === negative) return 50
  
  return positive > negative ? 50 + (positive / total) * 50 : 50 - (negative / total) * 50
}

const getSentimentBarClass = () => {
  const percentage = getSentimentPercentage()
  if (percentage > 60) return 'bg-accent-500'
  if (percentage < 40) return 'bg-danger-500'
  return 'bg-secondary-500'
}

const formatNewsDate = (dateString: string) => {
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

onMounted(() => {
  loadSecurityData()
})

useHead({
  title: computed(() => `${symbol.toUpperCase()} - Security Details`)
})
</script>