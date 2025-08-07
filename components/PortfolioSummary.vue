<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <!-- Total Value -->
    <div class="card text-center">
      <div class="text-sm font-medium text-secondary-600 mb-2">Total Portfolio Value</div>
      <div class="text-3xl font-bold gradient-text">{{ formatCurrency(totalValue) }}</div>
      <div class="text-sm text-secondary-500 mt-1">
        Updated {{ lastUpdated }}
      </div>
    </div>

    <!-- Total Gain/Loss -->
    <div class="card text-center">
      <div class="text-sm font-medium text-secondary-600 mb-2">Total Gain/Loss</div>
      <div 
        :class="[
          'text-3xl font-bold',
          totalGainLoss >= 0 ? 'text-accent-600' : 'text-danger-600'
        ]"
      >
        {{ formatCurrency(totalGainLoss, true) }}
      </div>
      <div 
        :class="[
          'text-sm font-medium mt-1',
          totalGainLoss >= 0 ? 'text-accent-600' : 'text-danger-600'
        ]"
      >
        {{ formatPercentage(totalGainLossPercentage) }}
      </div>
    </div>

    <!-- Number of Positions -->
    <div class="card text-center">
      <div class="text-sm font-medium text-secondary-600 mb-2">Active Positions</div>
      <div class="text-3xl font-bold text-secondary-900">{{ numberOfPositions }}</div>
      <div class="text-sm text-secondary-500 mt-1">
        Across {{ numberOfPortfolios }} portfolio{{ numberOfPortfolios !== 1 ? 's' : '' }}
      </div>
    </div>

    <!-- Performance Score -->
    <div class="card text-center">
      <div class="text-sm font-medium text-secondary-600 mb-2">AI Performance Score</div>
      <div class="text-3xl font-bold text-primary-600">{{ performanceScore }}/100</div>
      <div class="w-full bg-secondary-200 rounded-full h-2 mt-3">
        <div 
          class="bg-gradient-to-r from-primary-600 to-accent-600 h-2 rounded-full transition-all duration-500"
          :style="{ width: `${performanceScore}%` }"
        ></div>
      </div>
    </div>
  </div>

  <!-- Quick Actions -->
  <div class="card mb-8">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
      <div>
        <h3 class="text-lg font-semibold text-secondary-900">Quick Actions</h3>
        <p class="text-sm text-secondary-600">Manage your portfolio efficiently</p>
      </div>
      <div class="flex space-x-3 mt-4 sm:mt-0">
        <button @click="$emit('add-asset')" class="btn-primary">
          <PlusIcon class="w-4 h-4 mr-2" />
          Add Asset
        </button>
        <button @click="$emit('rebalance')" class="btn-secondary">
          <ArrowsUpDownIcon class="w-4 h-4 mr-2" />
          Rebalance
        </button>
      </div>
    </div>
    
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <button 
        @click="$emit('view-analytics')"
        class="flex items-center justify-center p-3 bg-secondary-50 hover:bg-secondary-100 rounded-lg transition-colors duration-200"
      >
        <ChartBarIcon class="w-5 h-5 text-secondary-600 mr-2" />
        <span class="text-sm font-medium text-secondary-700">Analytics</span>
      </button>
      
      <button 
        @click="$emit('view-recommendations')"
        class="flex items-center justify-center p-3 bg-secondary-50 hover:bg-secondary-100 rounded-lg transition-colors duration-200"
      >
        <LightBulbIcon class="w-5 h-5 text-secondary-600 mr-2" />
        <span class="text-sm font-medium text-secondary-700">AI Insights</span>
      </button>
      
      <button 
        @click="$emit('export-data')"
        class="flex items-center justify-center p-3 bg-secondary-50 hover:bg-secondary-100 rounded-lg transition-colors duration-200"
      >
        <ArrowDownTrayIcon class="w-5 h-5 text-secondary-600 mr-2" />
        <span class="text-sm font-medium text-secondary-700">Export</span>
      </button>
      
      <button 
        @click="$emit('view-reports')"
        class="flex items-center justify-center p-3 bg-secondary-50 hover:bg-secondary-100 rounded-lg transition-colors duration-200"
      >
        <DocumentTextIcon class="w-5 h-5 text-secondary-600 mr-2" />
        <span class="text-sm font-medium text-secondary-700">Reports</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  PlusIcon,
  ArrowsUpDownIcon,
  ChartBarIcon,
  LightBulbIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon
} from '@heroicons/vue/24/outline'

interface Props {
  totalValue: number
  totalGainLoss: number
  totalGainLossPercentage: number
  numberOfPositions: number
  numberOfPortfolios: number
  performanceScore: number
}

const props = defineProps<Props>()

defineEmits<{
  'add-asset': []
  'rebalance': []
  'view-analytics': []
  'view-recommendations': []
  'export-data': []
  'view-reports': []
}>()

const lastUpdated = computed(() => {
  return new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
})

const formatCurrency = (amount: number, showSign: boolean = false): string => {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Math.abs(amount))

  if (showSign && amount !== 0) {
    return amount >= 0 ? `+${formatted}` : `-${formatted}`
  }
  
  return formatted
}

const formatPercentage = (percentage: number): string => {
  const sign = percentage >= 0 ? '+' : ''
  return `${sign}${percentage.toFixed(2)}%`
}
</script>