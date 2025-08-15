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
        <div class="mb-8">
          <div class="flex items-center mb-4">
            <NuxtLink to="/subscription" class="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-colors mr-4">
              <ArrowLeftIcon class="h-6 w-6" />
            </NuxtLink>
            <h1 class="text-4xl font-bold text-white">
              Billing <span class="gradient-text">Management</span>
            </h1>
          </div>
          <p class="text-xl text-white/80">Manage your payment methods, invoices, and billing preferences</p>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center py-12">
          <div class="relative group">
            <div class="absolute -inset-1 bg-gradient-to-r from-primary-600/30 to-accent-600/30 rounded-2xl blur opacity-40"></div>
            <div class="relative glass-dark rounded-2xl p-8 border border-primary-500/30 text-center">
              <div class="animate-spin h-12 w-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full mx-auto mb-4"></div>
              <span class="text-lg text-white">Loading billing information...</span>
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
                <h3 class="text-lg font-medium text-red-300">Error Loading Billing Information</h3>
                <p class="text-red-400 mt-1">{{ error }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Billing Content -->
        <div v-else class="space-y-8">
          <!-- Current Subscription Summary -->
          <div class="relative group">
            <div class="absolute -inset-1 bg-gradient-to-r from-primary-600/30 to-accent-600/30 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
            <div class="relative glass-dark rounded-2xl p-8 border border-primary-500/30 hover:border-primary-400/50 transition-all duration-300">
              <div class="flex items-center justify-between mb-6">
                <div>
                  <h2 class="text-2xl font-bold text-white mb-2">Current Subscription</h2>
                  <div class="flex items-center space-x-4">
                    <span class="text-3xl font-bold gradient-text">{{ currentPlan?.name || 'Free' }}</span>
                    <span class="text-2xl font-bold text-white">
                      ${{ currentPlan?.amount ? (currentPlan.amount / 100).toFixed(2) : '0' }}/month
                    </span>
                  </div>
                </div>
                <div class="text-right">
                  <div v-if="subscription?.status" 
                       class="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium mb-2"
                       :class="getStatusColor(subscription.status)">
                    {{ getStatusText(subscription.status) }}
                  </div>
                  <div v-if="subscription?.current_period_end" class="text-sm text-white/60">
                    Next billing: {{ formatDate(subscription.current_period_end) }}
                  </div>
                  <div v-if="subscription?.cancel_at_period_end" class="text-sm text-red-300 mt-2">
                    Cancels on {{ formatDate(subscription.current_period_end) }}
                  </div>
                </div>
              </div>

              <div class="flex flex-wrap gap-4">
                <button
                  @click="openCustomerPortal"
                  :disabled="portalLoading"
                  class="btn-primary px-6 py-3"
                >
                  <CreditCardIcon class="w-5 h-5 mr-2" />
                  <span v-if="portalLoading">Opening...</span>
                  <span v-else>Manage in Stripe Portal</span>
                </button>
                
                <button
                  v-if="currentPlan?.name !== 'Premium'"
                  @click="showPlanChange = true"
                  class="btn-secondary px-6 py-3"
                >
                  <ArrowUpIcon class="w-5 h-5 mr-2" />
                  Change Plan
                </button>
              </div>
            </div>
          </div>

          <!-- Payment Method -->
          <div class="relative group">
            <div class="absolute -inset-1 bg-gradient-to-r from-green-600/30 to-emerald-600/30 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
            <div class="relative glass-dark rounded-2xl p-8 border border-green-500/30 hover:border-green-400/50 transition-all duration-300">
              <div class="flex items-center justify-between mb-6">
                <div class="flex items-center">
                  <div class="w-12 h-12 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center border border-green-500/30 mr-4">
                    <CreditCardIcon class="h-6 w-6 text-green-400" />
                  </div>
                  <div>
                    <h2 class="text-2xl font-bold text-white">Payment Method</h2>
                    <p class="text-white/70">Manage your payment information</p>
                  </div>
                </div>
              </div>

              <div v-if="paymentMethod" class="bg-background-800/30 rounded-xl p-6">
                <div class="flex items-center justify-between">
                  <div class="flex items-center">
                    <div class="w-10 h-8 bg-white rounded flex items-center justify-center mr-4">
                      <span class="text-xs font-bold text-gray-800">{{ paymentMethod.card.brand.toUpperCase() }}</span>
                    </div>
                    <div>
                      <div class="text-white font-medium">
                        •••• •••• •••• {{ paymentMethod.card.last4 }}
                      </div>
                      <div class="text-white/60 text-sm">
                        Expires {{ paymentMethod.card.exp_month }}/{{ paymentMethod.card.exp_year }}
                      </div>
                    </div>
                  </div>
                  <button
                    @click="openCustomerPortal"
                    class="text-primary-400 hover:text-primary-300 font-medium"
                  >
                    Update →
                  </button>
                </div>
              </div>
              
              <div v-else class="bg-background-800/30 rounded-xl p-6 text-center">
                <div class="text-white/70 mb-4">No payment method on file</div>
                <button
                  @click="openCustomerPortal"
                  class="btn-primary px-6 py-3"
                >
                  Add Payment Method
                </button>
              </div>
            </div>
          </div>

          <!-- Billing History -->
          <div class="relative group">
            <div class="absolute -inset-1 bg-gradient-to-r from-blue-600/30 to-cyan-600/30 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
            <div class="relative glass-dark rounded-2xl p-8 border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300">
              <div class="flex items-center justify-between mb-6">
                <div class="flex items-center">
                  <div class="w-12 h-12 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full flex items-center justify-center border border-blue-500/30 mr-4">
                    <DocumentTextIcon class="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h2 class="text-2xl font-bold text-white">Billing History</h2>
                    <p class="text-white/70">View and download your invoices</p>
                  </div>
                </div>
                <div class="text-sm text-white/60">
                  Last {{ invoices.length }} invoices
                </div>
              </div>

              <div v-if="invoices.length > 0" class="space-y-4">
                <div v-for="invoice in invoices" :key="invoice.id" 
                     class="bg-background-800/30 rounded-xl p-6 hover:bg-background-800/50 transition-colors">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                      <div class="flex-shrink-0">
                        <div class="w-10 h-10 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full flex items-center justify-center border border-blue-500/30">
                          <DocumentTextIcon class="h-5 w-5 text-blue-400" />
                        </div>
                      </div>
                      <div>
                        <div class="text-white font-medium">
                          Invoice #{{ invoice.stripe_invoice_id?.slice(-8) || invoice.id.slice(-8) }}
                        </div>
                        <div class="text-white/60 text-sm">
                          {{ formatDate(invoice.created) }}
                        </div>
                      </div>
                    </div>

                    <div class="flex items-center space-x-4">
                      <div class="text-right">
                        <div class="text-white font-bold">
                          ${{ (invoice.amount_due / 100).toFixed(2) }}
                        </div>
                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                              :class="getInvoiceStatusColor(invoice.status)">
                          {{ invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1) }}
                        </span>
                      </div>
                      
                      <div class="flex space-x-2">
                        <a v-if="invoice.hosted_invoice_url"
                           :href="invoice.hosted_invoice_url"
                           target="_blank"
                           class="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                           title="View Invoice">
                          <EyeIcon class="h-5 w-5" />
                        </a>
                        <a v-if="invoice.invoice_pdf"
                           :href="invoice.invoice_pdf"
                           target="_blank"
                           class="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                           title="Download PDF">
                          <ArrowDownTrayIcon class="h-5 w-5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div v-else class="bg-background-800/30 rounded-xl p-8 text-center">
                <DocumentTextIcon class="h-12 w-12 text-white/30 mx-auto mb-4" />
                <div class="text-white/70">No billing history available</div>
                <div class="text-white/50 text-sm mt-1">Invoices will appear here after your first payment</div>
              </div>
            </div>
          </div>

          <!-- Billing Preferences -->
          <div class="relative group">
            <div class="absolute -inset-1 bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
            <div class="relative glass-dark rounded-2xl p-8 border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300">
              <div class="flex items-center mb-6">
                <div class="w-12 h-12 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center border border-purple-500/30 mr-4">
                  <CogIcon class="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <h2 class="text-2xl font-bold text-white">Billing Preferences</h2>
                  <p class="text-white/70">Configure your billing settings</p>
                </div>
              </div>

              <div class="space-y-6">
                <div class="bg-background-800/30 rounded-xl p-6">
                  <div class="flex items-center justify-between">
                    <div>
                      <div class="text-white font-medium">Billing Email</div>
                      <div class="text-white/60 text-sm mt-1">{{ account?.billing_email || user?.email }}</div>
                    </div>
                    <button
                      @click="openCustomerPortal"
                      class="text-primary-400 hover:text-primary-300 font-medium"
                    >
                      Update →
                    </button>
                  </div>
                </div>

                <div class="bg-background-800/30 rounded-xl p-6">
                  <div class="flex items-center justify-between">
                    <div>
                      <div class="text-white font-medium">Tax Information</div>
                      <div class="text-white/60 text-sm mt-1">Manage your tax ID and billing address</div>
                    </div>
                    <button
                      @click="openCustomerPortal"
                      class="text-primary-400 hover:text-primary-300 font-medium"
                    >
                      Manage →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Plan Change Modal -->
        <div v-if="showPlanChange" class="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div class="relative w-full max-w-5xl">
            <div class="relative group">
              <div class="absolute -inset-1 bg-gradient-to-r from-primary-600/30 to-accent-600/30 rounded-3xl blur opacity-40"></div>
              <div class="relative glass-dark rounded-3xl p-8 border border-primary-500/30 max-h-[90vh] overflow-y-auto">
                <div class="flex items-center justify-between mb-8">
                  <div>
                    <h3 class="text-3xl font-bold text-white">Change Your <span class="gradient-text">Plan</span></h3>
                    <p class="text-white/70 mt-2">Upgrade or downgrade your subscription</p>
                  </div>
                  <button @click="showPlanChange = false" class="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
                    <XMarkIcon class="h-6 w-6" />
                  </button>
                </div>
                
                <PlanSelection 
                  @plan-selected="handlePlanChange" 
                  :redirect-after-selection="false"
                  :show-free-trial="false"
                  :current-plan="currentPlan?.name?.toLowerCase()"
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
  ExclamationTriangleIcon,
  CreditCardIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
  ArrowUpIcon,
  CogIcon,
  XMarkIcon,
  EyeIcon,
  ArrowDownTrayIcon
} from '@heroicons/vue/24/outline'

definePageMeta({
  middleware: 'auth',
  title: 'Billing Management'
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()

// Reactive state
const loading = ref(true)
const error = ref('')
const portalLoading = ref(false)
const showPlanChange = ref(false)

const currentPlan = ref<any>(null)
const subscription = ref<any>(null)
const account = ref<any>(null)
const invoices = ref<any[]>([])
const paymentMethod = ref<any>(null)

onMounted(async () => {
  await loadBillingData()
})

const loadBillingData = async () => {
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
      .in('status', ['active', 'trialing', 'past_due', 'cancelled'])
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
        description: 'Basic portfolio tracking'
      }
    }

    // Get billing history
    const { data: invoiceData } = await supabase
      .from('invoices')
      .select('*')
      .eq('account_id', accountData.id)
      .order('created', { ascending: false })
      .limit(20)
    
    invoices.value = invoiceData || []

    // Load payment method info (if available)
    // This would typically come from Stripe via API call
    // For now, we'll leave it as null and handle in the portal

  } catch (err: any) {
    error.value = err.message
    console.error('Error loading billing data:', err)
  } finally {
    loading.value = false
  }
}

const openCustomerPortal = async () => {
  try {
    portalLoading.value = true
    
    const response = await $fetch('/api/stripe/create-portal-session', {
      method: 'POST',
      body: {
        customerId: account.value?.stripe_customer_id,
        returnUrl: `${window.location.origin}/billing`
      }
    })

    if (response.success && response.url) {
      window.location.href = response.url
    }
  } catch (err: any) {
    error.value = 'Failed to open billing portal'
    console.error('Portal error:', err)
  } finally {
    portalLoading.value = false
  }
}

const handlePlanChange = async (planType: string) => {
  showPlanChange.value = false
  
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
    error.value = 'Failed to start plan change process'
    console.error('Plan change error:', err)
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