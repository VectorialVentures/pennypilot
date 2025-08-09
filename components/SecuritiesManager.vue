<template>
  <div class="space-y-6">
    <!-- Add Security Form -->
    <div class="border-2 border-dashed border-gray-300 rounded-lg p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Add Security</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <!-- Security Search -->
        <div class="lg:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-2">
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
              <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
            </div>
            
            <!-- Search Results Dropdown -->
            <div 
              v-if="showResults && searchResults.length > 0"
              class="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto"
            >
              <div
                v-for="security in searchResults"
                :key="security.id"
                @mousedown="selectSecurity(security)"
                class="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-50"
              >
                <div class="flex items-center">
                  <div class="flex-1">
                    <span class="font-medium text-gray-900">{{ security.symbol }}</span>
                    <span class="ml-2 text-gray-500">{{ security.name }}</span>
                  </div>
                  <div class="text-sm text-gray-500">
                    {{ security.exchange }}
                  </div>
                </div>
              </div>
            </div>
            
            <!-- No Results -->
            <div 
              v-if="showResults && searchQuery && searchResults.length === 0 && !searching"
              class="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-2 text-center text-sm text-gray-500"
            >
              No securities found
            </div>
          </div>
        </div>
        
        <!-- Number of Shares -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Number of Shares
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
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Average Price per Share
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span class="text-gray-500">$</span>
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
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Purchase Date (Optional)
          </label>
          <input
            v-model="newSecurity.purchaseDate"
            type="date"
            class="input-field"
          />
        </div>
      </div>
      
      <button
        @click="addSecurity"
        :disabled="!canAddSecurity"
        class="btn-primary"
        :class="{ 'opacity-50 cursor-not-allowed': !canAddSecurity }"
      >
        <PlusIcon class="w-4 h-4 mr-2" />
        Add Security
      </button>
    </div>
    
    <!-- Securities List -->
    <div v-if="securities.length > 0" class="space-y-3">
      <h3 class="text-lg font-semibold text-gray-900">Portfolio Securities</h3>
      
      <div class="space-y-2">
        <div
          v-for="(security, index) in securities"
          :key="index"
          class="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
        >
          <div class="flex-1">
            <div class="flex items-center space-x-4">
              <div class="flex-1">
                <div class="font-medium text-gray-900">
                  {{ security.symbol }}
                </div>
                <div class="text-sm text-gray-500">
                  {{ security.name }}
                </div>
              </div>
              
              <div class="text-right">
                <div class="font-medium text-gray-900">
                  {{ formatNumber(security.shares) }} shares
                </div>
                <div class="text-sm text-gray-500">
                  @ ${{ formatCurrency(security.averagePrice) }}
                </div>
              </div>
              
              <div class="text-right">
                <div class="font-medium text-gray-900">
                  ${{ formatCurrency(security.shares * security.averagePrice) }}
                </div>
                <div class="text-sm text-gray-500">
                  Total Value
                </div>
              </div>
              
              <div class="text-right min-w-[100px]">
                <div class="text-sm text-gray-500">
                  {{ security.purchaseDate ? formatDate(security.purchaseDate) : 'No date' }}
                </div>
              </div>
            </div>
          </div>
          
          <button
            @click="removeSecurity(index)"
            class="ml-4 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
          >
            <TrashIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <!-- Portfolio Summary -->
      <div class="bg-gray-50 rounded-lg p-4 mt-4">
        <div class="flex justify-between items-center text-sm">
          <span class="text-gray-600">Total Securities:</span>
          <span class="font-medium">{{ securities.length }}</span>
        </div>
        <div class="flex justify-between items-center text-sm mt-1">
          <span class="text-gray-600">Total Investment Value:</span>
          <span class="font-medium">${{ formatCurrency(totalValue) }}</span>
        </div>
      </div>
    </div>
    
    <!-- Empty State -->
    <div v-else class="text-center py-8">
      <CurrencyDollarIcon class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-sm font-medium text-gray-900">No securities added</h3>
      <p class="mt-1 text-sm text-gray-500">
        Add your first security using the form above
      </p>
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