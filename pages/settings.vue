<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold gradient-text">Settings</h1>
      <p class="text-secondary-600 mt-2">Customize your StockAdvisor experience</p>
    </div>

    <div class="grid gap-6">
      <!-- Notification Preferences -->
      <div class="card">
        <h2 class="text-xl font-semibold text-secondary-900 mb-6">Notifications</h2>
        
        <div class="space-y-6">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-medium text-secondary-900">Email Notifications</h3>
              <p class="text-sm text-secondary-600">Receive email updates about your portfolio</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                v-model="settings.emailNotifications"
                type="checkbox"
                class="sr-only peer"
                @change="updateSettings"
              />
              <div class="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
          
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-medium text-secondary-900">AI Recommendations</h3>
              <p class="text-sm text-secondary-600">Get notified when AI suggests new trades</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                v-model="settings.aiRecommendations"
                type="checkbox"
                class="sr-only peer"
                @change="updateSettings"
              />
              <div class="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
          
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-medium text-secondary-900">Market Alerts</h3>
              <p class="text-sm text-secondary-600">Alerts for significant market movements</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                v-model="settings.marketAlerts"
                type="checkbox"
                class="sr-only peer"
                @change="updateSettings"
              />
              <div class="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      </div>

      <!-- Risk Tolerance -->
      <div class="card">
        <h2 class="text-xl font-semibold text-secondary-900 mb-6">Investment Preferences</h2>
        
        <div class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-2">Risk Tolerance</label>
            <select
              v-model="settings.riskTolerance"
              @change="updateSettings"
              class="input-field"
            >
              <option value="conservative">Conservative - Lower risk, stable returns</option>
              <option value="moderate">Moderate - Balanced risk and growth</option>
              <option value="aggressive">Aggressive - Higher risk, higher potential returns</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-2">Investment Timeline</label>
            <select
              v-model="settings.investmentTimeline"
              @change="updateSettings"
              class="input-field"
            >
              <option value="short">Short Term (< 1 year)</option>
              <option value="medium">Medium Term (1-5 years)</option>
              <option value="long">Long Term (5+ years)</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-2">Preferred Asset Types</label>
            <div class="space-y-2">
              <label v-for="assetType in assetTypes" :key="assetType.value" class="flex items-center">
                <input
                  v-model="settings.preferredAssets"
                  :value="assetType.value"
                  type="checkbox"
                  class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                  @change="updateSettings"
                />
                <span class="ml-2 text-sm text-secondary-700">{{ assetType.label }}</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Privacy & Security -->
      <div class="card">
        <h2 class="text-xl font-semibold text-secondary-900 mb-6">Privacy & Security</h2>
        
        <div class="space-y-6">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-medium text-secondary-900">Two-Factor Authentication</h3>
              <p class="text-sm text-secondary-600">Add an extra layer of security to your account</p>
            </div>
            <button class="btn-secondary">
              Enable 2FA
            </button>
          </div>
          
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-medium text-secondary-900">Data Export</h3>
              <p class="text-sm text-secondary-600">Download your portfolio data</p>
            </div>
            <button @click="exportData" class="btn-secondary">
              Export Data
            </button>
          </div>
        </div>
      </div>

      <!-- Save Button -->
      <div class="flex justify-end">
        <button
          @click="saveSettings"
          :disabled="loading"
          class="btn-primary"
        >
          <span v-if="loading" class="flex items-center">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Saving...
          </span>
          <span v-else>Save Settings</span>
        </button>
      </div>
    </div>

    <!-- Success/Error Messages -->
    <div v-if="message" class="fixed bottom-4 right-4 z-50">
      <div
        :class="[
          'p-4 rounded-lg shadow-strong',
          message.type === 'success' ? 'bg-accent-50 text-accent-800 border border-accent-200' :
          'bg-danger-50 text-danger-800 border border-danger-200'
        ]"
      >
        {{ message.text }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const loading = ref(false)
const message = ref<{ type: 'success' | 'error', text: string } | null>(null)

const settings = ref({
  emailNotifications: true,
  aiRecommendations: true,
  marketAlerts: false,
  riskTolerance: 'moderate',
  investmentTimeline: 'medium',
  preferredAssets: ['stocks', 'etfs']
})

const assetTypes = [
  { value: 'stocks', label: 'Individual Stocks' },
  { value: 'etfs', label: 'Exchange-Traded Funds (ETFs)' },
  { value: 'crypto', label: 'Cryptocurrency' },
  { value: 'bonds', label: 'Bonds' },
  { value: 'commodities', label: 'Commodities' }
]

const updateSettings = () => {
  // Auto-save on change
  saveSettings()
}

const saveSettings = async () => {
  loading.value = true
  
  try {
    // This would typically save to a user_settings table
    // For now, we'll just simulate the API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    showMessage('success', 'Settings saved successfully')
  } catch (error) {
    console.error('Error saving settings:', error)
    showMessage('error', 'Failed to save settings')
  } finally {
    loading.value = false
  }
}

const exportData = async () => {
  try {
    // This would typically call an API endpoint to generate and download data export
    showMessage('success', 'Data export will be emailed to you shortly')
  } catch (error) {
    console.error('Error exporting data:', error)
    showMessage('error', 'Failed to export data')
  }
}

const showMessage = (type: 'success' | 'error', text: string) => {
  message.value = { type, text }
  setTimeout(() => {
    message.value = null
  }, 5000)
}

// Load user settings on mount
onMounted(() => {
  // This would typically load settings from the database
  // For now, we'll use default values
})

useHead({
  title: 'Settings - StockAdvisor'
})
</script>