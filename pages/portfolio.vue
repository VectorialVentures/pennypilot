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
    <!-- Header -->
    <div class="mb-8">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold gradient-text">Portfolio Management</h1>
          <p class="text-white/70 mt-2">Track and manage your investment positions</p>
        </div>
        <div class="flex flex-wrap gap-3 mt-4 sm:mt-0">
          <button @click="showAddAssetModal = true" class="btn-primary">
            <PlusIcon class="w-4 h-4 mr-2" />
            Add Asset
          </button>
          <NuxtLink to="/securities" class="btn-ghost">
            <BuildingLibraryIcon class="w-4 h-4 mr-2" />
            Browse Securities
          </NuxtLink>
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
          :disabled="loading"
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
                <div v-if="asset.ai_analysis" class="flex items-center">
                  <span
                    :class="[
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      asset.ai_analysis.recommendation === 'buy' ? 'bg-accent-100 text-accent-800' :
                      asset.ai_analysis.recommendation === 'sell' ? 'bg-danger-100 text-danger-800' :
                      asset.ai_analysis.recommendation === 'hold' ? 'bg-primary-100 text-primary-800' :
                      'bg-secondary-100 text-secondary-800'
                    ]"
                  >
                    {{ asset.ai_analysis.recommendation.toUpperCase() }}
                  </span>
                  <div class="ml-2 text-xs text-white/60">
                    AI
                  </div>
                </div>
                <div v-else-if="asset.recommendation" class="flex items-center">
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
                  <NuxtLink
                    :to="`/security/${asset.symbol}`"
                    class="text-accent-600 hover:text-accent-900 p-1"
                    title="Security Details & News"
                  >
                    <NewspaperIcon class="w-4 h-4" />
                  </NuxtLink>
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

      <div v-if="loading" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <h3 class="text-lg font-medium text-white mb-2">Loading assets...</h3>
        <p class="text-white/70">Fetching your portfolio data</p>
      </div>

      <div v-else-if="filteredAssets.length === 0" class="text-center py-12">
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
              <span class="text-lg font-semibold text-white">{{ recommendation.security?.symbol || 'Unknown' }}</span>
              <span
                :class="[
                  'px-2 py-1 text-xs font-medium rounded-full',
                  recommendation.action === 'buy' ? 'bg-accent-100 text-accent-800' :
                  recommendation.action === 'sell' ? 'bg-danger-100 text-danger-800' :
                  'bg-primary-100 text-primary-800'
                ]"
              >
                {{ (recommendation.action || 'HOLD').toUpperCase() }}
              </span>
            </div>
            <div class="text-right">
              <div class="text-sm font-medium text-white">
                {{ Math.round(Math.random() * 100) }}%
              </div>
              <div class="text-xs text-white/60">confidence</div>
            </div>
          </div>
          <p class="text-sm text-white/70 mb-3">{{ recommendation.description || 'AI-generated investment recommendation' }}</p>
          <div v-if="recommendation.amount" class="text-sm">
            <span class="text-white/70">Target Amount: </span>
            <span class="font-medium text-white">${{ recommendation.amount.toFixed(2) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Add Security Modal -->
  <div v-if="showAddAssetModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="card-dark rounded-lg shadow-xl max-w-lg w-full mx-4 p-6">
      <h3 class="text-lg font-semibold text-white mb-4">Add Security to Portfolio</h3>
      
      <form @submit.prevent="addSecurityToPortfolio" class="space-y-4">
        <!-- Security Search -->
        <div>
          <label class="block text-sm font-medium text-white mb-2">Search Security</label>
          <div class="relative">
            <input
              v-model="securitySearchQuery"
              @input="searchSecurities"
              type="text"
              placeholder="Search by symbol or name (e.g., AAPL, Apple)"
              class="input-field w-full pr-10"
              autocomplete="off"
            />
            <MagnifyingGlassIcon class="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
          </div>
          
          <!-- Search Results -->
          <div v-if="searchResults.length > 0" class="mt-2 max-h-48 overflow-y-auto border border-white/20 rounded-lg bg-background-800">
            <button
              v-for="security in searchResults"
              :key="security.id"
              type="button"
              @click="selectSecurity(security)"
              class="w-full text-left px-4 py-3 hover:bg-white/10 transition-colors duration-200 border-b border-white/10 last:border-b-0"
            >
              <div class="flex items-center justify-between">
                <div>
                  <div class="font-medium text-white">{{ security.symbol }}</div>
                  <div class="text-sm text-white/70">{{ security.name }}</div>
                </div>
                <div class="text-right text-sm text-white/60">
                  <div>{{ security.asset_type || 'Stock' }}</div>
                  <div v-if="security.exchange">{{ security.exchange }}</div>
                </div>
              </div>
            </button>
          </div>
          
          <div v-else-if="securitySearchQuery.length > 2 && !isSearching" class="mt-2 text-sm text-white/60">
            No securities found. Try a different search term.
          </div>
        </div>

        <!-- Selected Security -->
        <div v-if="selectedSecurity" class="border border-white/20 rounded-lg p-4 bg-white/5">
          <div class="flex items-center justify-between mb-3">
            <div>
              <div class="font-medium text-white">{{ selectedSecurity.symbol }}</div>
              <div class="text-sm text-white/70">{{ selectedSecurity.name }}</div>
            </div>
            <button
              type="button"
              @click="selectedSecurity = null"
              class="text-white/60 hover:text-white"
              title="Remove selection"
            >
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Transaction Details -->
        <div v-if="selectedSecurity" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-white mb-2">Number of Shares</label>
            <input
              v-model.number="transactionData.amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="e.g., 10"
              class="input-field w-full"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-white mb-2">Price per Share ($)</label>
            <input
              v-model.number="transactionData.pricePerShare"
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="e.g., 150.00"
              class="input-field w-full"
            />
          </div>
          
          <div class="bg-white/5 border border-white/20 rounded-lg p-3">
            <div class="flex justify-between items-center">
              <span class="text-white/70">Total Investment:</span>
              <span class="font-medium text-white">
                ${{ ((transactionData.amount || 0) * (transactionData.pricePerShare || 0)).toFixed(2) }}
              </span>
            </div>
          </div>
        </div>

        <div class="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            @click="closeAddAssetModal"
            class="btn-secondary"
            :disabled="isAddingSecurity"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="btn-primary"
            :disabled="!selectedSecurity || !transactionData.amount || !transactionData.pricePerShare || isAddingSecurity"
          >
            <span v-if="isAddingSecurity">Adding...</span>
            <span v-else>Add to Portfolio</span>
          </button>
        </div>
      </form>
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
  ChartBarIcon,
  NewspaperIcon,
  XMarkIcon,
  BuildingLibraryIcon
} from '@heroicons/vue/24/outline'
import type { Database } from '~/types/database'

definePageMeta({
  middleware: 'auth'
})

const showAddAssetModal = ref(false)
const selectedPortfolioId = ref('all')
const searchQuery = ref('')
const sortBy = ref('symbol')
const loading = ref(true)

const supabase = useSupabaseClient<Database>()
const user = useSupabaseUser()

// Real data from database
const portfolios = ref<any[]>([])
const assets = ref<any[]>([])
const aiRecommendations = ref<any[]>([])

// Security Management
const securitySearchQuery = ref('')
const searchResults = ref<any[]>([])
const selectedSecurity = ref<any>(null)
const isSearching = ref(false)
const isAddingSecurity = ref(false)
const transactionData = ref({
  amount: null as number | null,
  pricePerShare: null as number | null
})

// Load portfolios and assets on mount
onMounted(async () => {
  if (user.value) {
    await Promise.all([
      loadPortfolios(),
      loadPortfolioAssets(),
      loadAIRecommendations()
    ])
    loading.value = false
  }
})

const loadPortfolios = async () => {
  if (!user.value) return

  try {
    const portfoliosData = await usePortfolios()
    portfolios.value = portfoliosData || []
  } catch (error) {
    console.error('Error loading portfolios:', error)
    portfolios.value = []
  }
}

const loadAIRecommendations = async () => {
  if (!user.value) return

  try {
    const recommendations = await useAIRecommendations()
    aiRecommendations.value = recommendations || []
  } catch (error) {
    console.error('Error loading AI recommendations:', error)
    aiRecommendations.value = []
  }
}

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

const loadPortfolioAssets = async () => {
  if (!user.value) return

  try {
    // First load basic portfolio securities data
    const portfolioId = selectedPortfolioId.value === 'all' ? undefined : selectedPortfolioId.value
    const portfolioSecurities = await usePortfolioAssets(portfolioId)

    if (!portfolioSecurities || portfolioSecurities.length === 0) {
      assets.value = []
      return
    }

    // Transform the basic data first
    const basicAssets = portfolioSecurities.map((ps: any) => {
      const security = ps.security
      if (!security) return null

      const avgPrice = ps.worth / ps.amount || 0

      return {
        id: ps.id,
        symbol: security.symbol,
        name: security.name || security.symbol,
        quantity: ps.amount,
        average_price: avgPrice,
        current_price: 0, // Will be loaded separately
        change: 0,
        changePercentage: 0,
        weight: 15, // Placeholder
        ai_analysis: null, // Will be loaded separately
        recommendation: null,
        security_id: security.id
      }
    }).filter(Boolean)

    assets.value = basicAssets

    // Load additional data separately to avoid complex queries
    await loadAssetPrices()
    await loadAssetAnalysis()
    
  } catch (error) {
    console.error('Error loading portfolio assets:', error)
    assets.value = []
  }
}

// Load current prices for assets separately
const loadAssetPrices = async () => {
  if (!assets.value.length) return

  try {
    for (const asset of assets.value) {
      if (asset.security_id) {
        const { data: priceData, error } = await supabase
          .from('security_prices')
          .select('close')
          .eq('security_id', asset.security_id)
          .order('date', { ascending: false })
          .limit(1)

        // Handle the case where no price data exists
        let currentPrice = 0
        if (!error && priceData && priceData.length > 0) {
          currentPrice = priceData[0].close || 0
        }

        const totalValue = asset.quantity * currentPrice
        const totalCost = asset.quantity * asset.average_price
        const change = totalValue - totalCost
        const changePercentage = totalCost > 0 ? (change / totalCost) * 100 : 0

        // Update the asset with price data
        asset.current_price = currentPrice
        asset.change = change
        asset.changePercentage = changePercentage
      }
    }
  } catch (error) {
    console.error('Error loading asset prices:', error)
  }
}

// Load AI analysis for assets separately
const loadAssetAnalysis = async () => {
  if (!assets.value.length) return

  try {
    for (const asset of assets.value) {
      if (asset.security_id) {
        const { data: analysisData, error } = await supabase
          .from('security_analysis')
          .select('assessment, recommendation, created_at')
          .eq('security_id', asset.security_id)
          .order('created_at', { ascending: false })
          .limit(1)

        // Handle the case where no analysis exists
        if (!error && analysisData && analysisData.length > 0) {
          asset.ai_analysis = analysisData[0]
        } else {
          asset.ai_analysis = null
        }
      }
    }
  } catch (error) {
    console.error('Error loading asset analysis:', error)
  }
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

const removeAsset = async (asset: any) => {
  if (!confirm(`Are you sure you want to remove ${asset.symbol} from your portfolio?`)) {
    return
  }

  try {
    await useRemoveSecurityFromPortfolio(asset.id)
    await loadPortfolioAssets()
    alert(`Successfully removed ${asset.symbol} from your portfolio.`)
  } catch (error) {
    console.error('Error removing asset:', error)
    alert('Failed to remove asset from portfolio. Please try again.')
  }
}

// Security Management Functions
const searchSecurities = async () => {
  const query = securitySearchQuery.value.trim()
  if (query.length < 2) {
    searchResults.value = []
    return
  }

  isSearching.value = true
  try {
    const results = await useSearchSecurities(query, 10)
    searchResults.value = results
  } catch (error) {
    console.error('Error searching securities:', error)
    searchResults.value = []
  } finally {
    isSearching.value = false
  }
}

const selectSecurity = (security: any) => {
  selectedSecurity.value = security
  searchResults.value = []
  securitySearchQuery.value = security.symbol
}

const closeAddAssetModal = () => {
  showAddAssetModal.value = false
  // Reset form
  securitySearchQuery.value = ''
  searchResults.value = []
  selectedSecurity.value = null
  transactionData.value = { amount: null, pricePerShare: null }
}

const addSecurityToPortfolio = async () => {
  if (!selectedSecurity.value || !transactionData.value.amount || !transactionData.value.pricePerShare) {
    return
  }

  if (selectedPortfolioId.value === 'all') {
    alert('Please select a specific portfolio to add the security to.')
    return
  }

  isAddingSecurity.value = true
  try {
    const totalWorth = transactionData.value.amount * transactionData.value.pricePerShare

    await useAddSecurityToPortfolio(selectedPortfolioId.value, {
      securityId: selectedSecurity.value.id,
      amount: transactionData.value.amount,
      worth: totalWorth
    })

    // Close modal and reload data
    closeAddAssetModal()
    await loadPortfolioAssets()
    
    // Show success message
    alert(`Successfully added ${transactionData.value.amount} shares of ${selectedSecurity.value.symbol} to your portfolio!`)
  } catch (error) {
    console.error('Error adding security to portfolio:', error)
    alert('Failed to add security to portfolio. Please try again.')
  } finally {
    isAddingSecurity.value = false
  }
}

useHead({
  title: 'Portfolio - StockAdvisor'
})
</script>