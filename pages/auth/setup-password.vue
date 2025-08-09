<template>
  <div class="min-h-screen gradient-bg flex items-center justify-center">
    <div class="text-center max-w-md mx-auto px-4">
      <div v-if="loading" class="flex flex-col items-center">
        <svg class="animate-spin h-12 w-12 text-primary-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <h2 class="text-xl font-semibold text-secondary-900">Setting up your password...</h2>
      </div>

      <div v-else-if="error" class="glass rounded-2xl shadow-strong p-8">
        <div class="text-danger-600 mb-4">
          <svg class="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
          </svg>
        </div>
        <h2 class="text-xl font-semibold text-secondary-900 mb-2">Setup Error</h2>
        <p class="text-secondary-600 mb-6">{{ error }}</p>
        <NuxtLink to="/auth/login" class="btn-secondary w-full">
          Back to Login
        </NuxtLink>
      </div>

      <div v-else-if="success" class="glass rounded-2xl shadow-strong p-8">
        <div class="text-green-600 mb-4">
          <svg class="h-16 w-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <h1 class="text-3xl font-bold gradient-text mb-4">Password Set Successfully!</h1>
        <p class="text-lg text-secondary-600 mb-6">
          Your account is ready. You can now log in with your email and new password.
        </p>
        <button @click="proceedToLogin" class="btn-primary w-full text-lg py-3">
          Continue to Login
        </button>
      </div>

      <div v-else class="glass rounded-2xl shadow-strong p-8">
        <div class="text-primary-600 mb-4">
          <svg class="h-16 w-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
        </div>
        
        <h1 class="text-3xl font-bold gradient-text mb-2">Set Your Password</h1>
        <p class="text-secondary-600 mb-6">
          Welcome to PennyPilot! Please create a secure password for your account.
        </p>

        <div v-if="userEmail" class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
          <p class="text-sm text-blue-700">
            Setting up password for: <strong>{{ userEmail }}</strong>
          </p>
        </div>

        <form @submit.prevent="setupPassword" class="space-y-4">
          <div>
            <label for="password" class="block text-sm font-medium text-secondary-700 text-left mb-1">New Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              minlength="8"
              class="input-field w-full"
              placeholder="Enter your new password (min. 8 characters)"
            />
          </div>

          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-secondary-700 text-left mb-1">Confirm Password</label>
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              type="password"
              required
              class="input-field w-full"
              placeholder="Confirm your new password"
            />
          </div>

          <!-- Password requirements -->
          <div class="text-left">
            <p class="text-xs text-secondary-600 mb-2">Password requirements:</p>
            <ul class="text-xs text-secondary-600 space-y-1">
              <li class="flex items-center">
                <span :class="password.length >= 8 ? 'text-green-600' : 'text-secondary-400'">
                  {{ password.length >= 8 ? '✓' : '○' }}
                </span>
                <span class="ml-2">At least 8 characters</span>
              </li>
              <li class="flex items-center">
                <span :class="password === confirmPassword && password.length > 0 ? 'text-green-600' : 'text-secondary-400'">
                  {{ password === confirmPassword && password.length > 0 ? '✓' : '○' }}
                </span>
                <span class="ml-2">Passwords match</span>
              </li>
            </ul>
          </div>

          <div v-if="formError" class="rounded-md bg-danger-50 p-3">
            <p class="text-sm text-danger-800">{{ formError }}</p>
          </div>

          <button
            type="submit"
            :disabled="setupLoading || !isFormValid"
            class="btn-primary w-full py-3"
          >
            <span v-if="setupLoading" class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Setting password...
            </span>
            <span v-else>Set Password & Continue</span>
          </button>
        </form>

        <div class="mt-6 pt-4 border-t border-secondary-200">
          <p class="text-xs text-secondary-600">
            By continuing, you confirm that you've completed payment and agree to our 
            <a href="/terms" class="text-primary-600 hover:text-primary-500">Terms of Service</a>.
          </p>
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
const setupLoading = ref(false)
const error = ref('')
const success = ref(false)
const formError = ref('')

const userEmail = ref('')
const password = ref('')
const confirmPassword = ref('')

const isFormValid = computed(() => {
  return password.value.length >= 8 &&
         password.value === confirmPassword.value &&
         password.value.length > 0
})

const verifySetupToken = async () => {
  loading.value = true
  error.value = ''

  try {
    const token = route.query.token as string
    
    if (!token) {
      throw new Error('No setup token provided')
    }

    // Verify the setup token and get user info
    const response = await $fetch('/api/auth/verify-setup-token', {
      method: 'POST',
      body: { token }
    })

    if (response.success) {
      userEmail.value = response.email
    } else {
      throw new Error(response.message || 'Invalid setup token')
    }

  } catch (err: any) {
    console.error('Token verification error:', err)
    error.value = err.message || 'Invalid or expired setup link. Please contact support.'
  } finally {
    loading.value = false
  }
}

const setupPassword = async () => {
  setupLoading.value = true
  formError.value = ''

  if (password.value !== confirmPassword.value) {
    formError.value = 'Passwords do not match'
    setupLoading.value = false
    return
  }

  try {
    const token = route.query.token as string
    
    const response = await $fetch('/api/auth/setup-password', {
      method: 'POST',
      body: { 
        token,
        password: password.value
      }
    })

    if (response.success) {
      success.value = true
    } else {
      throw new Error(response.message || 'Failed to set password')
    }

  } catch (err: any) {
    console.error('Password setup error:', err)
    formError.value = err.message || 'Failed to set password. Please try again.'
  } finally {
    setupLoading.value = false
  }
}

const proceedToLogin = () => {
  router.push('/auth/login')
}

onMounted(() => {
  verifySetupToken()
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

.input-field {
  @apply block w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm placeholder-secondary-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500;
}

.btn-primary {
  @apply bg-gradient-to-r from-primary-600 to-accent-600 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-accent-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-secondary {
  @apply bg-secondary-100 text-secondary-900 font-semibold rounded-xl hover:bg-secondary-200 transition-colors duration-200;
}
</style>