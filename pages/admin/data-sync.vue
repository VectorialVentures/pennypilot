<template>
  <!-- Background matching the app theme -->
  <div class="min-h-full">
    <div class="absolute inset-0 bg-gradient-to-br from-background-950 via-background-900 to-background-950">
      <div class="absolute inset-0 bg-gradient-to-tr from-primary-900/20 via-transparent to-accent-900/20 animate-gradient-shift"></div>
      <div class="absolute inset-0 bg-gradient-to-bl from-transparent via-primary-800/30 to-transparent animate-gradient-pulse"></div>
    </div>
    
    <!-- Floating Gradient Orbs -->
    <div class="absolute top-20 left-1/4 w-64 h-64 bg-gradient-to-r from-primary-500/20 to-accent-500/20 rounded-full blur-2xl animate-float-slow"></div>
    <div class="absolute bottom-20 right-1/4 w-96 h-96 bg-gradient-to-l from-accent-400/15 to-primary-400/15 rounded-full blur-3xl animate-float-reverse"></div>
    
    <div class="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold gradient-text">Data Sync Admin</h1>
            <p class="text-white/70 mt-2">Trigger data fetching operations</p>
          </div>
          <div class="text-sm text-white/60">
            Hidden Admin Page
          </div>
        </div>
      </div>

      <!-- News Fetching Section -->
      <div class="card-dark mb-8">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-xl font-semibold text-white">Portfolio News Fetching</h2>
            <p class="text-sm text-white/70">Fetch latest news for all securities in user portfolios</p>
          </div>
          <button
            @click="fetchPortfolioNews"
            :disabled="newsFetching"
            class="btn-primary"
            :class="{ 'opacity-50 cursor-not-allowed': newsFetching }"
          >
            <svg v-if="newsFetching" class="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span v-if="newsFetching">Fetching News...</span>
            <span v-else>Fetch Portfolio News</span>
          </button>
        </div>

        <!-- News Results -->
        <div v-if="newsResult" class="mt-4 p-4 rounded-lg" :class="newsResult.success ? 'bg-green-900/20 border border-green-700/50' : 'bg-red-900/20 border border-red-700/50'">
          <div class="flex items-start justify-between">
            <div>
              <h3 class="font-medium" :class="newsResult.success ? 'text-green-400' : 'text-red-400'">
                {{ newsResult.success ? 'Success' : 'Error' }}
              </h3>
              <p class="text-sm text-white/70 mt-1">{{ newsResult.message }}</p>
              
              <div v-if="newsResult.success && newsResult.results" class="mt-3 grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div class="text-center">
                  <div class="text-white font-medium">{{ newsResult.results.total }}</div>
                  <div class="text-white/60">Total Securities</div>
                </div>
                <div class="text-center">
                  <div class="text-green-400 font-medium">{{ newsResult.results.processed }}</div>
                  <div class="text-white/60">Processed</div>
                </div>
                <div class="text-center">
                  <div class="text-blue-400 font-medium">{{ newsResult.results.articles_added }}</div>
                  <div class="text-white/60">Articles Added</div>
                </div>
                <div class="text-center">
                  <div class="text-yellow-400 font-medium">{{ newsResult.results.skipped }}</div>
                  <div class="text-white/60">Skipped</div>
                </div>
                <div class="text-center">
                  <div class="text-red-400 font-medium">{{ newsResult.results.errors }}</div>
                  <div class="text-white/60">Errors</div>
                </div>
              </div>
            </div>
            <button @click="newsResult = null" class="text-white/60 hover:text-white">
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <!-- Price Fetching Section -->
      <div class="card-dark mb-8">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-xl font-semibold text-white">Security Price Updates</h2>
            <p class="text-sm text-white/70">Update current prices for all securities in user portfolios</p>
          </div>
          <button
            @click="fetchSecurityPrices"
            :disabled="pricesFetching"
            class="btn-primary"
            :class="{ 'opacity-50 cursor-not-allowed': pricesFetching }"
          >
            <svg v-if="pricesFetching" class="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span v-if="pricesFetching">Updating Prices...</span>
            <span v-else>Update Security Prices</span>
          </button>
        </div>

        <!-- Price Results -->
        <div v-if="pricesResult" class="mt-4 p-4 rounded-lg" :class="pricesResult.success ? 'bg-green-900/20 border border-green-700/50' : 'bg-red-900/20 border border-red-700/50'">
          <div class="flex items-start justify-between">
            <div>
              <h3 class="font-medium" :class="pricesResult.success ? 'text-green-400' : 'text-red-400'">
                {{ pricesResult.success ? 'Success' : 'Error' }}
              </h3>
              <p class="text-sm text-white/70 mt-1">{{ pricesResult.message }}</p>
              
              <div v-if="pricesResult.success && pricesResult.results" class="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div class="text-center">
                  <div class="text-white font-medium">{{ pricesResult.results.total }}</div>
                  <div class="text-white/60">Total Securities</div>
                </div>
                <div class="text-center">
                  <div class="text-green-400 font-medium">{{ pricesResult.results.updated }}</div>
                  <div class="text-white/60">Updated</div>
                </div>
                <div class="text-center">
                  <div class="text-yellow-400 font-medium">{{ pricesResult.results.skipped }}</div>
                  <div class="text-white/60">Skipped</div>
                </div>
                <div class="text-center">
                  <div class="text-red-400 font-medium">{{ pricesResult.results.errors }}</div>
                  <div class="text-white/60">Errors</div>
                </div>
              </div>
            </div>
            <button @click="pricesResult = null" class="text-white/60 hover:text-white">
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <!-- Recent Activity Log -->
      <div class="card-dark">
        <h2 class="text-xl font-semibold text-white mb-4">Recent Activity</h2>
        <div class="space-y-3">
          <div
            v-for="(activity, index) in activityLog"
            :key="index"
            class="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
          >
            <div class="flex items-center space-x-3">
              <div
                class="w-3 h-3 rounded-full"
                :class="{
                  'bg-green-500': activity.type === 'success',
                  'bg-red-500': activity.type === 'error',
                  'bg-blue-500': activity.type === 'info'
                }"
              ></div>
              <div>
                <div class="text-white font-medium">{{ activity.action }}</div>
                <div class="text-white/60 text-sm">{{ activity.details }}</div>
              </div>
            </div>
            <div class="text-white/60 text-sm">
              {{ formatTime(activity.timestamp) }}
            </div>
          </div>

          <div v-if="activityLog.length === 0" class="text-center py-8 text-white/60">
            No recent activity
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { XMarkIcon } from '@heroicons/vue/24/outline'

definePageMeta({
  middleware: 'auth'
})

// Reactive data
const newsFetching = ref(false)
const pricesFetching = ref(false)
const newsResult = ref<any>(null)
const pricesResult = ref<any>(null)
const activityLog = ref<Array<{
  timestamp: Date
  action: string
  details: string
  type: 'success' | 'error' | 'info'
}>>([])

// Methods
const fetchPortfolioNews = async () => {
  newsFetching.value = true
  newsResult.value = null
  
  try {
    addActivity('Starting news fetch', 'Fetching latest news for portfolio securities', 'info')
    
    const result = await useFetchPortfolioNews()
    newsResult.value = result
    
    addActivity(
      'News fetch completed', 
      `Processed ${result.results?.processed || 0} securities, added ${result.results?.articles_added || 0} articles`,
      'success'
    )
  } catch (error) {
    console.error('Error fetching portfolio news:', error)
    newsResult.value = {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }
    
    addActivity('News fetch failed', newsResult.value.message, 'error')
  } finally {
    newsFetching.value = false
  }
}

const fetchSecurityPrices = async () => {
  pricesFetching.value = true
  pricesResult.value = null
  
  try {
    addActivity('Starting price update', 'Updating security prices from TwelveData', 'info')
    
    const result = await $fetch('/api/securities/update-prices', {
      method: 'POST'
    })
    
    pricesResult.value = result
    
    addActivity(
      'Price update completed',
      `Updated ${result.results?.updated || 0} securities, ${result.results?.errors || 0} errors`,
      'success'
    )
  } catch (error) {
    console.error('Error updating security prices:', error)
    pricesResult.value = {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }
    
    addActivity('Price update failed', pricesResult.value.message, 'error')
  } finally {
    pricesFetching.value = false
  }
}

const addActivity = (action: string, details: string, type: 'success' | 'error' | 'info') => {
  activityLog.value.unshift({
    timestamp: new Date(),
    action,
    details,
    type
  })
  
  // Keep only the last 10 activities
  if (activityLog.value.length > 10) {
    activityLog.value = activityLog.value.slice(0, 10)
  }
}

const formatTime = (timestamp: Date) => {
  return timestamp.toLocaleTimeString()
}

useHead({
  title: 'Data Sync Admin - PennyPilot'
})
</script>