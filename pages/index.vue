<template>
  <div>
    <!-- Landing Page Layout (No Auth Required) -->
    <div class="relative overflow-hidden">
      <!-- Animated Background Gradients -->
      <div class="absolute inset-0 bg-gradient-to-br from-background-950 via-background-900 to-background-950">
        <div class="absolute inset-0 bg-gradient-to-tr from-primary-900/20 via-transparent to-accent-900/20 animate-gradient-shift"></div>
        <div class="absolute inset-0 bg-gradient-to-bl from-transparent via-primary-800/30 to-transparent animate-gradient-pulse"></div>
      </div>

      <!-- Floating Gradient Orbs -->
      <div class="absolute top-20 left-1/4 w-64 h-64 bg-gradient-to-r from-primary-500/20 to-accent-500/20 rounded-full blur-2xl animate-float-slow"></div>
      <div class="absolute bottom-20 right-1/4 w-96 h-96 bg-gradient-to-l from-accent-400/15 to-primary-400/15 rounded-full blur-3xl animate-float-reverse"></div>
      <div class="absolute top-1/2 left-10 w-32 h-32 bg-gradient-to-br from-primary-600/25 to-transparent rounded-full blur-xl animate-float-gentle"></div>

      <!-- Hero Section -->
      <div class="relative">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-0">
          <div class="grid lg:grid-cols-2 gap-12 items-center">
            <!-- Left Column - Content -->
            <div class="text-left lg:text-left">
              <div class="flex justify-start mb-8">
                <div class="w-16 h-16 bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center shadow-2xl animate-glow-pulse">
                  <span class="text-white font-bold text-2xl">P</span>
                </div>
              </div>

              <h1 class="text-5xl lg:text-7xl font-heading font-black gradient-text mb-6 animate-fade-in-up leading-tight">
                PennyPilot AI
              </h1>

              <p class="text-xl lg:text-2xl text-white/80 mb-8 leading-relaxed animate-slide-in-left" style="animation-delay: 0.2s;">
                Transform your investment strategy with AI-powered portfolio management and intelligent stock recommendations
              </p>

              <div class="flex flex-col sm:flex-row gap-4 justify-start items-start animate-slide-in-left" style="animation-delay: 0.4s;">
                <NuxtLink to="/auth/signup" class="btn-primary text-lg px-10 py-5 hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl">
                  <span class="flex items-center gap-2">
                    Start Free Trial
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                    </svg>
                  </span>
                </NuxtLink>
                <NuxtLink to="/auth/login" class="btn-secondary text-lg px-10 py-5 hover:scale-105 transition-all duration-300">
                  Sign In
                </NuxtLink>
              </div>

              <div class="flex items-center gap-6 mt-8 text-sm text-white/60 animate-slide-in-left" style="animation-delay: 0.6s;">
                <span class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                  14-day free trial
                </span>
                <span class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                  No credit card required
                </span>
              </div>
            </div>

            <!-- Right Column - Hero Illustration -->
            <div class="relative lg:block flex justify-center">
              <div class="relative">
                <!-- Main Robot Image -->
                <NuxtImg
                  src="/images/penny-pilot.png"
                  alt="PennyPilot AI Investment Assistant Robot"
                  class="w-full max-w-lg mx-auto h-auto animate-gentle-bounce"
                  width="512"
                  height="512"
                  loading="eager"
                />

                <!-- Floating Spheres with Wavy Orbital Animation -->
                <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <!-- Sphere 1: Chart/Analytics -->
                  <div class="absolute w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-glow animate-orbit-wavy-1">
                    <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                    </svg>
                  </div>

                  <!-- Sphere 2: AI/Brain -->
                  <div class="absolute w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-600 rounded-full flex items-center justify-center shadow-glow-pink animate-orbit-wavy-2">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                    </svg>
                  </div>

                  <!-- Sphere 3: Money/Dollar -->
                  <div class="absolute w-10 h-10 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-full flex items-center justify-center shadow-glow animate-orbit-wavy-3">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Features Section -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="text-center mb-8">
          <h2 class="text-3xl md:text-4xl font-heading font-bold gradient-text mb-4">
            Intelligent Investment Management
          </h2>
          <p class="text-lg text-white/70 max-w-2xl mx-auto">
            Our AI analyzes market trends, company fundamentals, and your risk profile to provide personalized investment recommendations
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-8">
          <div class="card-hover text-center animate-slide-up">
            <div class="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <ChartBarIcon class="w-6 h-6 text-primary-600" />
            </div>
            <h3 class="text-xl font-heading font-semibold text-white mb-2">Smart Analytics</h3>
            <p class="text-white/70">
              Advanced portfolio analytics with real-time performance tracking and risk assessment
            </p>
          </div>

          <div class="card-hover text-center animate-slide-up" style="animation-delay: 0.1s;">
            <div class="w-12 h-12 bg-accent-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <CpuChipIcon class="w-6 h-6 text-accent-600" />
            </div>
            <h3 class="text-xl font-heading font-semibold text-white mb-2">AI Recommendations</h3>
            <p class="text-white/70">
              Machine learning algorithms analyze thousands of data points to suggest optimal trades
            </p>
          </div>

          <div class="card-hover text-center animate-slide-up" style="animation-delay: 0.2s;">
            <div class="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <ShieldCheckIcon class="w-6 h-6 text-primary-600" />
            </div>
            <h3 class="text-xl font-heading font-semibold text-white mb-2">Risk Management</h3>
            <p class="text-white/70">
              Intelligent risk assessment and portfolio diversification recommendations
            </p>
          </div>
        </div>
      </div>

      <!-- CTA Section -->
      <div class="relative bg-gradient-to-r from-primary-600 to-accent-600 text-white overflow-hidden">
        <!-- Background Animation -->
        <div class="absolute inset-0 bg-gradient-to-r from-primary-700/50 to-accent-700/50 animate-gradient-shift"></div>

        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center relative">
          <div class="animate-fade-in-up">
            <h2 class="text-4xl md:text-5xl font-heading font-bold mb-6 leading-tight">
              Ready to revolutionize your investments?
            </h2>
            <p class="text-xl mb-10 opacity-90 max-w-2xl mx-auto leading-relaxed">
              Join thousands of investors who trust PennyPilot with their portfolio management and AI-powered recommendations
            </p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <NuxtLink to="/auth/signup" class="bg-white text-primary-600 hover:bg-gray-50 text-lg px-12 py-5 rounded-xl font-semibold hover:scale-105 transition-all duration-300 shadow-2xl">
                <span class="flex items-center gap-2">
                  Get Started Today
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                  </svg>
                </span>
              </NuxtLink>
              <span class="text-white/80 text-sm">
                Start your free 14-day trial • No commitment required
              </span>
            </div>
          </div>
        </div>

        <!-- Decorative Elements -->
        <div class="absolute top-10 right-10 w-20 h-20 bg-white/10 rounded-full blur-lg animate-float-gentle"></div>
        <div class="absolute bottom-10 left-10 w-16 h-16 bg-white/5 rounded-full blur-lg animate-float-reverse"></div>
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
  title: 'PennyPilot - AI-Powered Investment Platform',
  meta: [
    { name: 'description', content: 'Transform your investment strategy with AI-powered portfolio management and intelligent stock recommendations. Start your 14-day free trial today.' }
  ]
})
</script>
