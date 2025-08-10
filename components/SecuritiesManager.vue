<template>
  <div class="relative space-y-6">
    <!-- Floating Background Effects -->
    <div class="absolute -top-20 -left-20 w-32 h-32 bg-gradient-to-r from-primary-500/20 to-accent-500/20 rounded-full blur-2xl animate-float-slow pointer-events-none"></div>
    <div class="absolute -bottom-10 -right-10 w-24 h-24 bg-gradient-to-l from-accent-400/15 to-primary-400/15 rounded-full blur-xl animate-float-reverse pointer-events-none"></div>

    <!-- Add Security Form -->
    <div class="relative group">
      <div class="absolute -inset-1 bg-gradient-to-r from-primary-600/30 to-accent-600/30 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
      <div class="relative glass-dark rounded-2xl p-8 border border-primary-500/30 hover:border-primary-400/50 transition-all duration-300">
        <div class="flex items-center mb-6">
          <div class="w-12 h-12 bg-gradient-to-r from-primary-500/20 to-accent-500/20 rounded-full flex items-center justify-center border border-primary-500/30 mr-4">
            <PlusIcon class="w-6 h-6 text-primary-400" />
          </div>
          <div>
            <h3 class="text-xl font-bold text-white">Add Security</h3>
            <p class="text-white/70 text-sm">Search and add securities to your portfolio</p>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <!-- Security Search -->
          <div class="lg:col-span-2">
            <label class="block text-sm font-semibold text-white mb-3">
              Security (Ticker or Company Name)
            </label>
            <div class="relative">
              <input
                v-model="searchQuery"
                type="text"
                class="input-field pr-10"
                placeholder="e.g., AAPL, Apple Inc."
                @input="searchSecurities"
                @focus="showResults = true"
                @blur="hideResults"
              />
              <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
                <MagnifyingGlassIcon class="h-5 w-5 text-white/40" />
              </div>
              
              <!-- Search Results Dropdown -->
              <div 
                v-if="showResults && searchResults.length > 0"
                class="absolute z-10 mt-2 w-full glass-dark border border-primary-500/30 shadow-2xl max-h-60 rounded-xl py-2 text-base overflow-auto backdrop-blur-xl"
              >
                <div
                  v-for="security in searchResults"
                  :key="security.id"
                  @mousedown="selectSecurity(security)"
                  class="cursor-pointer select-none relative py-3 px-4 hover:bg-gradient-to-r hover:from-primary-500/20 hover:to-accent-500/20 transition-all duration-200 rounded-lg mx-2"
                >
                  <div class="flex items-center">
                    <div class="flex-1">
                      <span class="font-medium text-white">{{ security.symbol }}</span>
                      <span class="ml-2 text-white/70">{{ security.name }}</span>
                    </div>
                    <div class="text-sm text-white/60">
                      {{ security.exchange }}
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- No Results -->
              <div 
                v-if="showResults && searchQuery && searchResults.length === 0 && !searching"
                class="absolute z-10 mt-2 w-full glass-dark border border-white/20 shadow-2xl rounded-xl py-4 text-center text-sm text-white/60 backdrop-blur-xl"
              >
                No securities found
              </div>
            </div>
          </div>
          
          <!-- Number of Shares -->
          <div>
            <label class="block text-sm font-semibold text-white mb-3">
              Shares
            </label>
            <input
              v-model.number="newSecurity.shares"
              type="number"
              step="0.001"
              min="0"
              class="input-field"
              placeholder="100"
            />
          </div>
          
          <!-- Average Price -->
          <div>
            <label class="block text-sm font-semibold text-white mb-3">
              Price per Share
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span class="text-white/60">$</span>
              </div>
              <input
                v-model.number="newSecurity.averagePrice"
                type="number"
                step="0.01"
                min="0"
                class="input-field pl-7"
                placeholder="0.00"
              />
            </div>
          </div>
          
          <!-- Purchase Date -->
          <div class="md:col-span-2 lg:col-span-4">
            <label class="block text-sm font-semibold text-white mb-3">
              Purchase Date
            </label>
            <input
              v-model="newSecurity.purchaseDate"
              type="date"
              class="input-field max-w-xs"
            />
          </div>
        </div>
        
        <div class="flex justify-end">
          <button
            @click="addSecurity"
            :disabled="!canAddSecurity"
            class="btn-primary px-8 py-3 text-base font-semibold"
            :class="{ 'opacity-50 cursor-not-allowed': !canAddSecurity }"
          >
            <PlusIcon class="w-5 h-5 mr-2" />
            Add to Portfolio
          </button>
        </div>
      </div>
    </div>
    
    <!-- Securities List -->
    <div v-if="securities.length > 0" class="relative space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-2xl font-bold text-white">Portfolio <span class="gradient-text">Securities</span></h3>
          <p class="text-white/70 mt-1">{{ securities.length }} {{ securities.length === 1 ? 'security' : 'securities' }} worth ${{ formatCurrency(totalValue) }}</p>
        </div>
      </div>
      
      <div class="grid gap-4">
        <div
          v-for="(security, index) in securities"
          :key="index"
          class="group relative"
        >
          <div class="absolute -inset-0.5 bg-gradient-to-r from-primary-600/20 to-accent-600/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-300"></div>
          <div class="relative glass-dark rounded-2xl p-6 border border-white/20 hover:border-primary-400/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary-500/10">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-4 flex-1">
                <div class="flex-shrink-0">
                  <div class="w-12 h-12 bg-gradient-to-r from-primary-500/20 to-accent-500/20 rounded-full flex items-center justify-center border border-primary-500/30">
                    <span class="text-sm font-bold text-primary-400">{{ security.symbol.slice(0, 2).toUpperCase() }}</span>
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="font-bold text-lg text-white">
                    {{ security.symbol }}
                  </div>
                  <div class="text-white/70 text-sm truncate">
                    {{ security.name }}
                  </div>
                  <div class="text-xs text-white/50 mt-1">
                    {{ security.exchange }}
                  </div>
                </div>
                <div class="text-right hidden sm:block">
                  <div class="text-sm text-white/70 mb-1">
                    Shares
                  </div>
                  <div class="font-bold text-white text-lg">
                    {{ formatNumber(security.shares) }}
                  </div>
                  <div class="text-xs text-white/60">
                    @ ${{ formatCurrency(security.averagePrice) }}
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-sm text-white/70 mb-1">
                    Total Value
                  </div>
                  <div class="font-bold text-xl text-white">
                    ${{ formatCurrency(security.shares * security.averagePrice) }}
                  </div>
                  <div class="text-xs text-white/60">
                    {{ ((security.shares * security.averagePrice) / totalValue * 100).toFixed(1) }}% of portfolio
                  </div>
                </div>
                <div class="text-right hidden md:block min-w-[120px]">
                  <div class="text-sm text-white/70 mb-1">
                    Purchase Date
                  </div>
                  <div class="text-sm text-white font-medium">
                    {{ security.purchaseDate ? formatDate(security.purchaseDate) : 'Not specified' }}
                  </div>
                </div>
              </div>
              <button
                @click="removeSecurity(index)"
                class="ml-4 p-3 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-xl transition-all duration-200 border border-red-500/20 hover:border-red-500/40"
                title="Remove security"
              >
                <TrashIcon class="w-5 h-5" />
              </button>
            </div>
            <!-- Mobile-only additional info -->
            <div class="sm:hidden mt-4 pt-4 border-t border-white/10">
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span class="text-white/70">Shares: </span>
                  <span class="text-white font-medium">{{ formatNumber(security.shares) }}</span>
                </div>
                <div>
                  <span class="text-white/70">Price: </span>
                  <span class="text-white font-medium">${{ formatCurrency(security.averagePrice) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Portfolio Summary -->
      <div class="relative group mt-8">
        <div class="absolute -inset-0.5 bg-gradient-to-r from-accent-600/30 to-primary-600/30 rounded-2xl blur opacity-40"></div>
        <div class="relative glass-dark rounded-2xl p-6 border border-accent-500/30">
          <div class="text-center">
            <h4 class="text-lg font-bold text-white mb-4">Portfolio Summary</h4>
            <div class="grid grid-cols-2 gap-6">
              <div class="text-center">
                <div class="text-3xl font-bold gradient-text mb-1">{{ securities.length }}</div>
                <div class="text-white/70 text-sm font-medium">{{ securities.length === 1 ? 'Security' : 'Securities' }}</div>
              </div>
              <div class="text-center">
                <div class="text-3xl font-bold text-white mb-1">${{ formatCurrency(totalValue) }}</div>
                <div class="text-white/70 text-sm font-medium">Total Value</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Empty State -->
    <div v-else class="relative">
      <div class="absolute -inset-1 bg-gradient-to-r from-primary-600/20 to-accent-600/20 rounded-2xl blur opacity-30"></div>
      <div class="relative glass-dark rounded-2xl border border-white/20 p-12 text-center">
        <div class="w-20 h-20 bg-gradient-to-r from-primary-500/20 to-accent-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary-500/30">
          <CurrencyDollarIcon class="h-10 w-10 text-primary-400" />
        </div>
        <h3 class="text-xl font-bold text-white mb-2">No Securities Yet</h3>
        <p class="text-white/70 max-w-md mx-auto leading-relaxed">
          Start building your portfolio by adding your first security using the form above. Search for stocks, ETFs, or other investments to track.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  TrashIcon, 
  CurrencyDollarIcon 
} from '@heroicons/vue/24/outline'

interface Security {
  id: string
  symbol: string
  name: string
  exchange: string
  shares: number
  averagePrice: number
  purchaseDate?: string
}

interface PortfolioSecurity {
  id?: string
  portfolio_id?: string
  security_id: string
  security?: {
    id: string
    symbol: string
    name: string
    exchange: string
  }
  amount: number
  worth: number
}

interface Props {
  modelValue: Security[]
  isInitialSetup?: boolean
  portfolioId?: string
}

const props = withDefaults(defineProps<Props>(), {
  isInitialSetup: false
})

const emit = defineEmits<{
  'update:modelValue': [value: Security[]]
}>()

const supabase = useSupabaseClient()

// Component state
const searchQuery = ref('')
const searchResults = ref<any[]>([])
const showResults = ref(false)
const searching = ref(false)
let searchTimeout: NodeJS.Timeout

const newSecurity = ref({
  id: '',
  symbol: '',
  name: '',
  exchange: '',
  shares: 0,
  averagePrice: 0,
  purchaseDate: ''
})

// Computed
const securities = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const totalValue = computed(() => {
  return securities.value.reduce((sum, security) => sum + (security.shares * security.averagePrice), 0)
})

const canAddSecurity = computed(() => {
  return newSecurity.value.id && 
         newSecurity.value.shares > 0 && 
         newSecurity.value.averagePrice > 0
})

// Methods
const searchSecurities = () => {
  if (!searchQuery.value || searchQuery.value.length < 2) {
    searchResults.value = []
    return
  }
  
  searching.value = true
  clearTimeout(searchTimeout)
  
  searchTimeout = setTimeout(async () => {
    try {
      const { data, error } = await supabase
        .from('securities')
        .select('id, symbol, name, exchange')
        .or(`symbol.ilike.%${searchQuery.value}%,name.ilike.%${searchQuery.value}%`)
        .limit(10)
      
      if (error) throw error
      searchResults.value = data || []
    } catch (err) {
      console.error('Error searching securities:', err)
      searchResults.value = []
    } finally {
      searching.value = false
    }
  }, 300)
}

const selectSecurity = (security: any) => {
  newSecurity.value.id = security.id
  newSecurity.value.symbol = security.symbol
  newSecurity.value.name = security.name
  newSecurity.value.exchange = security.exchange
  searchQuery.value = `${security.symbol} - ${security.name}`
  showResults.value = false
}

const hideResults = () => {
  setTimeout(() => {
    showResults.value = false
  }, 200)
}

const addSecurity = async () => {
  if (!canAddSecurity.value) return
  
  // Check if security already exists
  const exists = securities.value.some(s => s.id === newSecurity.value.id)
  if (exists) {
    alert('This security is already in your portfolio')
    return
  }
  
  if (props.portfolioId && !props.isInitialSetup) {
    // We're managing an existing portfolio - create actual transactions
    await addSecurityToPortfolio()
  } else {
    // Initial setup mode - just update the local array
    const securityToAdd = { ...newSecurity.value }
    securities.value = [...securities.value, securityToAdd]
  }
  
  // Reset form
  resetForm()
}

const addSecurityToPortfolio = async () => {
  try {
    // Create buy transaction
    const { error: transactionError } = await supabase
      .from('portfolio_transactions')
      .insert({
        portfolio_id: props.portfolioId,
        security_id: newSecurity.value.id,
        action: 'buy',
        amount: newSecurity.value.shares,
        price: newSecurity.value.averagePrice,
        date: newSecurity.value.purchaseDate || new Date().toISOString().split('T')[0],
        fee: 0
      })
    
    if (transactionError) throw transactionError
    
    // Check if portfolio_security already exists
    const { data: existingSecurity } = await supabase
      .from('portfolio_securities')
      .select('*')
      .eq('portfolio_id', props.portfolioId)
      .eq('security_id', newSecurity.value.id)
      .single()
    
    const totalAmount = (existingSecurity?.amount || 0) + newSecurity.value.shares
    const totalWorth = (existingSecurity?.worth || 0) + (newSecurity.value.shares * newSecurity.value.averagePrice)
    
    if (existingSecurity) {
      // Update existing portfolio_security
      const { error: updateError } = await supabase
        .from('portfolio_securities')
        .update({
          amount: totalAmount,
          worth: totalWorth
        })
        .eq('id', existingSecurity.id)
      
      if (updateError) throw updateError
    } else {
      // Create new portfolio_security entry
      const { error: insertError } = await supabase
        .from('portfolio_securities')
        .insert({
          portfolio_id: props.portfolioId,
          security_id: newSecurity.value.id,
          amount: newSecurity.value.shares,
          worth: newSecurity.value.shares * newSecurity.value.averagePrice
        })
      
      if (insertError) throw insertError
    }
    
    // Add to local array for display
    const securityToAdd = { ...newSecurity.value }
    securities.value = [...securities.value, securityToAdd]
    
  } catch (error) {
    console.error('Error adding security to portfolio:', error)
    alert('Failed to add security to portfolio. Please try again.')
  }
}

const resetForm = () => {
  newSecurity.value = {
    id: '',
    symbol: '',
    name: '',
    exchange: '',
    shares: 0,
    averagePrice: 0,
    purchaseDate: ''
  }
  searchQuery.value = ''
  searchResults.value = []
}

const removeSecurity = async (index: number) => {
  const security = securities.value[index]
  
  if (props.portfolioId && !props.isInitialSetup) {
    // We're managing an existing portfolio - create sell transaction
    await sellSecurityFromPortfolio(security)
  } else {
    // Initial setup mode - just remove from local array
    securities.value = securities.value.filter((_, i) => i !== index)
  }
}

const sellSecurityFromPortfolio = async (security: Security) => {
  try {
    // Create sell transaction (selling all shares)
    const { error: transactionError } = await supabase
      .from('portfolio_transactions')
      .insert({
        portfolio_id: props.portfolioId,
        security_id: security.id,
        action: 'sell',
        amount: security.shares,
        price: security.averagePrice, // Using same price for simplicity in demo
        date: new Date().toISOString().split('T')[0],
        fee: 0
      })
    
    if (transactionError) throw transactionError
    
    // Update portfolio_securities (remove if selling all, otherwise update amount/worth)
    const { data: existingSecurity } = await supabase
      .from('portfolio_securities')
      .select('*')
      .eq('portfolio_id', props.portfolioId)
      .eq('security_id', security.id)
      .single()
    
    if (existingSecurity) {
      const remainingAmount = existingSecurity.amount - security.shares
      
      if (remainingAmount <= 0) {
        // Remove portfolio_security entirely
        const { error: deleteError } = await supabase
          .from('portfolio_securities')
          .delete()
          .eq('id', existingSecurity.id)
        
        if (deleteError) throw deleteError
      } else {
        // Update remaining amount and worth
        const remainingWorth = existingSecurity.worth - (security.shares * security.averagePrice)
        
        const { error: updateError } = await supabase
          .from('portfolio_securities')
          .update({
            amount: remainingAmount,
            worth: remainingWorth
          })
          .eq('id', existingSecurity.id)
        
        if (updateError) throw updateError
      }
    }
    
    // Remove from local display
    const securityIndex = securities.value.findIndex(s => s.id === security.id)
    if (securityIndex !== -1) {
      securities.value = securities.value.filter((_, i) => i !== securityIndex)
    }
    
  } catch (error) {
    console.error('Error removing security from portfolio:', error)
    alert('Failed to remove security from portfolio. Please try again.')
  }
}

// Utility functions
const formatNumber = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3
  }).format(value)
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>