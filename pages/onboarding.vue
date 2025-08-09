<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
    <div class="max-w-4xl mx-auto px-4 py-8">
      <!-- Progress Bar -->
      <div class="mb-8">
        <div class="flex items-center justify-between text-sm text-gray-500 mb-2">
          <span>Step {{ currentStep }} of {{ totalSteps }}</span>
          <span>{{ Math.round((currentStep / totalSteps) * 100) }}% Complete</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div 
            class="bg-gradient-to-r from-primary-500 to-accent-500 h-2 rounded-full transition-all duration-300"
            :style="{ width: `${(currentStep / totalSteps) * 100}%` }"
          ></div>
        </div>
      </div>

      <!-- Welcome Header -->
      <div class="text-center mb-8" v-if="currentStep === 1">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Welcome to PennyPilot!</h1>
        <p class="text-lg text-gray-600">Let's create your first investment portfolio to get started.</p>
      </div>

      <!-- Step Content -->
      <div class="glass rounded-2xl shadow-lg p-8">
        
        <!-- Step 1: Portfolio Name -->
        <div v-if="currentStep === 1" class="space-y-6">
          <div class="text-center mb-6">
            <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FolderIcon class="w-8 h-8 text-primary-600" />
            </div>
            <h2 class="text-2xl font-bold text-gray-900">Name Your Portfolio</h2>
            <p class="text-gray-600">Choose a name that helps you identify this portfolio</p>
          </div>
          
          <div>
            <label for="portfolioName" class="block text-sm font-medium text-gray-700 mb-2">
              Portfolio Name
            </label>
            <input
              id="portfolioName"
              v-model="portfolioData.name"
              type="text"
              required
              class="input-field"
              placeholder="e.g., My Growth Portfolio, Tech Stocks, Retirement Fund"
              @keyup.enter="nextStep"
            />
          </div>
        </div>

        <!-- Step 2: Risk Level -->
        <div v-if="currentStep === 2" class="space-y-6">
          <div class="text-center mb-6">
            <div class="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ChartBarIcon class="w-8 h-8 text-accent-600" />
            </div>
            <h2 class="text-2xl font-bold text-gray-900">Risk Level</h2>
            <p class="text-gray-600">How much risk are you comfortable with for this portfolio?</p>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div 
              v-for="risk in riskLevels" 
              :key="risk.value"
              @click="portfolioData.riskLevel = risk.value"
              class="cursor-pointer border-2 rounded-lg p-4 transition-all duration-200"
              :class="portfolioData.riskLevel === risk.value ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'"
            >
              <div class="text-center">
                <div class="text-2xl mb-2">{{ risk.emoji }}</div>
                <h3 class="font-semibold text-gray-900">{{ risk.label }}</h3>
                <p class="text-sm text-gray-600 mt-2">{{ risk.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 3: Sectors -->
        <div v-if="currentStep === 3" class="space-y-6">
          <div class="text-center mb-6">
            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BuildingOfficeIcon class="w-8 h-8 text-green-600" />
            </div>
            <h2 class="text-2xl font-bold text-gray-900">Select Sectors</h2>
            <p class="text-gray-600">Choose one or more sectors you're interested in investing in</p>
          </div>
          
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <div 
              v-for="sector in sectors" 
              :key="sector.value"
              @click="toggleSector(sector.value)"
              class="cursor-pointer border-2 rounded-lg p-3 transition-all duration-200 text-center"
              :class="portfolioData.sectors.includes(sector.value) ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'"
            >
              <div class="text-lg mb-1">{{ sector.emoji }}</div>
              <div class="text-sm font-medium text-gray-900">{{ sector.label }}</div>
            </div>
          </div>
          
          <p class="text-sm text-gray-500 text-center">
            Selected: {{ portfolioData.sectors.length }} sector{{ portfolioData.sectors.length !== 1 ? 's' : '' }}
          </p>
        </div>

        <!-- Step 4: Investment Strategy -->
        <div v-if="currentStep === 4" class="space-y-6">
          <div class="text-center mb-6">
            <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <LightBulbIcon class="w-8 h-8 text-purple-600" />
            </div>
            <h2 class="text-2xl font-bold text-gray-900">Investment Philosophy</h2>
            <p class="text-gray-600">Describe your investment strategy or philosophy</p>
          </div>
          
          <div>
            <label for="strategy" class="block text-sm font-medium text-gray-700 mb-2">
              Investment Strategy
            </label>
            <textarea
              id="strategy"
              v-model="portfolioData.strategy"
              rows="4"
              class="input-field"
              placeholder="e.g., Focus on long-term growth companies with strong fundamentals, dividend-paying stocks for steady income, or value investing in undervalued companies..."
            ></textarea>
            <p class="text-sm text-gray-500 mt-2">
              This helps our AI understand your preferences when making recommendations
            </p>
          </div>
        </div>

        <!-- Step 5: Add Securities -->
        <div v-if="currentStep === 5" class="space-y-6">
          <div class="text-center mb-6">
            <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CurrencyDollarIcon class="w-8 h-8 text-blue-600" />
            </div>
            <h2 class="text-2xl font-bold text-gray-900">Add Securities</h2>
            <p class="text-gray-600">Add stocks, ETFs, or other securities to your portfolio</p>
          </div>
          
          <SecuritiesManager 
            v-model="portfolioData.securities" 
            :is-initial-setup="true"
          />
        </div>

        <!-- Step 6: Liquid Funds -->
        <div v-if="currentStep === 6" class="space-y-6">
          <div class="text-center mb-6">
            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BanknotesIcon class="w-8 h-8 text-green-600" />
            </div>
            <h2 class="text-2xl font-bold text-gray-900">Liquid Funds</h2>
            <p class="text-gray-600">How much cash do you have available in this portfolio?</p>
          </div>
          
          <div>
            <label for="liquidFunds" class="block text-sm font-medium text-gray-700 mb-2">
              Available Cash
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span class="text-gray-500">$</span>
              </div>
              <input
                id="liquidFunds"
                v-model="portfolioData.liquidFunds"
                type="number"
                step="0.01"
                min="0"
                required
                class="input-field pl-7"
                placeholder="0.00"
                @keyup.enter="nextStep"
              />
            </div>
            <p class="text-sm text-gray-500 mt-2">
              This represents cash that's available for future investments
            </p>
          </div>
        </div>

        <!-- Navigation Buttons -->
        <div class="flex justify-between mt-8 pt-6 border-t border-gray-200">
          <button
            v-if="currentStep > 1"
            @click="previousStep"
            class="btn-secondary"
          >
            <ChevronLeftIcon class="w-4 h-4 mr-2" />
            Previous
          </button>
          <div v-else></div>
          
          <button
            @click="nextStep"
            :disabled="!canProceed"
            class="btn-primary"
            :class="{ 'opacity-50 cursor-not-allowed': !canProceed }"
          >
            <span v-if="currentStep === totalSteps && !creating">
              Create Portfolio
              <CheckIcon class="w-4 h-4 ml-2" />
            </span>
            <span v-else-if="creating" class="flex items-center">
              <LoadingSpinner class="mr-2" />
              Creating...
            </span>
            <span v-else>
              Next
              <ChevronRightIcon class="w-4 h-4 ml-2" />
            </span>
          </button>
        </div>
      </div>
      
      <!-- Error Message -->
      <div v-if="error" class="mt-4 p-4 bg-red-50 rounded-lg">
        <p class="text-sm text-red-800">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { 
  FolderIcon, 
  ChartBarIcon, 
  BuildingOfficeIcon, 
  LightBulbIcon, 
  CurrencyDollarIcon, 
  BanknotesIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon
} from '@heroicons/vue/24/outline'

definePageMeta({
  middleware: 'auth'
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()

// Onboarding state
const currentStep = ref(1)
const totalSteps = 6
const creating = ref(false)
const error = ref('')

// Portfolio data
const portfolioData = ref({
  name: '',
  riskLevel: '',
  sectors: [] as string[],
  strategy: '',
  securities: [] as any[],
  liquidFunds: 0
})

// Risk levels configuration
const riskLevels = [
  {
    value: 'conservative',
    label: 'Conservative',
    emoji: '🛡️',
    description: 'Focus on capital preservation with minimal risk'
  },
  {
    value: 'moderate',
    label: 'Moderate',
    emoji: '⚖️',
    description: 'Balanced approach between growth and stability'
  },
  {
    value: 'aggressive',
    label: 'Aggressive',
    emoji: '🚀',
    description: 'Higher risk for potentially higher returns'
  }
]

// Sectors configuration
const sectors = [
  { value: 'technology', label: 'Technology', emoji: '💻' },
  { value: 'healthcare', label: 'Healthcare', emoji: '🏥' },
  { value: 'financial', label: 'Financial', emoji: '🏦' },
  { value: 'energy', label: 'Energy', emoji: '⚡' },
  { value: 'consumer', label: 'Consumer', emoji: '🛍️' },
  { value: 'industrial', label: 'Industrial', emoji: '🏭' },
  { value: 'materials', label: 'Materials', emoji: '🔨' },
  { value: 'utilities', label: 'Utilities', emoji: '💡' },
  { value: 'real-estate', label: 'Real Estate', emoji: '🏠' },
  { value: 'telecommunications', label: 'Telecom', emoji: '📡' },
  { value: 'aerospace', label: 'Aerospace', emoji: '✈️' },
  { value: 'automotive', label: 'Automotive', emoji: '🚗' }
]

// Methods
const toggleSector = (sector: string) => {
  const index = portfolioData.value.sectors.indexOf(sector)
  if (index > -1) {
    portfolioData.value.sectors.splice(index, 1)
  } else {
    portfolioData.value.sectors.push(sector)
  }
}

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 1:
      return portfolioData.value.name.trim().length > 0
    case 2:
      return portfolioData.value.riskLevel.length > 0
    case 3:
      return portfolioData.value.sectors.length > 0
    case 4:
      return portfolioData.value.strategy.trim().length > 0
    case 5:
      return portfolioData.value.securities.length > 0
    case 6:
      return portfolioData.value.liquidFunds >= 0
    default:
      return false
  }
})

const nextStep = async () => {
  if (!canProceed.value) return
  
  if (currentStep.value === totalSteps) {
    await createPortfolio()
  } else {
    currentStep.value++
  }
}

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const createPortfolio = async () => {
  creating.value = true
  error.value = ''
  
  try {
    // Get user's account_id
    const { data: accountMember } = await supabase
      .from('account_members')
      .select('account_id')
      .eq('user_id', user.value?.id)
      .single()

    // Create portfolio
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .insert({
        user_id: user.value?.id,
        account_id: accountMember?.account_id,
        name: portfolioData.value.name,
        description: portfolioData.value.strategy,
        risk_level: portfolioData.value.riskLevel,
        sectors: portfolioData.value.sectors,
        liquid_funds: portfolioData.value.liquidFunds,
        is_default: true // First portfolio is default
      })
      .select()
      .single()
    
    if (portfolioError) throw portfolioError
    
    // Add securities to portfolio
    if (portfolioData.value.securities.length > 0) {
      // Create buy transactions for each security
      const transactions = portfolioData.value.securities.map(security => ({
        portfolio_id: portfolio.id,
        security_id: security.id,
        action: 'buy' as const,
        amount: security.shares,
        price: security.averagePrice,
        date: security.purchaseDate || new Date().toISOString().split('T')[0],
        fee: 0 // No fees for initial setup
      }))
      
      const { error: transactionsError } = await supabase
        .from('portfolio_transactions')
        .insert(transactions)
      
      if (transactionsError) throw transactionsError
      
      // Create portfolio_securities entries for current holdings
      const portfolioSecurities = portfolioData.value.securities.map(security => ({
        portfolio_id: portfolio.id,
        security_id: security.id,
        amount: security.shares,
        worth: security.shares * security.averagePrice
      }))
      
      const { error: portfolioSecuritiesError } = await supabase
        .from('portfolio_securities')
        .insert(portfolioSecurities)
      
      if (portfolioSecuritiesError) throw portfolioSecuritiesError
    }
    
    // Create initial portfolio history entry
    const totalSecuritiesValue = portfolioData.value.securities.reduce(
      (sum, security) => sum + (security.shares * security.averagePrice), 0
    )
    const totalPortfolioValue = totalSecuritiesValue + portfolioData.value.liquidFunds
    
    const { error: historyError } = await supabase
      .from('portfolio_history')
      .insert({
        portfolio_id: portfolio.id,
        date: new Date().toISOString().split('T')[0],
        value: totalPortfolioValue
      })
    
    if (historyError) throw historyError
    
    // Mark user as having completed onboarding
    const { error: accountError } = await supabase
      .from('accounts')
      .update({ 
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString()
      })
      .eq('owner_id', user.value?.id)
    
    if (accountError) throw accountError
    
    // Redirect to dashboard
    await router.push('/dashboard?welcome=true')
    
  } catch (err: any) {
    console.error('Error creating portfolio:', err)
    error.value = err.message || 'Failed to create portfolio. Please try again.'
  } finally {
    creating.value = false
  }
}

// Check if user has already completed onboarding
onMounted(async () => {
  try {
    const { data: account } = await supabase
      .from('accounts')
      .select('onboarding_completed')
      .eq('owner_id', user.value?.id)
      .single()
    
    if (account?.onboarding_completed) {
      await router.push('/dashboard')
    }
  } catch (err) {
    console.error('Error checking onboarding status:', err)
  }
})
</script>

<style scoped>
.glass {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
</style>