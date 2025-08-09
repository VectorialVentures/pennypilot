<template>
  <div class="min-h-screen gradient-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full">
      <div class="glass rounded-2xl shadow-strong p-8 text-center">
        <div class="mb-6">
          <NuxtImg
            src="/images/waiting-for-mail.png"
            alt="PennyPilot robot waiting for email"
            class="mx-auto h-40 w-40 object-contain transition-transform duration-300 hover:scale-105"
            loading="eager"
          />
        </div>

        <h2 class="text-2xl font-bold gradient-text mb-4">
          Check your email
        </h2>

        <p class="text-secondary-600 mb-6">
          We've sent a confirmation link to <span class="font-semibold text-secondary-900">{{ email }}</span>
        </p>

        <p class="text-sm text-secondary-500 mb-8">
          Click the link in the email to complete your registration and start using PennyPilot.
        </p>

        <div class="space-y-4">
          <button
            @click="resendEmail"
            :disabled="resending || cooldownActive"
            class="w-full btn-secondary"
          >
            <span v-if="resending" class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sending...
            </span>
            <span v-else-if="cooldownActive">
              Resend in {{ cooldownSeconds }}s
            </span>
            <span v-else>
              Resend confirmation email
            </span>
          </button>

          <div v-if="resendSuccess" class="p-3 bg-accent-50 rounded-lg">
            <p class="text-sm text-accent-800">
              ✓ Confirmation email sent successfully!
            </p>
          </div>

          <div v-if="resendError" class="p-3 bg-danger-50 rounded-lg">
            <p class="text-sm text-danger-800">
              {{ resendError }}
            </p>
          </div>
        </div>

        <div class="mt-8 pt-6 border-t border-secondary-200">
          <p class="text-xs text-secondary-500 mb-4">
            Didn't receive the email? Check your spam folder or contact support.
          </p>

          <NuxtLink
            to="/auth/login"
            class="text-sm text-primary-600 hover:text-primary-500 font-medium"
          >
            ← Back to sign in
          </NuxtLink>
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
const supabase = useSupabaseClient()

// Get email from query params
const email = ref(route.query.email as string || '')

// Resend functionality
const resending = ref(false)
const resendSuccess = ref(false)
const resendError = ref('')
const cooldownActive = ref(false)
const cooldownSeconds = ref(0)

// Redirect to signup if no email provided
onMounted(() => {
  if (!email.value) {
    navigateTo('/auth/signup')
  }
})

const resendEmail = async () => {
  if (resending.value || cooldownActive.value || !email.value) return

  resending.value = true
  resendSuccess.value = false
  resendError.value = ''

  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.value
    })

    if (error) {
      resendError.value = error.message
    } else {
      resendSuccess.value = true
      startCooldown()
    }
  } catch (err: any) {
    resendError.value = 'Failed to resend email. Please try again.'
  } finally {
    resending.value = false
  }
}

const startCooldown = () => {
  cooldownActive.value = true
  cooldownSeconds.value = 60

  const interval = setInterval(() => {
    cooldownSeconds.value--

    if (cooldownSeconds.value <= 0) {
      clearInterval(interval)
      cooldownActive.value = false
    }
  }, 1000)
}

// Clear success/error messages after some time
watch(resendSuccess, (newValue) => {
  if (newValue) {
    setTimeout(() => {
      resendSuccess.value = false
    }, 5000)
  }
})

watch(resendError, (newValue) => {
  if (newValue) {
    setTimeout(() => {
      resendError.value = ''
    }, 5000)
  }
})
</script>

<style scoped>
.gradient-bg {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.gradient-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.glass {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.shadow-strong {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}
</style>
