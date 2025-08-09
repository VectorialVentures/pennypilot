<template>
  <div class="min-h-screen gradient-bg">
    <!-- Plan Selection Step -->
    <div v-if="currentStep === 'plan'" class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl w-full">
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold gradient-text">Welcome to PennyPilot</h1>
          <p class="mt-4 text-lg text-secondary-600">Choose your plan to get started</p>
        </div>
        <PlanSelection @plan-selected="handlePlanSelection" :redirect-after-selection="false" />
      </div>
    </div>

    <!-- Account Creation Step -->
    <div v-else class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full">
        <div class="glass rounded-2xl shadow-strong p-8">
        <div class="text-center">
          <button 
            @click="currentStep = 'plan'" 
            class="text-sm text-primary-600 hover:text-primary-500 mb-4 flex items-center"
          >
            <ArrowLeftIcon class="h-4 w-4 mr-1" />
            Back to plans
          </button>
          <h2 class="text-3xl font-bold gradient-text">Create your account</h2>
          <p class="mt-2 text-sm text-secondary-600">
            <span v-if="selectedPlan">
              Selected: <span class="font-semibold capitalize">{{ selectedPlan }}</span> plan
            </span>
            <span v-else>Join PennyPilot and start your investment journey</span>
          </p>
        </div>

        <form @submit.prevent="handleSignup" class="mt-8 space-y-6">
          <div>
            <label for="fullName" class="block text-sm font-medium text-secondary-700">Full Name</label>
            <input
              id="fullName"
              v-model="fullName"
              type="text"
              required
              class="input-field mt-1"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label for="email" class="block text-sm font-medium text-secondary-700">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              class="input-field mt-1"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-secondary-700">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              minlength="8"
              class="input-field mt-1"
              placeholder="Enter your password (min. 8 characters)"
            />
          </div>

          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-secondary-700">Confirm Password</label>
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              type="password"
              required
              class="input-field mt-1"
              placeholder="Confirm your password"
            />
          </div>

          <div class="flex items-center">
            <input
              id="agree-terms"
              v-model="agreeToTerms"
              type="checkbox"
              required
              class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
            />
            <label for="agree-terms" class="ml-2 block text-sm text-secondary-700">
              I agree to the
              <a href="/terms" class="text-primary-600 hover:text-primary-500">Terms of Service</a>
              and
              <a href="/privacy" class="text-primary-600 hover:text-primary-500">Privacy Policy</a>
            </label>
          </div>

          <div v-if="error" class="rounded-md bg-danger-50 p-4">
            <p class="text-sm text-danger-800">{{ error }}</p>
          </div>

          <button
            type="submit"
            :disabled="loading || !isFormValid"
            class="btn-primary w-full"
          >
            <span v-if="loading" class="flex items-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating account...
            </span>
            <span v-else>Create account</span>
          </button>

          <div class="mt-6">
            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-secondary-300" />
              </div>
              <div class="relative flex justify-center text-sm">
                <span class="px-2 bg-white text-secondary-500">Or continue with</span>
              </div>
            </div>

            <div class="mt-6">
              <button
                type="button"
                @click="handleGoogleSignup"
                :disabled="loading"
                class="btn-secondary w-full flex items-center justify-center"
              >
                <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            </div>
          </div>
        </form>

        <div class="mt-6 text-center">
          <p class="text-sm text-secondary-600">
            Already have an account?
            <NuxtLink to="/auth/login" class="font-medium text-primary-600 hover:text-primary-500">
              Sign in
            </NuxtLink>
          </p>
        </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'

definePageMeta({
  layout: false,
  auth: false
})

const supabase = useSupabaseClient()
const router = useRouter()

// Multi-step signup state
const currentStep = ref<'plan' | 'account'>('plan')
const selectedPlan = ref<string>('')

// Form fields
const fullName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const agreeToTerms = ref(false)
const loading = ref(false)
const error = ref('')

// Check for pre-selected plan from localStorage or URL
onMounted(() => {
  const savedPlan = localStorage.getItem('selectedPlan')
  const urlPlan = new URLSearchParams(window.location.search).get('plan')
  
  if (urlPlan && ['free', 'basic', 'premium'].includes(urlPlan)) {
    selectedPlan.value = urlPlan
    currentStep.value = 'account'
    localStorage.removeItem('selectedPlan')
  } else if (savedPlan && ['free', 'basic', 'premium'].includes(savedPlan)) {
    selectedPlan.value = savedPlan
    currentStep.value = 'account'
    localStorage.removeItem('selectedPlan')
  }
})

const handlePlanSelection = (plan: string) => {
  selectedPlan.value = plan
  currentStep.value = 'account'
}

const isFormValid = computed(() => {
  return fullName.value.length > 0 &&
         email.value.length > 0 &&
         password.value.length >= 8 &&
         password.value === confirmPassword.value &&
         agreeToTerms.value
})

const handleSignup = async () => {
  loading.value = true
  error.value = ''

  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    loading.value = false
    return
  }

  try {
    // Step 1: Create user account
    const { data, error: signupError } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
      options: {
        data: {
          full_name: fullName.value,
          selected_plan: selectedPlan.value
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (signupError) {
      error.value = signupError.message
      return
    }

    if (data.user && data.session) {
      // Auto sign-in successful
      await handlePostSignup(data.user, data.session)
    } else if (data.user && !data.session) {
      // Email confirmation required - redirect to check email page
      await router.push({
        path: '/auth/check-email',
        query: { email: email.value }
      })
      return
    }
  } catch (err) {
    error.value = 'An unexpected error occurred'
    console.error('Signup error:', err)
  } finally {
    loading.value = false
  }
}

const handlePostSignup = async (user: any, session: any) => {
  try {
    if (selectedPlan.value === 'free') {
      // Create free account directly
      await createAccountWithPlan('free', user)
      await router.push('/onboarding')
    } else {
      // Redirect to checkout for paid plans
      await redirectToCheckout(selectedPlan.value as 'basic' | 'premium', user)
    }
  } catch (error) {
    console.error('Post-signup error:', error)
    error.value = 'Account created but there was an issue setting up your plan. Please contact support.'
  }
}

const createAccountWithPlan = async (plan: string, user: any) => {
  const { data, error } = await supabase
    .from('accounts')
    .insert({
      name: `${user.user_metadata?.full_name || user.email}'s Account`,
      slug: `user-${user.id}`,
      owner_id: user.id,
      billing_email: user.email,
      status: plan === 'free' ? 'active' : 'trialing'
    })
    .select()
    .single()

  if (error) throw error

  // Create account member record
  await supabase
    .from('account_members')
    .insert({
      account_id: data.id,
      user_id: user.id,
      role: 'owner',
      joined_at: new Date().toISOString()
    })

  // Create initial subscription record
  if (plan === 'free') {
    await supabase
      .from('subscriptions')
      .insert({
        account_id: data.id,
        status: 'active',
        stripe_customer_id: '', // Will be populated if they upgrade
        stripe_subscription_id: `free_${data.id}`, // Unique identifier for free plan
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
  } else {
    // Create pending subscription record for paid plans - will be updated by webhook
    const trialEndDate = new Date()
    trialEndDate.setDate(trialEndDate.getDate() + 14) // 14-day trial
    
    await supabase
      .from('subscriptions')
      .insert({
        account_id: data.id,
        status: 'trialing',
        stripe_customer_id: '', // Will be populated by webhook
        stripe_subscription_id: `pending_${data.id}`, // Temporary ID until Stripe creates it
        trial_start: new Date().toISOString(),
        trial_end: trialEndDate.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
  }

  return data
}

const redirectToCheckout = async (planType: 'basic' | 'premium', user: any) => {
  try {
    // Create account first
    const account = await createAccountWithPlan(planType, user)
    
    // Detect user's currency based on locale or allow them to choose
    const userCurrency = getUserCurrency()

    const { data } = await $fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      body: {
        plan: planType,
        currency: userCurrency,
        accountId: account.id
      }
    })

    if (data?.sessionId) {
      // Redirect to Stripe Checkout
      const stripe = await import('@stripe/stripe-js').then(m => 
        m.loadStripe(useRuntimeConfig().public.stripePublishableKey)
      )
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId: data.sessionId })
      }
    }
  } catch (error) {
    console.error('Checkout redirect error:', error)
    throw error
  }
}

const getUserCurrency = () => {
  // Detect user's currency based on locale
  const locale = navigator.language || 'en-US'
  
  if (locale.includes('sv') || locale.includes('SE')) return 'sek'
  if (locale.includes('de') || locale.includes('fr') || locale.includes('es') || locale.includes('it')) return 'eur'
  
  // Default to SEK since that's what you have configured
  return 'sek'
}

const handleGoogleSignup = async () => {
  loading.value = true
  error.value = ''

  try {
    const { error: signupError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (signupError) {
      error.value = signupError.message
    }
  } catch (err) {
    error.value = 'An unexpected error occurred'
    console.error('Google signup error:', err)
  } finally {
    loading.value = false
  }
}

watch(error, (newError) => {
  if (newError) {
    setTimeout(() => {
      error.value = ''
    }, 5000)
  }
})
</script>
