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
    
    <div class="relative min-h-screen flex items-center justify-center">
      <div class="text-center max-w-md mx-auto px-4">
        <div v-if="loading" class="flex flex-col items-center">
          <svg class="animate-spin h-12 w-12 text-primary-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <h2 class="text-xl font-semibold text-white">Setting up your password...</h2>
          <p class="text-white/70 mt-2">Please wait while we verify your setup token.</p>
        </div>

        <div v-else-if="error" class="glass-dark rounded-2xl p-8">
          <div class="text-red-400 mb-4">
            <svg class="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
            </svg>
          </div>
          <h2 class="text-xl font-semibold text-white mb-2">Setup Error</h2>
          <p class="text-white/70 mb-6">{{ error }}</p>
          <NuxtLink to="/auth/login" class="btn-secondary w-full">
            Back to Login
          </NuxtLink>
        </div>

        <div v-else-if="success" class="relative group">
          <div class="absolute -inset-1 bg-gradient-to-r from-accent-600/30 to-primary-600/30 rounded-2xl blur opacity-40"></div>
          <div class="relative glass-dark rounded-2xl p-8 border border-accent-500/30">
            <div class="text-accent-400 mb-4">
              <svg class="h-16 w-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h1 class="text-3xl font-bold gradient-text mb-4">Password Set Successfully!</h1>
            <p class="text-lg text-white/80 mb-6">
              Your account is ready. You can now log in with your email and new password.
            </p>
            <button @click="proceedToLogin" class="btn-primary w-full text-lg py-3">
              Continue to Login
            </button>
          </div>
        </div>

        <div v-else class="relative group">
          <div class="absolute -inset-1 bg-gradient-to-r from-primary-600/30 to-accent-600/30 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
          <div class="relative glass-dark rounded-2xl p-8 border border-primary-500/30 hover:border-primary-400/50 transition-all duration-300">
            <div class="text-primary-400 mb-4">
              <svg class="h-16 w-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </div>
            
            <h1 class="text-3xl font-bold gradient-text mb-2">Set Your Password</h1>
            <p class="text-white/70 mb-6">
              Welcome to <span class="gradient-text font-semibold">PennyPilot!</span> Please create a secure password for your account.
            </p>

            <div v-if="userEmail" class="bg-primary-500/20 border border-primary-500/30 rounded-lg p-4 mb-6">
              <p class="text-sm text-primary-300">
                Setting up password for: <strong class="text-white">{{ userEmail }}</strong>
              </p>
            </div>

            <form @submit.prevent="setupPassword" class="space-y-6">
              <div>
                <label for="password" class="block text-sm font-semibold text-white text-left mb-3">New Password</label>
                <div class="relative">
                  <input
                    id="password"
                    v-model="password"
                    :type="showPassword ? 'text' : 'password'"
                    required
                    minlength="8"
                    class="input-field w-full pr-12"
                    placeholder="Enter your new password"
                    @input="updatePasswordStrength"
                  />
                  <button
                    type="button"
                    @click="showPassword = !showPassword"
                    class="absolute inset-y-0 right-0 pr-3 flex items-center text-white/60 hover:text-white transition-colors"
                  >
                    <EyeIcon v-if="!showPassword" class="h-5 w-5" />
                    <EyeSlashIcon v-else class="h-5 w-5" />
                  </button>
                </div>
              </div>

              <!-- Password Strength Meter -->
              <div v-if="password" class="space-y-3">
                <div class="flex justify-between items-center">
                  <span class="text-sm font-medium text-white">Password Strength</span>
                  <span class="text-sm font-medium" :class="strengthColor">{{ strengthText }}</span>
                </div>
                <div class="w-full bg-background-800 rounded-full h-2">
                  <div 
                    class="h-2 rounded-full transition-all duration-300"
                    :class="strengthBarColor"
                    :style="{ width: `${strengthPercentage}%` }"
                  ></div>
                </div>
              </div>

              <div>
                <label for="confirmPassword" class="block text-sm font-semibold text-white text-left mb-3">Confirm Password</label>
                <div class="relative">
                  <input
                    id="confirmPassword"
                    v-model="confirmPassword"
                    :type="showConfirmPassword ? 'text' : 'password'"
                    required
                    class="input-field w-full pr-12"
                    placeholder="Confirm your new password"
                  />
                  <button
                    type="button"
                    @click="showConfirmPassword = !showConfirmPassword"
                    class="absolute inset-y-0 right-0 pr-3 flex items-center text-white/60 hover:text-white transition-colors"
                  >
                    <EyeIcon v-if="!showConfirmPassword" class="h-5 w-5" />
                    <EyeSlashIcon v-else class="h-5 w-5" />
                  </button>
                </div>
              </div>

              <!-- Password Requirements -->
              <div class="text-left bg-background-800/30 rounded-lg p-4">
                <p class="text-sm font-medium text-white mb-3">Password Requirements:</p>
                <div class="space-y-2">
                  <div class="flex items-center">
                    <div class="w-5 h-5 rounded-full flex items-center justify-center mr-3" 
                         :class="requirements.length ? 'bg-green-500' : 'bg-white/20'">
                      <CheckIcon v-if="requirements.length" class="w-3 h-3 text-white" />
                      <span v-else class="w-2 h-2 bg-white/40 rounded-full"></span>
                    </div>
                    <span class="text-sm" :class="requirements.length ? 'text-green-400' : 'text-white/70'">
                      At least 8 characters
                    </span>
                  </div>
                  <div class="flex items-center">
                    <div class="w-5 h-5 rounded-full flex items-center justify-center mr-3" 
                         :class="requirements.uppercase ? 'bg-green-500' : 'bg-white/20'">
                      <CheckIcon v-if="requirements.uppercase" class="w-3 h-3 text-white" />
                      <span v-else class="w-2 h-2 bg-white/40 rounded-full"></span>
                    </div>
                    <span class="text-sm" :class="requirements.uppercase ? 'text-green-400' : 'text-white/70'">
                      One uppercase letter
                    </span>
                  </div>
                  <div class="flex items-center">
                    <div class="w-5 h-5 rounded-full flex items-center justify-center mr-3" 
                         :class="requirements.lowercase ? 'bg-green-500' : 'bg-white/20'">
                      <CheckIcon v-if="requirements.lowercase" class="w-3 h-3 text-white" />
                      <span v-else class="w-2 h-2 bg-white/40 rounded-full"></span>
                    </div>
                    <span class="text-sm" :class="requirements.lowercase ? 'text-green-400' : 'text-white/70'">
                      One lowercase letter
                    </span>
                  </div>
                  <div class="flex items-center">
                    <div class="w-5 h-5 rounded-full flex items-center justify-center mr-3" 
                         :class="requirements.number ? 'bg-green-500' : 'bg-white/20'">
                      <CheckIcon v-if="requirements.number" class="w-3 h-3 text-white" />
                      <span v-else class="w-2 h-2 bg-white/40 rounded-full"></span>
                    </div>
                    <span class="text-sm" :class="requirements.number ? 'text-green-400' : 'text-white/70'">
                      One number
                    </span>
                  </div>
                  <div class="flex items-center">
                    <div class="w-5 h-5 rounded-full flex items-center justify-center mr-3" 
                         :class="requirements.match ? 'bg-green-500' : 'bg-white/20'">
                      <CheckIcon v-if="requirements.match" class="w-3 h-3 text-white" />
                      <span v-else class="w-2 h-2 bg-white/40 rounded-full"></span>
                    </div>
                    <span class="text-sm" :class="requirements.match ? 'text-green-400' : 'text-white/70'">
                      Passwords match
                    </span>
                  </div>
                </div>
              </div>

              <div v-if="formError" class="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                <p class="text-sm text-red-400">{{ formError }}</p>
              </div>

              <button
                type="submit"
                :disabled="setupLoading || !isFormValid"
                class="btn-primary w-full py-3 text-base font-semibold"
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

            <div class="mt-6 pt-6 border-t border-white/20">
              <p class="text-xs text-white/60">
                By continuing, you confirm that you've completed payment and agree to our 
                <a href="/terms" class="text-primary-400 hover:text-primary-300 transition-colors">Terms of Service</a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { EyeIcon, EyeSlashIcon, CheckIcon } from '@heroicons/vue/24/outline'

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
const showPassword = ref(false)
const showConfirmPassword = ref(false)

// Password strength tracking
const passwordStrength = ref(0)
const requirements = ref({
  length: false,
  uppercase: false,
  lowercase: false,
  number: false,
  special: false,
  match: false
})

// Password strength computed properties
const strengthPercentage = computed(() => {
  return Math.min((passwordStrength.value / 5) * 100, 100)
})

const strengthText = computed(() => {
  if (passwordStrength.value <= 1) return 'Very Weak'
  if (passwordStrength.value <= 2) return 'Weak'
  if (passwordStrength.value <= 3) return 'Fair'
  if (passwordStrength.value <= 4) return 'Good'
  return 'Strong'
})

const strengthColor = computed(() => {
  if (passwordStrength.value <= 1) return 'text-red-400'
  if (passwordStrength.value <= 2) return 'text-orange-400'
  if (passwordStrength.value <= 3) return 'text-yellow-400'
  if (passwordStrength.value <= 4) return 'text-blue-400'
  return 'text-green-400'
})

const strengthBarColor = computed(() => {
  if (passwordStrength.value <= 1) return 'bg-red-500'
  if (passwordStrength.value <= 2) return 'bg-orange-500'
  if (passwordStrength.value <= 3) return 'bg-yellow-500'
  if (passwordStrength.value <= 4) return 'bg-blue-500'
  return 'bg-green-500'
})

const isFormValid = computed(() => {
  return requirements.value.length &&
         requirements.value.uppercase &&
         requirements.value.lowercase &&
         requirements.value.number &&
         requirements.value.match &&
         password.value.length > 0
})

// Watch for password confirmation changes
watch([password, confirmPassword], () => {
  requirements.value.match = password.value === confirmPassword.value && password.value.length > 0
})

const updatePasswordStrength = () => {
  const pwd = password.value
  let strength = 0
  
  // Length check
  requirements.value.length = pwd.length >= 8
  if (requirements.value.length) strength++
  
  // Uppercase check
  requirements.value.uppercase = /[A-Z]/.test(pwd)
  if (requirements.value.uppercase) strength++
  
  // Lowercase check
  requirements.value.lowercase = /[a-z]/.test(pwd)
  if (requirements.value.lowercase) strength++
  
  // Number check
  requirements.value.number = /\d/.test(pwd)
  if (requirements.value.number) strength++
  
  // Special character check
  requirements.value.special = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)
  if (requirements.value.special) strength++
  
  passwordStrength.value = strength
}

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