<template>
  <div class="min-h-screen gradient-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full">
      <div class="glass rounded-2xl shadow-strong p-8">
        <div class="text-center">
          <h2 class="text-3xl font-bold gradient-text">Create your account</h2>
          <p class="mt-2 text-sm text-secondary-600">Join StockAdvisor and start your investment journey</p>
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
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
  auth: false
})

const supabase = useSupabaseClient()
const router = useRouter()

const fullName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const agreeToTerms = ref(false)
const loading = ref(false)
const error = ref('')

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
  
  console.log('Starting signup process...')
  
  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    loading.value = false
    return
  }
  
  try {
    console.log('Attempting Supabase signup...')
    const { data, error: signupError } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
      options: {
        data: {
          full_name: fullName.value
        }
      }
    })
    
    console.log('Signup response:', { data, signupError })
    
    if (signupError) {
      error.value = signupError.message
      console.error('Signup error:', signupError)
      return
    }
    
    if (data.user && !data.session) {
      // Email confirmation required
      console.log('Email confirmation required')
      error.value = 'Please check your email and click the confirmation link to complete registration.'
      // Don't redirect, just show message
    } else if (data.session) {
      // Auto sign-in successful
      console.log('Auto sign-in successful, redirecting to dashboard')
      await router.push('/dashboard')
    }
  } catch (err) {
    error.value = 'An unexpected error occurred'
    console.error('Signup error:', err)
  } finally {
    loading.value = false
  }
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