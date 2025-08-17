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
            <h1 class="text-3xl font-bold gradient-text">Browse Securities</h1>
            <p class="text-white/70 mt-2">Discover and explore available investment securities</p>
          </div>
          <div class="flex items-center space-x-3 mt-4 sm:mt-0">
            <div class="text-right text-sm text-white/60">
              <div>{{ filteredSecurities.length }} securities found</div>
              <div v-if="filters.search || filters.assetType || filters.sector">Filtered results</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters and Search -->
      <div class="card-dark mb-8">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <!-- Search -->
          <div class="flex-1 max-w-md">
            <div class="relative">
              <MagnifyingGlassIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
              <input
                v-model="filters.search"
                @input="debouncedFilter"
                type="text"
                placeholder="Search by symbol or company name..."
                class="input-field pl-10 pr-4 py-2 w-full"
              />
            </div>
          </div>

          <!-- Filters -->
          <div class="flex flex-wrap items-center gap-3">
            <select v-model="filters.assetType" @change="applyFilters" class="input-field w-auto">
              <option value="">All Asset Types</option>
              <option value="stock">Stocks</option>
              <option value="etf">ETFs</option>
              <option value="bond">Bonds</option>
              <option value="crypto">Crypto</option>
              <option value="commodity">Commodities</option>
            </select>

            <select v-model="filters.sector" @change="applyFilters" class="input-field w-auto">
              <option value="">All Sectors</option>
              <option value="Technology">Technology</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Financial Services">Financial Services</option>
              <option value="Consumer Cyclical">Consumer Cyclical</option>
              <option value="Communication Services">Communication Services</option>
              <option value="Industrials">Industrials</option>
              <option value="Consumer Defensive">Consumer Defensive</option>
              <option value="Energy">Energy</option>
              <option value="Utilities">Utilities</option>
              <option value="Real Estate">Real Estate</option>
              <option value="Basic Materials">Basic Materials</option>
            </select>


            <button @click="clearFilters" class="btn-ghost text-sm">
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <!-- Securities Grid -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="flex items-center space-x-2">
          <svg class="animate-spin h-8 w-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span class="text-lg text-white">Loading securities...</span>
        </div>
      </div>

      <div v-else-if="filteredSecurities.length === 0" class="text-center py-12">
        <ChartBarIcon class="w-16 h-16 text-white/40 mx-auto mb-4" />
        <h3 class="text-xl font-medium text-white mb-2">No securities found</h3>
        <p class="text-white/70 mb-4">
          {{ filters.search || filters.assetType || filters.sector ? 'Try adjusting your filters or search criteria' : 'No securities available in the database' }}
        </p>
        <button v-if="filters.search || filters.assetType || filters.sector" @click="clearFilters" class="btn-primary">
          Clear Filters
        </button>
      </div>

      <!-- Securities Table -->
      <div v-else class="card-dark">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-white/10">
            <thead class="bg-white/5">
              <tr>
                <th 
                  @click="handleSort('symbol')"
                  class="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider cursor-pointer hover:text-white/80 transition-colors duration-200"
                >
                  <div class="flex items-center space-x-1">
                    <span>Symbol</span>
                    <ChevronUpIcon v-if="sortBy === 'symbol' && sortDirection === 'asc'" class="w-3 h-3" />
                    <ChevronDownIcon v-else-if="sortBy === 'symbol' && sortDirection === 'desc'" class="w-3 h-3" />
                    <ChevronUpDownIcon v-else class="w-3 h-3 opacity-50" />
                  </div>
                </th>
                <th 
                  @click="handleSort('name')"
                  class="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider cursor-pointer hover:text-white/80 transition-colors duration-200"
                >
                  <div class="flex items-center space-x-1">
                    <span>Name</span>
                    <ChevronUpIcon v-if="sortBy === 'name' && sortDirection === 'asc'" class="w-3 h-3" />
                    <ChevronDownIcon v-else-if="sortBy === 'name' && sortDirection === 'desc'" class="w-3 h-3" />
                    <ChevronUpDownIcon v-else class="w-3 h-3 opacity-50" />
                  </div>
                </th>
                <th 
                  @click="handleSort('asset_type')"
                  class="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider cursor-pointer hover:text-white/80 transition-colors duration-200"
                >
                  <div class="flex items-center space-x-1">
                    <span>Type</span>
                    <ChevronUpIcon v-if="sortBy === 'asset_type' && sortDirection === 'asc'" class="w-3 h-3" />
                    <ChevronDownIcon v-else-if="sortBy === 'asset_type' && sortDirection === 'desc'" class="w-3 h-3" />
                    <ChevronUpDownIcon v-else class="w-3 h-3 opacity-50" />
                  </div>
                </th>
                <th 
                  @click="handleSort('exchange')"
                  class="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider cursor-pointer hover:text-white/80 transition-colors duration-200"
                >
                  <div class="flex items-center space-x-1">
                    <span>Exchange</span>
                    <ChevronUpIcon v-if="sortBy === 'exchange' && sortDirection === 'asc'" class="w-3 h-3" />
                    <ChevronDownIcon v-else-if="sortBy === 'exchange' && sortDirection === 'desc'" class="w-3 h-3" />
                    <ChevronUpDownIcon v-else class="w-3 h-3 opacity-50" />
                  </div>
                </th>
                <th 
                  @click="handleSort('sector')"
                  class="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider cursor-pointer hover:text-white/80 transition-colors duration-200"
                >
                  <div class="flex items-center space-x-1">
                    <span>Sector</span>
                    <ChevronUpIcon v-if="sortBy === 'sector' && sortDirection === 'asc'" class="w-3 h-3" />
                    <ChevronDownIcon v-else-if="sortBy === 'sector' && sortDirection === 'desc'" class="w-3 h-3" />
                    <ChevronUpDownIcon v-else class="w-3 h-3 opacity-50" />
                  </div>
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-transparent divide-y divide-white/10">
              <tr
                v-for="security in paginatedSecurities"
                :key="security.id"
                class="hover:bg-white/5 transition-colors duration-200"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <div class="h-10 w-10 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center">
                        <span class="text-white font-semibold text-sm">{{ security.symbol.charAt(0) }}</span>
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-white">{{ security.symbol }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm text-white max-w-xs truncate" :title="security.name">
                    {{ security.name || 'N/A' }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="[
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      getAssetTypeColor(security.asset_type)
                    ]"
                  >
                    {{ security.asset_type || 'Stock' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-white/70">{{ security.exchange || 'N/A' }}</div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm text-white/70 max-w-xs truncate" :title="security.sector">
                    {{ security.sector || 'N/A' }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex justify-end space-x-2">
                    <button
                      @click="viewSecurityDetails(security)"
                      class="text-primary-600 hover:text-primary-900 p-1"
                      title="View Details"
                    >
                      <EyeIcon class="w-4 h-4" />
                    </button>
                    <button
                      @click="addToPortfolio(security)"
                      class="text-accent-600 hover:text-accent-900 p-1"
                      title="Add to Portfolio"
                    >
                      <PlusIcon class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-center mt-8 space-x-2">
        <button
          @click="currentPage = Math.max(1, currentPage - 1)"
          :disabled="currentPage === 1"
          class="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        
        <div class="flex space-x-1">
          <button
            v-for="page in visiblePages"
            :key="page"
            @click="currentPage = page"
            :class="[
              'px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200',
              page === currentPage 
                ? 'bg-primary-600 text-white' 
                : 'text-white/70 hover:text-primary-400 hover:bg-white/10'
            ]"
          >
            {{ page }}
          </button>
        </div>
        
        <button
          @click="currentPage = Math.min(totalPages, currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  </div>

  <!-- Add to Portfolio Modal -->
  <div v-if="showAddToPortfolioModal && selectedSecurityForAdd" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="card-dark rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
      <h3 class="text-lg font-semibold text-white mb-4">Add {{ selectedSecurityForAdd.symbol }} to Portfolio</h3>
      
      <form @submit.prevent="confirmAddToPortfolio" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-white mb-2">Select Portfolio</label>
          <select v-model="addToPortfolioData.portfolioId" required class="input-field w-full">
            <option value="">Choose a portfolio...</option>
            <option
              v-for="portfolio in portfolios"
              :key="portfolio.id"
              :value="portfolio.id"
            >
              {{ portfolio.name }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-white mb-2">Number of Shares</label>
          <input
            v-model.number="addToPortfolioData.amount"
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
            v-model.number="addToPortfolioData.pricePerShare"
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
              ${{ ((addToPortfolioData.amount || 0) * (addToPortfolioData.pricePerShare || 0)).toFixed(2) }}
            </span>
          </div>
        </div>

        <div class="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            @click="closeAddToPortfolioModal"
            class="btn-secondary"
            :disabled="isAddingToPortfolio"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="btn-primary"
            :disabled="!addToPortfolioData.portfolioId || !addToPortfolioData.amount || !addToPortfolioData.pricePerShare || isAddingToPortfolio"
          >
            <span v-if="isAddingToPortfolio">Adding...</span>
            <span v-else>Add to Portfolio</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  MagnifyingGlassIcon,
  ChartBarIcon,
  EyeIcon,
  PlusIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronUpDownIcon
} from '@heroicons/vue/24/outline'
import type { Database } from '~/types/database'

definePageMeta({
  middleware: 'auth'
})

const user = useSupabaseUser()
const supabase = useSupabaseClient<Database>()

// Reactive data
const loading = ref(true)
const securities = ref<any[]>([])
const portfolios = ref<any[]>([])
const currentPage = ref(1)
const itemsPerPage = 50

// Filters
const filters = ref({
  search: '',
  assetType: '',
  sector: ''
})
const sortBy = ref('symbol')
const sortDirection = ref('asc')

// Add to Portfolio Modal
const showAddToPortfolioModal = ref(false)
const selectedSecurityForAdd = ref<any>(null)
const isAddingToPortfolio = ref(false)
const addToPortfolioData = ref({
  portfolioId: '',
  amount: null as number | null,
  pricePerShare: null as number | null
})

// Computed properties
const filteredSecurities = computed(() => {
  let filtered = securities.value

  // Apply search filter
  if (filters.value.search) {
    const searchTerm = filters.value.search.toLowerCase()
    filtered = filtered.filter(security =>
      security.symbol.toLowerCase().includes(searchTerm) ||
      (security.name && security.name.toLowerCase().includes(searchTerm))
    )
  }

  // Apply asset type filter
  if (filters.value.assetType) {
    filtered = filtered.filter(security => security.asset_type === filters.value.assetType)
  }

  // Apply sector filter
  if (filters.value.sector) {
    filtered = filtered.filter(security => security.sector === filters.value.sector)
  }

  // Apply sorting
  filtered.sort((a, b) => {
    const aValue = a[sortBy.value] || ''
    const bValue = b[sortBy.value] || ''
    const comparison = aValue.localeCompare(bValue)
    return sortDirection.value === 'asc' ? comparison : -comparison
  })

  return filtered
})

const totalPages = computed(() => Math.ceil(filteredSecurities.value.length / itemsPerPage))

const paginatedSecurities = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredSecurities.value.slice(start, end)
})

const visiblePages = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = currentPage.value
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i)
      pages.push('...', total)
    } else if (current >= total - 3) {
      pages.push(1, '...')
      for (let i = total - 4; i <= total; i++) pages.push(i)
    } else {
      pages.push(1, '...', current - 1, current, current + 1, '...', total)
    }
  }
  
  return pages.filter(p => p !== '...' || pages.indexOf(p) === pages.lastIndexOf(p))
})

// Debounced filter function
let filterTimeout: NodeJS.Timeout
const debouncedFilter = () => {
  clearTimeout(filterTimeout)
  filterTimeout = setTimeout(() => {
    applyFilters()
  }, 300)
}

// Methods
const loadSecurities = async () => {
  loading.value = true
  try {
    const { data: allSecurities, error } = await supabase
      .from('securities')
      .select('id, symbol, name, asset_type, exchange, sector, industry')
      .order('symbol')

    if (error) throw error
    securities.value = allSecurities || []
  } catch (error) {
    console.error('Error loading securities:', error)
  } finally {
    loading.value = false
  }
}

const loadPortfolios = async () => {
  if (!user.value) return

  try {
    const portfoliosData = await usePortfolios()
    portfolios.value = portfoliosData || []
  } catch (error) {
    console.error('Error loading portfolios:', error)
  }
}

const applyFilters = () => {
  currentPage.value = 1
}

const applySorting = () => {
  // Reactive sorting handled by computed property
}

const clearFilters = () => {
  filters.value = {
    search: '',
    assetType: '',
    sector: ''
  }
  sortBy.value = 'symbol'
  sortDirection.value = 'asc'
  currentPage.value = 1
}

const handleSort = (column: string) => {
  if (sortBy.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = column
    sortDirection.value = 'asc'
  }
  currentPage.value = 1
}

const getAssetTypeColor = (assetType: string) => {
  switch (assetType?.toLowerCase()) {
    case 'stock':
      return 'bg-blue-100 text-blue-800'
    case 'etf':
      return 'bg-green-100 text-green-800'
    case 'bond':
      return 'bg-purple-100 text-purple-800'
    case 'crypto':
      return 'bg-orange-100 text-orange-800'
    case 'commodity':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-secondary-100 text-secondary-800'
  }
}

const viewSecurityDetails = (security: any) => {
  navigateTo(`/security/${security.symbol}`)
}

const addToPortfolio = (security: any) => {
  selectedSecurityForAdd.value = security
  showAddToPortfolioModal.value = true
}

const closeAddToPortfolioModal = () => {
  showAddToPortfolioModal.value = false
  selectedSecurityForAdd.value = null
  addToPortfolioData.value = {
    portfolioId: '',
    amount: null,
    pricePerShare: null
  }
}

const confirmAddToPortfolio = async () => {
  if (!selectedSecurityForAdd.value || !addToPortfolioData.value.portfolioId || !addToPortfolioData.value.amount || !addToPortfolioData.value.pricePerShare) {
    return
  }

  isAddingToPortfolio.value = true
  try {
    const totalWorth = addToPortfolioData.value.amount * addToPortfolioData.value.pricePerShare

    await useAddSecurityToPortfolio(addToPortfolioData.value.portfolioId, {
      securityId: selectedSecurityForAdd.value.id,
      amount: addToPortfolioData.value.amount,
      worth: totalWorth
    })

    closeAddToPortfolioModal()
    alert(`Successfully added ${addToPortfolioData.value.amount} shares of ${selectedSecurityForAdd.value.symbol} to your portfolio!`)
  } catch (error) {
    console.error('Error adding security to portfolio:', error)
    alert('Failed to add security to portfolio. Please try again.')
  } finally {
    isAddingToPortfolio.value = false
  }
}

// Lifecycle
onMounted(async () => {
  await Promise.all([
    loadSecurities(),
    loadPortfolios()
  ])
})

useHead({
  title: 'Browse Securities - PennyPilot'
})
</script>