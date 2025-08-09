<template>
  <div class="relative">
    <div class="relative py-16 px-6 sm:py-20 sm:px-8">
      <div class="text-center mb-12">
        <h2 class="text-4xl font-bold text-white sm:text-5xl">
          Choose your <span class="gradient-text">plan</span>
        </h2>
        <p class="mt-4 text-xl text-white/70">Start free, upgrade as you grow</p>
      </div>

      <div class="grid grid-cols-1 gap-8 lg:grid-cols-3 max-w-7xl mx-auto">
        <!-- Free Plan -->
        <div class="relative group">
          <div class="glass rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-8 h-full border-2 border-transparent">
            <div class="text-center">
              <h3 class="text-2xl font-bold text-white">Free</h3>
              <div class="mt-4 flex items-center justify-center">
                <span class="text-5xl font-bold text-white">$0</span>
                <span class="ml-2 text-white/60 text-lg">/month</span>
              </div>
              <p class="mt-2 text-sm text-white/70">Perfect to get started</p>
            </div>

            <ul class="mt-8 space-y-4">
              <li class="flex items-center">
                <CheckIcon class="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span class="text-white/80">1 Portfolio</span>
              </li>
              <li class="flex items-center">
                <CheckIcon class="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span class="text-white/80">Basic tracking</span>
              </li>
              <li class="flex items-center">
                <CheckIcon class="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span class="text-white/80">Monthly reports</span>
              </li>
              <li class="flex items-center">
                <CheckIcon class="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span class="text-white/80">Community support</span>
              </li>
            </ul>

            <button
              @click="selectPlan('free')"
              :disabled="loading && selectedPlan === 'free'"
              class="w-full mt-8 px-6 py-3 bg-background-800/50 text-white border border-white/20 rounded-xl font-semibold hover:bg-background-700 transition-colors duration-200 disabled:opacity-50"
            >
              <span v-if="loading && selectedPlan === 'free'" class="flex items-center justify-center">
                <LoadingSpinner class="mr-2" />
                Getting started...
              </span>
              <span v-else>Get started free</span>
            </button>

            <p class="mt-4 text-xs text-center text-white/50">No credit card required</p>
          </div>
        </div>

        <!-- Basic Plan -->
        <div class="relative group">
          <div class="absolute -inset-1 bg-gradient-to-r from-primary-600 to-accent-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
          <div class="relative glass rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-8 h-full border-2 border-primary-200">
            <!-- Most Popular Badge -->
            <div class="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span class="bg-gradient-to-r from-primary-600 to-accent-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
              </span>
            </div>

            <div class="text-center">
              <h3 class="text-2xl font-bold text-white">Basic</h3>
              <div class="mt-4 flex items-center justify-center">
                <span class="text-5xl font-bold text-white">{{ formatPrice('basic') }}</span>
                <span class="ml-2 text-white/60 text-lg">/month</span>
              </div>
              <p class="mt-2 text-sm text-white/70">For serious investors</p>
            </div>

            <ul class="mt-8 space-y-4">
              <li class="flex items-center">
                <CheckIcon class="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span class="text-white/80">5 Portfolios</span>
              </li>
              <li class="flex items-center">
                <CheckIcon class="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span class="text-white/80">Advanced analytics</span>
              </li>
              <li class="flex items-center">
                <CheckIcon class="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span class="text-white/80">AI recommendations</span>
              </li>
              <li class="flex items-center">
                <CheckIcon class="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span class="text-white/80">Weekly reports</span>
              </li>
              <li class="flex items-center">
                <CheckIcon class="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span class="text-white/80">Email support</span>
              </li>
            </ul>

            <button
              @click="selectPlan('basic')"
              :disabled="loading && selectedPlan === 'basic'"
              class="w-full mt-8 btn-primary"
            >
              <span v-if="loading && selectedPlan === 'basic'" class="flex items-center justify-center">
                <LoadingSpinner class="mr-2" />
                Processing...
              </span>
              <span v-else>Start Basic Plan</span>
            </button>

            <p class="mt-4 text-xs text-center text-white/50">14-day free trial</p>
          </div>
        </div>

        <!-- Premium Plan -->
        <div class="relative group">
          <div class="glass rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-8 h-full border-2 border-transparent">
            <div class="text-center">
              <h3 class="text-2xl font-bold text-white">Premium</h3>
              <div class="mt-4 flex items-center justify-center">
                <span class="text-5xl font-bold text-white">{{ formatPrice('premium') }}</span>
                <span class="ml-2 text-white/60 text-lg">/month</span>
              </div>
              <p class="mt-2 text-sm text-white/70">For professional traders</p>
            </div>

            <ul class="mt-8 space-y-4">
              <li class="flex items-center">
                <CheckIcon class="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span class="text-white/80">Unlimited portfolios</span>
              </li>
              <li class="flex items-center">
                <CheckIcon class="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span class="text-white/80">Real-time data</span>
              </li>
              <li class="flex items-center">
                <CheckIcon class="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span class="text-white/80">Advanced AI insights</span>
              </li>
              <li class="flex items-center">
                <CheckIcon class="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span class="text-white/80">Daily reports</span>
              </li>
              <li class="flex items-center">
                <CheckIcon class="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span class="text-white/80">Priority support</span>
              </li>
              <li class="flex items-center">
                <CheckIcon class="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span class="text-white/80">Custom alerts</span>
              </li>
            </ul>

            <button
              @click="selectPlan('premium')"
              :disabled="loading && selectedPlan === 'premium'"
              class="w-full mt-8 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50"
            >
              <span v-if="loading && selectedPlan === 'premium'" class="flex items-center justify-center">
                <LoadingSpinner class="mr-2" />
                Processing...
              </span>
              <span v-else>Start Premium Plan</span>
            </button>

            <p class="mt-4 text-xs text-center text-white/50">14-day free trial</p>
          </div>
        </div>
      </div>

      <!-- Trust indicators -->
      <div class="mt-16 text-center">
        <div class="flex items-center justify-center space-x-8 text-sm text-white/60">
          <div class="flex items-center">
            <ShieldCheckIcon class="h-5 w-5 mr-2 text-green-500" />
            <span>Secure payments</span>
          </div>
          <div class="flex items-center">
            <ArrowPathIcon class="h-5 w-5 mr-2 text-blue-500" />
            <span>Cancel anytime</span>
          </div>
          <div class="flex items-center">
            <ChatBubbleLeftRightIcon class="h-5 w-5 mr-2 text-purple-500" />
            <span>24/7 support</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CheckIcon, ShieldCheckIcon, ArrowPathIcon, ChatBubbleLeftRightIcon } from '@heroicons/vue/24/outline'

interface Props {
  showFreeTrial?: boolean
  redirectAfterSelection?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showFreeTrial: true,
  redirectAfterSelection: true
})

const emit = defineEmits<{
  planSelected: [plan: string]
}>()

const loading = ref(false)
const selectedPlan = ref<string | null>(null)
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()

// Currency detection and pricing
const getUserCurrency = () => {
  // Check if we're in browser context
  if (typeof navigator === 'undefined') return 'sek'
  
  const locale = navigator.language || 'en-US'
  if (locale.includes('sv') || locale.includes('SE')) return 'sek'
  if (locale.includes('de') || locale.includes('fr') || locale.includes('es') || locale.includes('it')) return 'eur'
  return 'sek' // Default to SEK since that's configured
}

const userCurrency = ref('sek') // Initialize with default

// Update currency on client-side mount
onMounted(() => {
  userCurrency.value = getUserCurrency()
})

const pricing = {
  basic: {
    sek: { amount: 99, symbol: 'kr' },
    usd: { amount: 9.99, symbol: '$' },
    eur: { amount: 8.99, symbol: '€' }
  },
  premium: {
    sek: { amount: 249, symbol: 'kr' },
    usd: { amount: 24.99, symbol: '$' },
    eur: { amount: 22.99, symbol: '€' }
  }
}

const formatPrice = (plan: 'basic' | 'premium') => {
  // Ensure we have a valid currency, fallback to 'sek' during SSR
  const currency = userCurrency.value || 'sek'
  const price = pricing[plan][currency as 'sek' | 'usd' | 'eur']
  
  if (!price) {
    // Fallback to SEK if price not found
    const fallbackPrice = pricing[plan]['sek']
    return `${fallbackPrice.amount} ${fallbackPrice.symbol}`
  }
  
  const { symbol, amount } = price
  
  if (currency === 'sek') {
    return `${amount} ${symbol}`
  } else {
    return `${symbol}${amount}`
  }
}

const selectPlan = async (planType: 'free' | 'basic' | 'premium') => {
  loading.value = true
  selectedPlan.value = planType
  
  try {
    if (planType === 'free') {
      // Handle free plan selection
      if (user.value) {
        // User is already authenticated, create account with free plan
        await createAccountWithFreePlan()
      } else {
        // Emit event to parent component to handle signup flow
        emit('planSelected', planType)
      }
    } else {
      // Handle paid plans - always redirect directly to Stripe checkout
      await redirectToAnonymousCheckout(planType)
    }
  } catch (error) {
    console.error('Error selecting plan:', error)
  } finally {
    loading.value = false
    selectedPlan.value = null
  }
}

const createAccountWithFreePlan = async () => {
  if (!user.value) return

  try {
    const { data, error } = await supabase
      .from('accounts')
      .insert({
        name: `${user.value.user_metadata?.full_name || user.value.email}'s Account`,
        slug: `user-${user.value.id}`,
        owner_id: user.value.id,
        billing_email: user.value.email,
        status: 'active'
      })
      .select()
      .single()

    if (error) throw error

    // Create account member record
    await supabase
      .from('account_members')
      .insert({
        account_id: data.id,
        user_id: user.value.id,
        role: 'owner',
        joined_at: new Date().toISOString()
      })

    if (props.redirectAfterSelection) {
      await router.push('/dashboard?welcome=true')
    }
  } catch (error) {
    console.error('Error creating free account:', error)
    throw error
  }
}

const redirectToCheckout = async (planType: 'basic' | 'premium') => {
  try {
    const { data } = await $fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      body: {
        plan: planType,
        currency: userCurrency.value,
        customerId: null // Will be determined server-side
      }
    })

    if (data?.sessionId) {
      const stripe = await import('@stripe/stripe-js').then(m => m.loadStripe(useRuntimeConfig().public.stripePublishableKey))
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId: data.sessionId })
      }
    }
  } catch (error) {
    console.error('Error creating checkout session:', error)
    throw error
  }
}

const redirectToAnonymousCheckout = async (planType: 'basic' | 'premium') => {
  try {
    const { data } = await $fetch('/api/stripe/create-anonymous-checkout-session', {
      method: 'POST',
      body: {
        plan: planType,
        currency: userCurrency.value
      }
    })

    if (data?.sessionId) {
      const stripe = await import('@stripe/stripe-js').then(m => m.loadStripe(useRuntimeConfig().public.stripePublishableKey))
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId: data.sessionId })
      }
    }
  } catch (error) {
    console.error('Error creating anonymous checkout session:', error)
    throw error
  }
}
</script>

<style scoped>
.gradient-text {
  @apply bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent;
}

.glass {
  @apply bg-white/70 backdrop-blur-sm;
}
</style>