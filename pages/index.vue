<template>
  <div>
    <!-- Landing Page Layout (No Auth Required) -->
    <div class="min-h-screen gradient-bg">
      <!-- Hero Section -->
      <div class="relative overflow-hidden">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div class="text-center">
            <div class="flex justify-center mb-8">
              <div class="w-16 h-16 bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center shadow-glow">
                <span class="text-white font-bold text-2xl">S</span>
              </div>
            </div>
            
            <h1 class="text-5xl md:text-7xl font-bold gradient-text mb-6 animate-fade-in">
              StockAdvisor
            </h1>
            
            <p class="text-xl md:text-2xl text-secondary-600 mb-8 max-w-3xl mx-auto animate-slide-up">
              Transform your investment strategy with AI-powered portfolio management and intelligent stock recommendations
            </p>
            
            <div class="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up">
              <NuxtLink to="/auth/signup" class="btn-primary text-lg px-8 py-4">
                Start Free Trial
              </NuxtLink>
              <NuxtLink to="/auth/login" class="btn-secondary text-lg px-8 py-4">
                Sign In
              </NuxtLink>
            </div>
            
            <p class="text-sm text-secondary-500 mt-4">
              14-day free trial • No credit card required
            </p>
          </div>
        </div>
        
        <!-- Gradient Orb -->
        <div class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-primary-400/20 to-accent-400/20 rounded-full blur-3xl animate-pulse-subtle"></div>
      </div>
      
      <!-- Features Section -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div class="text-center mb-16">
          <h2 class="text-3xl md:text-4xl font-bold gradient-text mb-4">
            Intelligent Investment Management
          </h2>
          <p class="text-lg text-secondary-600 max-w-2xl mx-auto">
            Our AI analyzes market trends, company fundamentals, and your risk profile to provide personalized investment recommendations
          </p>
        </div>
        
        <div class="grid md:grid-cols-3 gap-8">
          <div class="card-hover text-center animate-slide-up">
            <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <ChartBarIcon class="w-6 h-6 text-primary-600" />
            </div>
            <h3 class="text-xl font-semibold text-secondary-900 mb-2">Smart Analytics</h3>
            <p class="text-secondary-600">
              Advanced portfolio analytics with real-time performance tracking and risk assessment
            </p>
          </div>
          
          <div class="card-hover text-center animate-slide-up" style="animation-delay: 0.1s;">
            <div class="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <CpuChipIcon class="w-6 h-6 text-accent-600" />
            </div>
            <h3 class="text-xl font-semibold text-secondary-900 mb-2">AI Recommendations</h3>
            <p class="text-secondary-600">
              Machine learning algorithms analyze thousands of data points to suggest optimal trades
            </p>
          </div>
          
          <div class="card-hover text-center animate-slide-up" style="animation-delay: 0.2s;">
            <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <ShieldCheckIcon class="w-6 h-6 text-primary-600" />
            </div>
            <h3 class="text-xl font-semibold text-secondary-900 mb-2">Risk Management</h3>
            <p class="text-secondary-600">
              Intelligent risk assessment and portfolio diversification recommendations
            </p>
          </div>
        </div>
      </div>
      
      <!-- CTA Section -->
      <div class="bg-gradient-to-r from-primary-600 to-accent-600 text-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 class="text-3xl md:text-4xl font-bold mb-4">
            Ready to revolutionize your investments?
          </h2>
          <p class="text-xl mb-8 opacity-90">
            Join thousands of investors who trust StockAdvisor with their portfolio
          </p>
          <NuxtLink to="/auth/signup" class="btn-secondary text-primary-600 bg-white hover:bg-gray-50 text-lg px-8 py-4">
            Get Started Today
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChartBarIcon, CpuChipIcon, ShieldCheckIcon } from '@heroicons/vue/24/outline'

definePageMeta({
  layout: false,
  auth: false
})

const user = useSupabaseUser()

// Redirect to dashboard if already logged in
watch(user, (newUser) => {
  if (newUser) {
    navigateTo('/dashboard')
  }
}, { immediate: true })

useHead({
  title: 'StockAdvisor - AI-Powered Investment Platform',
  meta: [
    { name: 'description', content: 'Transform your investment strategy with AI-powered portfolio management and intelligent stock recommendations. Start your 14-day free trial today.' }
  ]
})
</script>