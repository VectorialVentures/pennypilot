<template>
  <div class="min-h-screen">
    <!-- Background matching landing page -->
    <div class="absolute inset-0 bg-gradient-to-br from-background-950 via-background-900 to-background-950">
      <div class="absolute inset-0 bg-gradient-to-tr from-primary-900/20 via-transparent to-accent-900/20 animate-gradient-shift"></div>
      <div class="absolute inset-0 bg-gradient-to-bl from-transparent via-primary-800/30 to-transparent animate-gradient-pulse"></div>
    </div>
    
    <!-- Floating Gradient Orbs -->
    <div class="absolute top-20 left-1/4 w-64 h-64 bg-gradient-to-r from-primary-500/20 to-accent-500/20 rounded-full blur-2xl animate-float-slow"></div>
    <div class="absolute bottom-20 right-1/4 w-96 h-96 bg-gradient-to-l from-accent-400/15 to-primary-400/15 rounded-full blur-3xl animate-float-reverse"></div>
    
    <div class="relative min-h-screen">
      <div class="max-w-4xl mx-auto px-4 py-8">
        <!-- Progress Bar -->
        <div class="mb-8">
          <div class="flex items-center justify-between text-sm text-white/70 mb-3">
            <span class="font-medium">Step {{ currentStep }} of {{ totalSteps }}</span>
            <span class="font-medium">{{ Math.round((currentStep / totalSteps) * 100) }}% Complete</span>
          </div>
          <div class="w-full bg-background-800/50 rounded-full h-3 backdrop-blur-sm border border-white/10">
            <div 
              class="bg-gradient-to-r from-primary-500 to-accent-500 h-3 rounded-full transition-all duration-500 shadow-lg shadow-primary-500/30"
              :style="{ width: `${(currentStep / totalSteps) * 100}%` }"
            ></div>
          </div>
        </div>

        <!-- Welcome Header -->
        <div class="text-center mb-8" v-if="currentStep === 1">
          <h1 class="text-4xl font-bold text-white mb-4">
            Welcome to <span class="gradient-text">PennyPilot!</span>
          </h1>
          <p class="text-xl text-white/80">Let's create your first investment portfolio to get started.</p>
        </div>

        <!-- Step Content -->
        <div class="relative group">
          <div class="absolute -inset-1 bg-gradient-to-r from-primary-600/30 to-accent-600/30 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
          <div class="relative glass-dark rounded-2xl shadow-2xl p-8 border border-primary-500/30 hover:border-primary-400/50 transition-all duration-300">
            
            <!-- Step 1: Portfolio Name -->
            <div v-if="currentStep === 1" class="space-y-8">
              <div class="text-center mb-8">
                <div class="w-20 h-20 bg-gradient-to-r from-primary-500/20 to-accent-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary-500/30">
                  <FolderIcon class="w-10 h-10 text-primary-400" />
                </div>
                <h2 class="text-3xl font-bold text-white mb-3">Name Your Portfolio</h2>
                <p class="text-white/70 text-lg">Choose a name that helps you identify this portfolio</p>
              </div>
              
              <div class="max-w-md mx-auto">
                <label for="portfolioName" class="block text-sm font-semibold text-white mb-3">
                  Portfolio Name
                </label>
                <input
                  id="portfolioName"
                  v-model="portfolioData.name"
                  type="text"
                  required
                  class="input-field w-full text-lg"
                  placeholder="e.g., My Growth Portfolio, Tech Stocks, Retirement Fund"
                  @keyup.enter="nextStep"
                />
              </div>
            </div>

            <!-- Step 2: Risk Level -->
            <div v-if="currentStep === 2" class="space-y-8">
              <div class="text-center mb-8">
                <div class="w-20 h-20 bg-gradient-to-r from-accent-500/20 to-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-accent-500/30">
                  <ChartBarIcon class="w-10 h-10 text-accent-400" />
                </div>
                <h2 class="text-3xl font-bold text-white mb-3">Risk Level</h2>
                <p class="text-white/70 text-lg">How much risk are you comfortable with for this portfolio?</p>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div 
                  v-for="risk in riskLevels" 
                  :key="risk.value"
                  @click="portfolioData.riskLevel = risk.value"
                  class="group cursor-pointer transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div 
                    class="relative border-2 rounded-2xl p-6 h-full transition-all duration-300"
                    :class="portfolioData.riskLevel === risk.value ? 
                      'border-primary-400 bg-primary-500/20 shadow-2xl shadow-primary-500/20' : 
                      'border-white/20 hover:border-white/40 bg-background-800/30 hover:bg-background-800/50'"
                  >
                    <div class="text-center">
                      <div class="text-4xl mb-4">{{ risk.emoji }}</div>
                      <h3 class="font-bold text-white text-xl mb-3">{{ risk.label }}</h3>
                      <p class="text-white/70 leading-relaxed">{{ risk.description }}</p>
                    </div>
                    <div v-if="portfolioData.riskLevel === risk.value" class="absolute -top-2 -right-2">
                      <div class="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                        <CheckIcon class="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Step 3: Sectors -->
            <div v-if="currentStep === 3" class="space-y-8">
              <div class="text-center mb-8">
                <div class="w-20 h-20 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
                  <BuildingOfficeIcon class="w-10 h-10 text-green-400" />
                </div>
                <h2 class="text-3xl font-bold text-white mb-3">Select Sectors</h2>
                <p class="text-white/70 text-lg">Choose one or more sectors you're interested in investing in</p>
              </div>
              
              <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div 
                  v-for="sector in sectors" 
                  :key="sector.value"
                  @click="toggleSector(sector.value)"
                  class="group cursor-pointer transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div 
                    class="relative border-2 rounded-xl p-4 h-full transition-all duration-300 text-center"
                    :class="portfolioData.sectors.includes(sector.value) ? 
                      'border-primary-400 bg-primary-500/20 shadow-lg shadow-primary-500/20' : 
                      'border-white/20 hover:border-white/40 bg-background-800/30 hover:bg-background-800/50'"
                  >
                    <div class="text-2xl mb-2">{{ sector.emoji }}</div>
                    <div class="text-sm font-semibold text-white">{{ sector.label }}</div>
                    <div v-if="portfolioData.sectors.includes(sector.value)" class="absolute -top-2 -right-2">
                      <div class="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                        <CheckIcon class="w-3 h-3 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="text-center">
                <div class="inline-flex items-center px-4 py-2 bg-accent-500/20 border border-accent-500/30 rounded-full">
                  <span class="text-accent-300 font-medium">
                    Selected: {{ portfolioData.sectors.length }} sector{{ portfolioData.sectors.length !== 1 ? 's' : '' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Step 4: Investment Strategy -->
            <div v-if="currentStep === 4" class="space-y-8">
              <div class="text-center mb-8">
                <div class="w-20 h-20 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-purple-500/30">
                  <LightBulbIcon class="w-10 h-10 text-purple-400" />
                </div>
                <h2 class="text-3xl font-bold text-white mb-3">Investment Philosophy</h2>
                <p class="text-white/70 text-lg">Describe your investment strategy or philosophy</p>
              </div>
              
              <div class="max-w-2xl mx-auto">
                <label for="strategy" class="block text-sm font-semibold text-white mb-3">
                  Investment Strategy
                </label>
                <textarea
                  id="strategy"
                  v-model="portfolioData.strategy"
                  rows="6"
                  class="input-field w-full resize-none"
                  placeholder="e.g., Focus on long-term growth companies with strong fundamentals, dividend-paying stocks for steady income, or value investing in undervalued companies..."
                ></textarea>
                <p class="text-sm text-white/60 mt-3">
                  This helps our AI understand your preferences when making recommendations
                </p>
              </div>
            </div>

            <!-- Step 5: Add Securities -->
            <div v-if="currentStep === 5" class="space-y-6">
              <div class="text-center mb-6">
                <div class="w-20 h-20 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/30">
                  <CurrencyDollarIcon class="w-10 h-10 text-blue-400" />
                </div>
                <h2 class="text-3xl font-bold text-white mb-3">Add Securities</h2>
                <p class="text-white/70 text-lg">Add stocks, ETFs, or other securities to your portfolio</p>
              </div>
              
              <SecuritiesManager 
                v-model="portfolioData.securities" 
                :is-initial-setup="true"
              />
            </div>

            <!-- Step 6: Liquid Funds -->
            <div v-if="currentStep === 6" class="space-y-8">
              <div class="text-center mb-8">
                <div class="w-20 h-20 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
                  <BanknotesIcon class="w-10 h-10 text-emerald-400" />
                </div>
                <h2 class="text-3xl font-bold text-white mb-3">Liquid Funds</h2>
                <p class="text-white/70 text-lg">How much cash do you have available in this portfolio?</p>
              </div>
              
              <div class="max-w-md mx-auto">
                <label for="liquidFunds" class="block text-sm font-semibold text-white mb-3">
                  Available Cash
                </label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span class="text-white/60 text-lg font-medium">$</span>
                  </div>
                  <input
                    id="liquidFunds"
                    v-model="portfolioData.liquidFunds"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    class="input-field w-full pl-10 text-lg"
                    placeholder="0.00"
                    @keyup.enter="nextStep"
                  />
                </div>
                <p class="text-sm text-white/60 mt-3">
                  This represents cash that's available for future investments
                </p>
              </div>
            </div>

            <!-- Navigation Buttons -->
            <div class="flex justify-between items-center mt-12 pt-8 border-t border-white/20">
              <button
                v-if="currentStep > 1"
                @click="previousStep"
                class="btn-secondary flex items-center px-6 py-3"
              >
                <ChevronLeftIcon class="w-5 h-5 mr-2" />
                Previous
              </button>
              <div v-else></div>
              
              <button
                @click="nextStep"
                :disabled="!canProceed"
                class="btn-primary flex items-center px-8 py-3 text-base font-semibold"
                :class="{ 'opacity-50 cursor-not-allowed': !canProceed }"
              >
                <span v-if="currentStep === totalSteps && !creating" class="flex items-center">
                  Create Portfolio
                  <CheckIcon class="w-5 h-5 ml-2" />
                </span>
                <span v-else-if="creating" class="flex items-center">
                  <LoadingSpinner class="mr-2" />
                  Creating...
                </span>
                <span v-else class="flex items-center">
                  Next
                  <ChevronRightIcon class="w-5 h-5 ml-2" />
                </span>
              </button>
            </div>
          </div>
        </div>
        
        <!-- Error Message -->
        <div v-if="error" class="mt-6 relative group">
          <div class="absolute -inset-1 bg-gradient-to-r from-red-600/30 to-orange-600/30 rounded-2xl blur opacity-40"></div>
          <div class="relative bg-red-500/20 border border-red-500/30 rounded-2xl p-6">
            <p class="text-red-400 text-center font-medium">{{ error }}</p>
          </div>
        </div>
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
    // Get user's account_id directly from accounts table
    const { data: account } = await supabase
      .from('accounts')
      .select('id')
      .eq('owner_id', user.value?.id)
      .single()

    // Create portfolio
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .insert({
        user_id: user.value?.id,
        account_id: account?.id,
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