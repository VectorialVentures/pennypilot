<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
    <AppNavigation />
    
    <div class="py-16 px-6 sm:py-24 sm:px-8">
      <PlanSelection 
        @plan-selected="handlePlanSelection" 
        :redirect-after-selection="false"
      />
      
      <!-- FAQ Section -->
      <div class="max-w-4xl mx-auto mt-24">
        <div class="text-center mb-16">
          <h2 class="text-3xl font-bold text-gray-900 sm:text-4xl">
            Frequently asked questions
          </h2>
          <p class="mt-4 text-lg text-gray-600">
            Everything you need to know about PennyPilot
          </p>
        </div>

        <div class="space-y-8">
          <div class="glass rounded-2xl p-8">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">
              Can I change my plan at any time?
            </h3>
            <p class="text-gray-600">
              Yes! You can upgrade, downgrade, or cancel your subscription at any time. 
              Changes take effect immediately, and you'll be prorated accordingly.
            </p>
          </div>

          <div class="glass rounded-2xl p-8">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">
              What happens to my data if I cancel?
            </h3>
            <p class="text-gray-600">
              Your data is always yours. If you cancel, you can still access your portfolios 
              in read-only mode, and you can reactivate your subscription at any time to 
              regain full access.
            </p>
          </div>

          <div class="glass rounded-2xl p-8">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">
              Do you offer annual billing?
            </h3>
            <p class="text-gray-600">
              Yes! Annual billing is available with a 20% discount. Contact our support team 
              to switch to annual billing.
            </p>
          </div>

          <div class="glass rounded-2xl p-8">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">
              Is my financial data secure?
            </h3>
            <p class="text-gray-600">
              Absolutely. We use bank-level encryption and security measures to protect your data. 
              We never store your actual banking credentials and only access read-only portfolio information.
            </p>
          </div>
        </div>
      </div>

      <!-- CTA Section -->
      <div class="max-w-4xl mx-auto mt-24 text-center">
        <div class="glass rounded-3xl p-12 bg-gradient-to-r from-primary-600 to-accent-600">
          <h2 class="text-3xl font-bold text-white sm:text-4xl">
            Ready to take control of your investments?
          </h2>
          <p class="mt-6 text-xl text-primary-100">
            Join thousands of investors who trust PennyPilot with their portfolio management.
          </p>
          <div class="mt-10">
            <NuxtLink 
              to="/auth/signup" 
              class="inline-flex items-center px-8 py-3 bg-white text-primary-600 rounded-xl font-semibold hover:bg-gray-50 transition-colors duration-200 text-lg"
            >
              Start your free trial
              <ArrowRightIcon class="ml-2 h-5 w-5" />
            </NuxtLink>
          </div>
          <p class="mt-4 text-sm text-primary-200">
            No credit card required • 14-day free trial
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowRightIcon } from '@heroicons/vue/24/outline'

definePageMeta({
  auth: false
})

const router = useRouter()

const handlePlanSelection = async (plan: string) => {
  // Store the selected plan and redirect to signup
  localStorage.setItem('selectedPlan', plan)
  await router.push('/auth/signup')
}
</script>

<style scoped>
.glass {
  @apply bg-white/70 backdrop-blur-sm;
}
</style>