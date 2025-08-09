<template>
  <!-- Background matching landing page -->
  <div class="min-h-screen">
    <div class="absolute inset-0 bg-gradient-to-br from-background-950 via-background-900 to-background-950">
      <div class="absolute inset-0 bg-gradient-to-tr from-primary-900/20 via-transparent to-accent-900/20 animate-gradient-shift"></div>
      <div class="absolute inset-0 bg-gradient-to-bl from-transparent via-primary-800/30 to-transparent animate-gradient-pulse"></div>
    </div>
    
    <!-- Floating Gradient Orbs -->
    <div class="absolute top-20 left-1/4 w-64 h-64 bg-gradient-to-r from-primary-500/20 to-accent-500/20 rounded-full blur-2xl animate-float-slow"></div>
    <div class="absolute bottom-20 right-1/4 w-96 h-96 bg-gradient-to-l from-accent-400/15 to-primary-400/15 rounded-full blur-3xl animate-float-reverse"></div>
    
    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold gradient-text">Portfolio Management</h1>
          <p class="text-white/70 mt-2">Track and manage your investment positions</p>
        </div>
        <div class="flex space-x-3 mt-4 sm:mt-0">
          <button @click="showAddAssetModal = true" class="btn-primary">
            <PlusIcon class="w-4 h-4 mr-2" />
            Add Asset
          </button>
          <button class="btn-secondary">
            <ArrowDownTrayIcon class="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>
    </div>

    <!-- Portfolio Selector -->
    <div class="card-dark mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-white">Select Portfolio</h2>
          <p class="text-sm text-white/70">Choose which portfolio to view</p>
        </div>
        <select
          v-model="selectedPortfolioId"
          @change="loadPortfolioAssets"
          class="input-field w-auto min-w-48"
        >
          <option value="all">All Portfolios</option>
          <option
            v-for="portfolio in portfolios"
            :key="portfolio.id"
            :value="portfolio.id"
          >
            {{ portfolio.name }}
          </option>
        </select>
      </div>
    </div>

    <!-- Assets Table -->
    <div class="card-dark">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-semibold text-white">Assets</h2>
        <div class="flex items-center space-x-4">
          <div class="relative">
            <MagnifyingGlassIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search assets..."
              class="input-field pl-10 pr-4 py-2 w-64"
            />
          </div>
          <select v-model="sortBy" @change="sortAssets" class="input-field w-auto">
            <option value="symbol">Symbol</option>
            <option value="name">Name</option>
            <option value="value">Market Value</option>
            <option value="change">Change %</option>
            <option value="weight">Portfolio Weight</option>
          </select>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-white/10">
          <thead class="bg-white/5">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                Asset
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                Holdings
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                Market Value
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                Change
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                Weight
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                AI Recommendation
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-transparent divide-y divide-white/10">
            <tr
              v-for="asset in filteredAssets"
              :key="asset.id"
              class="hover:bg-white/5 transition-colors duration-200"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10">
                    <div class="h-10 w-10 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center">
                      <span class="text-white font-semibold text-sm">{{ asset.symbol.charAt(0) }}</span>
                    </div>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-white">{{ asset.symbol }}</div>
                    <div class="text-sm text-white/70">{{ asset.name }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-white">{{ asset.quantity }} shares</div>
                <div class="text-sm text-white/70">${{ asset.current_price.toFixed(2) }}/share</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-white">
                  ${{ (asset.quantity * asset.current_price).toLocaleString() }}
                </div>
                <div class="text-sm text-white/70">
                  Cost: ${{ (asset.quantity * asset.average_price).toLocaleString() }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div
                  :class="[
                    'text-sm font-medium',
                    asset.change >= 0 ? 'text-accent-600' : 'text-danger-600'
                  ]"
                >
                  {{ asset.change >= 0 ? '+' : '' }}{{ asset.changePercentage.toFixed(2) }}%
                </div>
                <div
                  :class="[
                    'text-sm',
                    asset.change >= 0 ? 'text-accent-600' : 'text-danger-600'
                  ]"
                >
                  {{ asset.change >= 0 ? '+' : '' }}${{ Math.abs(asset.change).toFixed(2) }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-white">{{ asset.weight.toFixed(1) }}%</div>
                <div class="w-full bg-white/20 rounded-full h-1.5 mt-1">
                  <div
                    class="bg-primary-600 h-1.5 rounded-full"
                    :style="{ width: `${Math.min(asset.weight, 100)}%` }"
                  ></div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div v-if="asset.recommendation" class="flex items-center">
                  <span
                    :class="[
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      asset.recommendation.type === 'buy' ? 'bg-accent-100 text-accent-800' :
                      asset.recommendation.type === 'sell' ? 'bg-danger-100 text-danger-800' :
                      asset.recommendation.type === 'hold' ? 'bg-primary-100 text-primary-800' :
                      'bg-secondary-100 text-secondary-800'
                    ]"
                  >
                    {{ asset.recommendation.type.toUpperCase() }}
                  </span>
                  <div class="ml-2 text-xs text-white/60">
                    {{ asset.recommendation.confidence }}%
                  </div>
                </div>
                <div v-else class="text-sm text-white/40">No recommendation</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex justify-end space-x-2">
                  <button
                    @click="viewAssetDetails(asset)"
                    class="text-primary-600 hover:text-primary-900 p-1"
                    title="View Details"
                  >
                    <EyeIcon class="w-4 h-4" />
                  </button>
                  <button
                    @click="editAsset(asset)"
                    class="text-white/70 hover:text-white p-1"
                    title="Edit"
                  >
                    <PencilIcon class="w-4 h-4" />
                  </button>
                  <button
                    @click="removeAsset(asset)"
                    class="text-danger-600 hover:text-danger-900 p-1"
                    title="Remove"
                  >
                    <TrashIcon class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="filteredAssets.length === 0" class="text-center py-12">
        <ChartBarIcon class="w-12 h-12 text-white/40 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-white mb-2">No assets found</h3>
        <p class="text-white/70">
          {{ searchQuery ? 'Try adjusting your search criteria' : 'Add your first asset to get started' }}
        </p>
      </div>
    </div>

    <!-- AI Recommendations Section -->
    <div class="card-dark mt-8">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-semibold text-white">AI Recommendations</h2>
          <p class="text-sm text-white/70">Intelligent insights for your portfolio</p>
        </div>
        <div class="text-sm text-white/60">
          Updated {{ new Date().toLocaleTimeString() }}
        </div>
      </div>

      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="recommendation in aiRecommendations"
          :key="recommendation.id"
          class="border border-white/20 rounded-lg p-4 hover:border-white/30 transition-colors duration-200"
        >
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center space-x-2">
              <span class="text-lg font-semibold text-white">{{ recommendation.asset_symbol }}</span>
              <span
                :class="[
                  'px-2 py-1 text-xs font-medium rounded-full',
                  recommendation.recommendation_type === 'buy' ? 'bg-accent-100 text-accent-800' :
                  recommendation.recommendation_type === 'sell' ? 'bg-danger-100 text-danger-800' :
                  recommendation.recommendation_type === 'hold' ? 'bg-primary-100 text-primary-800' :
                  'bg-secondary-100 text-secondary-800'
                ]"
              >
                {{ recommendation.recommendation_type.toUpperCase() }}
              </span>
            </div>
            <div class="text-right">
              <div class="text-sm font-medium text-white">
                {{ recommendation.confidence_score }}%
              </div>
              <div class="text-xs text-white/60">confidence</div>
            </div>
          </div>
          <p class="text-sm text-white/70 mb-3">{{ recommendation.reasoning }}</p>
          <div v-if="recommendation.target_price" class="text-sm">
            <span class="text-white/70">Target Price: </span>
            <span class="font-medium text-white">${{ recommendation.target_price.toFixed(2) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Add Asset Modal (placeholder) -->
  <div v-if="showAddAssetModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="card-dark rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
      <h3 class="text-lg font-semibold text-white mb-4">Add New Asset</h3>
      <p class="text-white/70 mb-4">This feature will be fully implemented with real market data integration.</p>
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
  PlusIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ChartBarIcon
} from '@heroicons/vue/24/outline'

definePageMeta({
  middleware: 'auth'
})

const showAddAssetModal = ref(false)
const selectedPortfolioId = ref('all')
const searchQuery = ref('')
const sortBy = ref('symbol')

// Mock data
const portfolios = ref([
  { id: '1', name: 'Growth Portfolio' },
  { id: '2', name: 'Conservative Portfolio' },
  { id: '3', name: 'Tech Focus' }
])

const assets = ref([
  {
    id: '1',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    quantity: 50,
    average_price: 150.00,
    current_price: 175.50,
    change: 1250,
    changePercentage: 17.0,
    weight: 15.2,
    recommendation: { type: 'hold', confidence: 87 }
  },
  {
    id: '2',
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    quantity: 25,
    average_price: 2400.00,
    current_price: 2650.00,
    change: 6250,
    changePercentage: 10.4,
    weight: 22.8,
    recommendation: { type: 'buy', confidence: 92 }
  },
  {
    id: '3',
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    quantity: 30,
    average_price: 250.00,
    current_price: 220.00,
    change: -900,
    changePercentage: -12.0,
    weight: 9.1,
    recommendation: { type: 'sell', confidence: 78 }
  },
  {
    id: '4',
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    quantity: 40,
    average_price: 320.00,
    current_price: 375.00,
    change: 2200,
    changePercentage: 17.2,
    weight: 20.5,
    recommendation: { type: 'hold', confidence: 85 }
  },
  {
    id: '5',
    symbol: 'SPY',
    name: 'SPDR S&P 500 ETF Trust',
    quantity: 100,
    average_price: 420.00,
    current_price: 465.00,
    change: 4500,
    changePercentage: 10.7,
    weight: 32.4,
    recommendation: { type: 'buy', confidence: 90 }
  }
])

const aiRecommendations = ref([
  {
    id: '1',
    asset_symbol: 'NVDA',
    recommendation_type: 'buy' as const,
    confidence_score: 94,
    reasoning: 'Strong AI sector growth and upcoming product launches make NVDA attractive',
    target_price: 520.00
  },
  {
    id: '2',
    asset_symbol: 'QQQ',
    recommendation_type: 'hold' as const,
    confidence_score: 89,
    reasoning: 'Tech-heavy ETF provides good diversification in current market conditions',
    target_price: 385.00
  },
  {
    id: '3',
    asset_symbol: 'META',
    recommendation_type: 'watch' as const,
    confidence_score: 67,
    reasoning: 'Monitor for entry point after recent volatility settles',
    target_price: null
  }
])

const filteredAssets = computed(() => {
  let filtered = assets.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(asset =>
      asset.symbol.toLowerCase().includes(query) ||
      asset.name.toLowerCase().includes(query)
    )
  }

  return filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'symbol':
        return a.symbol.localeCompare(b.symbol)
      case 'name':
        return a.name.localeCompare(b.name)
      case 'value':
        return (b.quantity * b.current_price) - (a.quantity * a.current_price)
      case 'change':
        return b.changePercentage - a.changePercentage
      case 'weight':
        return b.weight - a.weight
      default:
        return 0
    }
  })
})

const loadPortfolioAssets = () => {
  // In a real app, this would fetch assets for the selected portfolio
  console.log('Loading assets for portfolio:', selectedPortfolioId.value)
}

const sortAssets = () => {
  // Assets are automatically sorted via computed property
}

const viewAssetDetails = (asset: any) => {
  console.log('Viewing details for:', asset.symbol)
}

const editAsset = (asset: any) => {
  console.log('Editing asset:', asset.symbol)
}

const removeAsset = (asset: any) => {
  if (confirm(`Are you sure you want to remove ${asset.symbol} from your portfolio?`)) {
    console.log('Removing asset:', asset.symbol)
  }
}

useHead({
  title: 'Portfolio - StockAdvisor'
})
</script>