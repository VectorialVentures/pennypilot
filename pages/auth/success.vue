<template>
  <div class="min-h-screen gradient-bg flex items-center justify-center">
    <div class="text-center max-w-2xl mx-auto px-4">
      <div v-if="loading" class="flex flex-col items-center">
        <svg class="animate-spin h-12 w-12 text-primary-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <h2 class="text-xl font-semibold text-secondary-900">Setting up your account...</h2>
        <p class="text-secondary-600 mt-2">Please wait while we complete your registration.</p>
      </div>

      <div v-else-if="error" class="glass rounded-2xl shadow-strong p-8">
        <div class="text-danger-600 mb-4">
          <svg class="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
          </svg>
        </div>
        <h2 class="text-xl font-semibold text-secondary-900 mb-2">Setup Error</h2>
        <p class="text-secondary-600 mb-6">{{ error }}</p>
        <div class="space-y-3">
          <button @click="checkAccountSetup" class="btn-primary w-full">
            Try Again
          </button>
          <NuxtLink to="/contact" class="btn-secondary w-full">
            Contact Support
          </NuxtLink>
        </div>
      </div>

      <div v-else class="glass rounded-2xl shadow-strong p-8">
        <div class="text-green-600 mb-4">
          <svg class="h-16 w-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        
        <h1 class="text-3xl font-bold gradient-text mb-4">Welcome to PennyPilot!</h1>
        <p class="text-lg text-secondary-600 mb-6">
          Your subscription is active and your account has been created successfully.
        </p>

        <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div class="flex items-start">
            <svg class="h-5 w-5 text-green-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <div class="text-left">
              <h3 class="text-sm font-medium text-green-900">Next Step: Set Your Password</h3>
              <p class="text-sm text-green-700 mt-1">
                Your payment was successful! Now create a secure password for your account: <strong>{{ userEmail }}</strong>
              </p>
            </div>
          </div>
        </div>

        <div class="space-y-4">
          <button 
            @click="proceedToPasswordSetup" 
            class="btn-primary w-full text-lg py-3"
            :disabled="!setupToken"
          >
            Set My Password
          </button>
          
          <div class="text-sm text-secondary-600">
            <p>Questions? <NuxtLink to="/contact" class="text-primary-600 hover:text-primary-500">Contact our support team</NuxtLink></p>
          </div>
        </div>

        <!-- Plan details -->
        <div class="mt-8 pt-6 border-t border-secondary-200">
          <h3 class="text-sm font-medium text-secondary-900 mb-3">Your Subscription Details</h3>
          <div class="bg-secondary-50 rounded-lg p-4 text-left">
            <div v-if="planDetails" class="space-y-2">
              <div class="flex justify-between items-center">
                <span class="text-sm text-secondary-600">Plan:</span>
                <span class="text-sm font-medium text-secondary-900 capitalize">{{ planDetails.plan }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-secondary-600">Status:</span>
                <span class="text-sm font-medium text-green-600">Trial Active</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-secondary-600">Trial Period:</span>
                <span class="text-sm font-medium text-secondary-900">14 days free</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
  auth: false
})

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const error = ref('')
const userEmail = ref('')
const planDetails = ref<{ plan: string } | null>(null)
const setupToken = ref('')

const checkAccountSetup = async () => {
  loading.value = true
  error.value = ''

  try {
    const sessionId = route.query.session_id as string
    
    if (!sessionId) {
      throw new Error('No session ID provided')
    }

    // Check if the account setup is complete by verifying the checkout session
    const response = await $fetch('/api/stripe/verify-checkout-session', {
      method: 'POST',
      body: { sessionId }
    })

    if (response.success) {
      userEmail.value = response.customerEmail
      setupToken.value = response.setupToken
      planDetails.value = {
        plan: response.planType
      }
    } else {
      throw new Error(response.message || 'Account setup incomplete')
    }

  } catch (err: any) {
    console.error('Account setup verification error:', err)
    error.value = err.message || 'Unable to verify account setup. Please try again or contact support.'
  } finally {
    loading.value = false
  }
}

const proceedToLogin = () => {
  router.push('/auth/login')
}

const proceedToPasswordSetup = () => {
  if (setupToken.value) {
    router.push(`/auth/setup-password?token=${setupToken.value}`)
  }
}

onMounted(() => {
  checkAccountSetup()
})
</script>

<style scoped>
.gradient-text {
  @apply bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent;
}

.glass {
  @apply bg-white/70 backdrop-blur-sm;
}

.gradient-bg {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
</style>