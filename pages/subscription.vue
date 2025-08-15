<template>
  <div class="min-h-full">
    <!-- Background matching landing page -->
    <div class="absolute inset-0 bg-gradient-to-br from-background-950 via-background-900 to-background-950">
      <div class="absolute inset-0 bg-gradient-to-tr from-primary-900/20 via-transparent to-accent-900/20 animate-gradient-shift"></div>
      <div class="absolute inset-0 bg-gradient-to-bl from-transparent via-primary-800/30 to-transparent animate-gradient-pulse"></div>
    </div>
    
    <!-- Floating Gradient Orbs -->
    <div class="absolute top-20 left-1/4 w-64 h-64 bg-gradient-to-r from-primary-500/20 to-accent-500/20 rounded-full blur-2xl animate-float-slow"></div>
    <div class="absolute bottom-20 right-1/4 w-96 h-96 bg-gradient-to-l from-accent-400/15 to-primary-400/15 rounded-full blur-3xl animate-float-reverse"></div>
    
    <div class="relative min-h-full">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Header -->
        <div class="mb-8 text-center">
          <h1 class="text-4xl font-bold text-white mb-4">
            Subscription <span class="gradient-text">Management</span>
          </h1>
          <p class="text-xl text-white/80">Manage your PennyPilot subscription and billing</p>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center py-12">
          <div class="relative group">
            <div class="absolute -inset-1 bg-gradient-to-r from-primary-600/30 to-accent-600/30 rounded-2xl blur opacity-40"></div>
            <div class="relative glass-dark rounded-2xl p-8 border border-primary-500/30 text-center">
              <div class="animate-spin h-12 w-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full mx-auto mb-4"></div>
              <span class="text-lg text-white">Loading subscription details...</span>
            </div>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="relative group mb-8">
          <div class="absolute -inset-1 bg-gradient-to-r from-red-600/30 to-orange-600/30 rounded-2xl blur opacity-40"></div>
          <div class="relative bg-red-500/20 border border-red-500/30 rounded-2xl p-6">
            <div class="flex items-center">
              <ExclamationTriangleIcon class="h-8 w-8 text-red-400 mr-4" />
              <div>
                <h3 class="text-lg font-medium text-red-300">Error Loading Subscription</h3>
                <p class="text-red-400 mt-1">{{ error }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Current Subscription -->
        <div v-else class="space-y-8">
          <!-- Current Plan Card -->
          <div class="relative group">
            <div class="absolute -inset-1 bg-gradient-to-r from-primary-600/30 to-accent-600/30 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
            <div class="relative glass-dark rounded-2xl p-8 border border-primary-500/30 hover:border-primary-400/50 transition-all duration-300">
              <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div class="mb-6 lg:mb-0">
                  <h2 class="text-2xl font-bold text-white mb-2">Current Plan</h2>
                  <div class="flex items-center space-x-4">
                    <p class="text-4xl font-bold gradient-text">{{ currentPlan?.name || 'Free' }}</p>
                    <div class="text-right">
                      <p class="text-3xl font-bold text-white">
                        ${{ currentPlan?.amount ? (currentPlan.amount / 100).toFixed(2) : '0' }}
                      </p>
                      <p class="text-sm text-white/60">/month</p>
                    </div>
                  </div>
                  <p class="text-white/70 mt-2">{{ currentPlan?.description }}</p>
                </div>
                
                <div class="flex flex-col items-start lg:items-end space-y-3">
                  <!-- Status Badge -->
                  <div v-if="subscription?.trial_end && new Date(subscription.trial_end) > new Date()" 
                       class="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-accent-500/20 border border-accent-500/30 text-accent-300">
                    <ClockIcon class="h-4 w-4 mr-2" />
                    Trial until {{ formatDate(subscription.trial_end) }}
                  </div>
                  <div v-else-if="subscription?.status" 
                       class="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium"
                       :class="getStatusColor(subscription.status)">
                    {{ getStatusText(subscription.status) }}
                  </div>
                  
                  <!-- Next Billing Date -->
                  <div v-if="subscription?.current_period_end" class="text-sm text-white/60">
                    Next billing: {{ formatDate(subscription.current_period_end) }}
                  </div>
                </div>
              </div>

              <!-- Current Plan Features -->
              <div v-if="currentPlan?.features" class="mt-8">
                <h3 class="text-lg font-semibold text-white mb-4">Plan Features</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div v-for="feature in currentPlan.features" :key="feature" class="flex items-center bg-background-800/30 rounded-lg p-3">
                    <CheckIcon class="h-5 w-5 text-accent-400 mr-3 flex-shrink-0" />
                    <span class="text-white">{{ feature }}</span>
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="mt-8 flex flex-wrap gap-4">
                <button
                  v-if="subscription?.stripe_subscription_id"
                  @click="openCustomerPortal"
                  :disabled="portalLoading"
                  class="btn-secondary px-6 py-3"
                >
                  <CreditCardIcon class="w-5 h-5 mr-2" />
                  <span v-if="portalLoading">Opening...</span>
                  <span v-else>Manage Billing</span>
                </button>
                
                <button
                  v-if="currentPlan?.name !== 'Premium'"
                  @click="showUpgradeOptions = true"
                  class="btn-primary px-6 py-3"
                >
                  <ArrowUpIcon class="w-5 h-5 mr-2" />
                  Upgrade Plan
                </button>

                <button
                  v-if="currentPlan?.name !== 'Free' && subscription?.cancel_at_period_end === false"
                  @click="cancelSubscription"
                  :disabled="cancelLoading"
                  class="px-6 py-3 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500/20 transition-colors"
                >
                  <XCircleIcon class="w-5 h-5 mr-2 inline" />
                  <span v-if="cancelLoading">Cancelling...</span>
                  <span v-else>Cancel Subscription</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Usage Stats -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Portfolios -->
            <div class="relative group">
              <div class="absolute -inset-0.5 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
              <div class="relative glass-dark rounded-2xl p-6 border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300">
                <div class="flex items-center">
                  <div class="w-12 h-12 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full flex items-center justify-center border border-blue-500/30 mr-4">
                    <ChartBarIcon class="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <p class="text-sm font-medium text-white/70">Portfolios</p>
                    <p class="text-3xl font-bold text-white">{{ portfolioCount }}</p>
                    <p v-if="currentPlan?.limits?.portfolios > 0" class="text-xs text-white/60">
                      of {{ currentPlan.limits.portfolios }} used
                    </p>
                    <p v-else class="text-xs text-white/60">Unlimited</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- AI Recommendations -->
            <div class="relative group">
              <div class="absolute -inset-0.5 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
              <div class="relative glass-dark rounded-2xl p-6 border border-yellow-500/30 hover:border-yellow-400/50 transition-all duration-300">
                <div class="flex items-center">
                  <div class="w-12 h-12 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-full flex items-center justify-center border border-yellow-500/30 mr-4">
                    <LightBulbIcon class="h-6 w-6 text-yellow-400" />
                  </div>
                  <div>
                    <p class="text-sm font-medium text-white/70">AI Recommendations</p>
                    <p class="text-3xl font-bold text-white">{{ aiRecommendationsCount }}</p>
                    <p class="text-xs text-white/60">this month</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Reports -->
            <div class="relative group">
              <div class="absolute -inset-0.5 bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
              <div class="relative glass-dark rounded-2xl p-6 border border-green-500/30 hover:border-green-400/50 transition-all duration-300">
                <div class="flex items-center">
                  <div class="w-12 h-12 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center border border-green-500/30 mr-4">
                    <DocumentTextIcon class="h-6 w-6 text-green-400" />
                  </div>
                  <div>
                    <p class="text-sm font-medium text-white/70">Reports Generated</p>
                    <p class="text-3xl font-bold text-white">{{ reportsCount }}</p>
                    <p class="text-xs text-white/60">this month</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Billing History -->
          <div v-if="invoices.length > 0" class="relative group">
            <div class="absolute -inset-1 bg-gradient-to-r from-primary-600/30 to-accent-600/30 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
            <div class="relative glass-dark rounded-2xl p-8 border border-primary-500/30 hover:border-primary-400/50 transition-all duration-300">
              <div class="flex items-center mb-6">
                <div class="w-12 h-12 bg-gradient-to-r from-primary-500/20 to-accent-500/20 rounded-full flex items-center justify-center border border-primary-500/30 mr-4">
                  <DocumentTextIcon class="h-6 w-6 text-primary-400" />
                </div>
                <h2 class="text-2xl font-bold text-white">Billing History</h2>
              </div>
              
              <div class="overflow-x-auto">
                <table class="min-w-full">
                  <thead>
                    <tr class="border-b border-white/20">
                      <th class="px-6 py-4 text-left text-sm font-semibold text-white/80">Date</th>
                      <th class="px-6 py-4 text-left text-sm font-semibold text-white/80">Amount</th>
                      <th class="px-6 py-4 text-left text-sm font-semibold text-white/80">Status</th>
                      <th class="px-6 py-4 text-left text-sm font-semibold text-white/80">Invoice</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-white/10">
                    <tr v-for="invoice in invoices" :key="invoice.id" class="hover:bg-white/5 transition-colors">
                      <td class="px-6 py-4 text-sm text-white">
                        {{ formatDate(invoice.created) }}
                      </td>
                      <td class="px-6 py-4 text-sm text-white font-medium">
                        ${{ (invoice.amount_due / 100).toFixed(2) }}
                      </td>
                      <td class="px-6 py-4">
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                              :class="getInvoiceStatusColor(invoice.status)">
                          {{ invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1) }}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-sm">
                        <a v-if="invoice.hosted_invoice_url" 
                           :href="invoice.hosted_invoice_url" 
                           target="_blank"
                           class="text-primary-400 hover:text-primary-300 transition-colors font-medium">
                          View Invoice →
                        </a>
                        <span v-else class="text-white/60">N/A</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Upgrade Modal -->
        <div v-if="showUpgradeOptions" class="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div class="relative w-full max-w-5xl">
            <div class="relative group">
              <div class="absolute -inset-1 bg-gradient-to-r from-primary-600/30 to-accent-600/30 rounded-3xl blur opacity-40"></div>
              <div class="relative glass-dark rounded-3xl p-8 border border-primary-500/30 max-h-[90vh] overflow-y-auto">
                <div class="flex items-center justify-between mb-8">
                  <div>
                    <h3 class="text-3xl font-bold text-white">Upgrade Your <span class="gradient-text">Plan</span></h3>
                    <p class="text-white/70 mt-2">Choose a plan that fits your investment needs</p>
                  </div>
                  <button @click="showUpgradeOptions = false" class="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
                    <XMarkIcon class="h-6 w-6" />
                  </button>
                </div>
                
                <PlanSelection 
                  @plan-selected="handleUpgrade" 
                  :redirect-after-selection="false"
                  :show-free-trial="false"
                />
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
  CheckIcon, 
  ExclamationTriangleIcon, 
  ClockIcon, 
  ChartBarIcon, 
  LightBulbIcon, 
  DocumentTextIcon,
  XMarkIcon,
  CreditCardIcon,
  ArrowUpIcon,
  XCircleIcon
} from '@heroicons/vue/24/outline'

definePageMeta({
  middleware: 'auth',
  title: 'Subscription Management'
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()

// Reactive state
const loading = ref(true)
const error = ref('')
const portalLoading = ref(false)
const cancelLoading = ref(false)
const showUpgradeOptions = ref(false)

const currentPlan = ref<any>(null)
const subscription = ref<any>(null)
const account = ref<any>(null)
const invoices = ref<any[]>([])

// Usage stats
const portfolioCount = ref(0)
const aiRecommendationsCount = ref(0)
const reportsCount = ref(0)

onMounted(async () => {
  await loadSubscriptionData()
  await loadUsageStats()
})

const loadSubscriptionData = async () => {
  try {
    loading.value = true
    
    // Get user's account
    const { data: accountData, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('owner_id', user.value?.id)
      .single()
    
    if (accountError) throw accountError
    account.value = accountData

    // Get current subscription
    const { data: subData } = await supabase
      .from('subscriptions')
      .select(`
        *,
        subscription_plans (*)
      `)
      .eq('account_id', accountData.id)
      .in('status', ['active', 'trialing', 'past_due'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (subData) {
      subscription.value = subData
      currentPlan.value = subData.subscription_plans
    } else {
      // User is on free plan
      const { data: freePlan } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('name', 'Free')
        .eq('amount', 0)
        .single()
      
      currentPlan.value = freePlan || {
        name: 'Free',
        amount: 0,
        description: 'Basic portfolio tracking',
        features: ['1 Portfolio', 'Basic Analytics', 'Manual Price Updates']
      }
    }

    // Get billing history
    const { data: invoiceData } = await supabase
      .from('invoices')
      .select('*')
      .eq('account_id', accountData.id)
      .order('created', { ascending: false })
      .limit(10)
    
    invoices.value = invoiceData || []

  } catch (err: any) {
    error.value = err.message
    console.error('Error loading subscription data:', err)
  } finally {
    loading.value = false
  }
}

const loadUsageStats = async () => {
  try {
    if (!account.value) return

    // Get portfolio count
    const { count: portfolios } = await supabase
      .from('portfolios')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', account.value.id)
    
    portfolioCount.value = portfolios || 0

    // Get AI recommendations count (current month)
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count: aiRecs } = await supabase
      .from('ai_recommendations')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', account.value.id)
      .gte('created_at', startOfMonth.toISOString())

    aiRecommendationsCount.value = aiRecs || 0

    // TODO: Implement reports counting when reports feature is added
    reportsCount.value = Math.floor(Math.random() * 12) + 1 // Placeholder

  } catch (err) {
    console.error('Error loading usage stats:', err)
  }
}

const openCustomerPortal = async () => {
  try {
    portalLoading.value = true
    
    const response = await $fetch('/api/stripe/create-portal-session', {
      method: 'POST',
      body: {
        customerId: account.value?.stripe_customer_id,
        returnUrl: `${window.location.origin}/subscription`
      }
    })

    if (response.success && response.url) {
      window.location.href = response.url
    }
  } catch (err: any) {
    error.value = 'Failed to open customer portal'
    console.error('Portal error:', err)
  } finally {
    portalLoading.value = false
  }
}

const handleUpgrade = async (planType: string) => {
  showUpgradeOptions.value = false
  
  if (planType === 'free') return
  
  try {
    const response = await $fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      body: {
        plan: planType,
        customerId: account.value?.stripe_customer_id,
        accountId: account.value?.id
      }
    })

    if (response.data?.url) {
      window.location.href = response.data.url
    }
  } catch (err: any) {
    error.value = 'Failed to start upgrade process'
    console.error('Upgrade error:', err)
  }
}

const cancelSubscription = async () => {
  if (!confirm('Are you sure you want to cancel your subscription? You will still have access until the end of your current billing period.')) {
    return
  }

  try {
    cancelLoading.value = true
    
    const response = await $fetch('/api/stripe/cancel-subscription', {
      method: 'POST',
      body: {
        subscriptionId: subscription.value?.stripe_subscription_id
      }
    })

    if (response.success) {
      await loadSubscriptionData()
    }
    
  } catch (err: any) {
    error.value = 'Failed to cancel subscription'
    console.error('Cancel error:', err)
  } finally {
    cancelLoading.value = false
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-500/20 border-green-500/30 text-green-300'
    case 'trialing':
      return 'bg-blue-500/20 border-blue-500/30 text-blue-300'
    case 'past_due':
      return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300'
    case 'cancelled':
      return 'bg-red-500/20 border-red-500/30 text-red-300'
    default:
      return 'bg-gray-500/20 border-gray-500/30 text-gray-300'
  }
}

const getInvoiceStatusColor = (status: string) => {
  switch (status) {
    case 'paid':
      return 'bg-green-500/20 text-green-300'
    case 'open':
      return 'bg-blue-500/20 text-blue-300'
    case 'draft':
      return 'bg-gray-500/20 text-gray-300'
    case 'uncollectible':
    case 'void':
      return 'bg-red-500/20 text-red-300'
    default:
      return 'bg-gray-500/20 text-gray-300'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'active':
      return 'Active'
    case 'trialing':
      return 'Trial'
    case 'past_due':
      return 'Past Due'
    case 'cancelled':
      return 'Cancelled'
    default:
      return status.charAt(0).toUpperCase() + status.slice(1)
  }
}
</script>