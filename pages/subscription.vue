<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Subscription Management</h1>
      <p class="mt-2 text-gray-600">Manage your PennyPilot subscription</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <LoadingSpinner size="lg" />
      <span class="ml-3 text-lg text-gray-600">Loading subscription details...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="rounded-md bg-red-50 p-4">
      <div class="flex">
        <ExclamationTriangleIcon class="h-5 w-5 text-red-400" />
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Error</h3>
          <p class="mt-2 text-sm text-red-700">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- Current Subscription -->
    <div v-else class="space-y-8">
      <!-- Current Plan Card -->
      <div class="glass rounded-2xl p-6 sm:p-8">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-semibold text-gray-900">Current Plan</h2>
            <p class="text-3xl font-bold text-primary-600 mt-2">{{ currentPlan?.name || 'Free' }}</p>
            <p class="text-gray-600 mt-1">{{ currentPlan?.description }}</p>
          </div>
          <div class="text-right">
            <p class="text-2xl font-bold text-gray-900">
              ${{ currentPlan?.amount ? (currentPlan.amount / 100).toFixed(2) : '0' }}
            </p>
            <p class="text-sm text-gray-500">/month</p>
            <div v-if="subscription?.trial_end && new Date(subscription.trial_end) > new Date()" 
                 class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
              <ClockIcon class="h-3 w-3 mr-1" />
              Trial until {{ formatDate(subscription.trial_end) }}
            </div>
            <div v-else-if="subscription?.status" 
                 class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2"
                 :class="getStatusColor(subscription.status)">
              {{ getStatusText(subscription.status) }}
            </div>
          </div>
        </div>

        <!-- Current Plan Features -->
        <div class="mt-6">
          <h3 class="text-sm font-medium text-gray-900 mb-3">Current plan includes:</h3>
          <ul class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <li v-for="feature in currentPlan?.features" :key="feature" class="flex items-center">
              <CheckIcon class="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
              <span class="text-sm text-gray-700">{{ feature }}</span>
            </li>
          </ul>
        </div>

        <!-- Action Buttons -->
        <div class="mt-8 flex flex-wrap gap-4">
          <button
            v-if="subscription?.stripe_subscription_id"
            @click="openCustomerPortal"
            :disabled="portalLoading"
            class="btn-secondary"
          >
            <span v-if="portalLoading">Opening...</span>
            <span v-else>Manage Billing</span>
          </button>
          
          <button
            v-if="currentPlan?.name !== 'Premium'"
            @click="showUpgradeOptions = true"
            class="btn-primary"
          >
            Upgrade Plan
          </button>

          <button
            v-if="currentPlan?.name !== 'Free' && subscription?.cancel_at_period_end === false"
            @click="cancelSubscription"
            :disabled="cancelLoading"
            class="px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            <span v-if="cancelLoading">Cancelling...</span>
            <span v-else>Cancel Subscription</span>
          </button>
        </div>
      </div>

      <!-- Usage Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="glass rounded-xl p-6">
          <div class="flex items-center">
            <ChartBarIcon class="h-8 w-8 text-blue-500" />
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Portfolios</p>
              <p class="text-2xl font-bold text-gray-900">{{ portfolioCount }}</p>
              <p v-if="currentPlan?.limits?.portfolios > 0" class="text-xs text-gray-500">
                of {{ currentPlan.limits.portfolios }} used
              </p>
            </div>
          </div>
        </div>

        <div class="glass rounded-xl p-6">
          <div class="flex items-center">
            <LightBulbIcon class="h-8 w-8 text-yellow-500" />
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">AI Recommendations</p>
              <p class="text-2xl font-bold text-gray-900">{{ aiRecommendationsCount }}</p>
              <p v-if="currentPlan?.limits?.ai_recommendations > 0" class="text-xs text-gray-500">
                this month
              </p>
            </div>
          </div>
        </div>

        <div class="glass rounded-xl p-6">
          <div class="flex items-center">
            <DocumentTextIcon class="h-8 w-8 text-green-500" />
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Reports</p>
              <p class="text-2xl font-bold text-gray-900">{{ reportsCount }}</p>
              <p class="text-xs text-gray-500">this month</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Billing History -->
      <div v-if="invoices.length > 0" class="glass rounded-2xl p-6 sm:p-8">
        <h2 class="text-xl font-semibold text-gray-900 mb-6">Billing History</h2>
        <div class="overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="invoice in invoices" :key="invoice.id">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ formatDate(invoice.created) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${{ (invoice.amount_due / 100).toFixed(2) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        :class="invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                    {{ invoice.status }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <a v-if="invoice.hosted_invoice_url" 
                     :href="invoice.hosted_invoice_url" 
                     target="_blank"
                     class="text-primary-600 hover:text-primary-900">
                    View Invoice
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Upgrade Modal -->
    <div v-if="showUpgradeOptions" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-2xl bg-white">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-2xl font-bold text-gray-900">Upgrade Your Plan</h3>
          <button @click="showUpgradeOptions = false" class="text-gray-400 hover:text-gray-600">
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
</template>

<script setup lang="ts">
import { 
  CheckIcon, 
  ExclamationTriangleIcon, 
  ClockIcon, 
  ChartBarIcon, 
  LightBulbIcon, 
  DocumentTextIcon,
  XMarkIcon 
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
      .eq('status', 'active')
      .or('status.eq.trialing')
      .single()

    if (subData) {
      subscription.value = subData
      currentPlan.value = subData.subscription_plans
    } else {
      // User is on free plan
      const { data: freePlan } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('stripe_price_id', 'free')
        .single()
      
      currentPlan.value = freePlan
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
      .from('portfolio')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.value?.id)
    
    portfolioCount.value = portfolios || 0

    // TODO: Implement AI recommendations and reports counting
    // These would need to be tracked in your database
    aiRecommendationsCount.value = 0
    reportsCount.value = 0

  } catch (err) {
    console.error('Error loading usage stats:', err)
  }
}

const openCustomerPortal = async () => {
  try {
    portalLoading.value = true
    
    const { data } = await $fetch('/api/stripe/create-portal-session', {
      method: 'POST',
      body: {
        customerId: account.value?.stripe_customer_id
      }
    })

    if (data?.url) {
      window.open(data.url, '_blank')
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
    const priceId = planType === 'basic' ? 'price_basic_monthly' : 'price_premium_monthly'
    
    const { data } = await $fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      body: {
        priceId,
        customerId: account.value?.stripe_customer_id,
        accountId: account.value?.id
      }
    })

    if (data?.sessionId) {
      const stripe = await import('@stripe/stripe-js').then(m => 
        m.loadStripe(useRuntimeConfig().public.stripePublishableKey)
      )
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId: data.sessionId })
      }
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
    
    // This would need to be implemented in your Stripe API
    await $fetch('/api/stripe/cancel-subscription', {
      method: 'POST',
      body: {
        subscriptionId: subscription.value?.stripe_subscription_id
      }
    })

    await loadSubscriptionData()
    
  } catch (err: any) {
    error.value = 'Failed to cancel subscription'
    console.error('Cancel error:', err)
  } finally {
    cancelLoading.value = false
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800'
    case 'trialing':
      return 'bg-blue-100 text-blue-800'
    case 'past_due':
      return 'bg-yellow-100 text-yellow-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
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
      return status
  }
}
</script>

<style scoped>
.glass {
  @apply bg-white/70 backdrop-blur-sm border border-white/20;
}
</style>