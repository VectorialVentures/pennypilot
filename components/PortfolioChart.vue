<template>
  <div class="card">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-semibold text-secondary-900">Portfolio Performance</h2>
        <p class="text-sm text-secondary-600">Historical value over time</p>
      </div>
      <div class="flex space-x-2">
        <button
          v-for="period in periods"
          :key="period.value"
          @click="selectedPeriod = period.value"
          :class="[
            'px-3 py-1 text-xs font-medium rounded-md transition-colors duration-200',
            selectedPeriod === period.value
              ? 'bg-primary-600 text-white'
              : 'text-secondary-600 hover:text-primary-600 hover:bg-primary-50'
          ]"
        >
          {{ period.label }}
        </button>
      </div>
    </div>

    <div class="relative">
      <canvas
        ref="chartCanvas"
        class="w-full"
        style="max-height: 400px;"
      ></canvas>
      
      <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
        <div class="flex items-center space-x-2">
          <svg class="animate-spin h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span class="text-sm text-secondary-600">Loading chart...</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface ChartDataPoint {
  date: string
  value: number
}

const props = defineProps<{
  portfolioId?: string
}>()

const chartCanvas = ref<HTMLCanvasElement>()
const loading = ref(false)
const selectedPeriod = ref('1M')
let chartInstance: ChartJS<'line'> | null = null

const periods = [
  { label: '1W', value: '1W' },
  { label: '1M', value: '1M' },
  { label: '3M', value: '3M' },
  { label: '6M', value: '6M' },
  { label: '1Y', value: '1Y' },
  { label: 'ALL', value: 'ALL' }
]

// Mock data generator for demonstration
const generateMockData = (period: string): ChartDataPoint[] => {
  const now = new Date()
  const data: ChartDataPoint[] = []
  let days: number
  
  switch (period) {
    case '1W': days = 7; break
    case '1M': days = 30; break
    case '3M': days = 90; break
    case '6M': days = 180; break
    case '1Y': days = 365; break
    default: days = 365; break
  }
  
  let baseValue = 50000
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    
    // Simulate some market volatility
    const volatility = (Math.random() - 0.5) * 0.02
    const trend = 0.0002 // Small upward trend
    baseValue = baseValue * (1 + trend + volatility)
    
    data.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(baseValue)
    })
  }
  
  return data
}

const updateChart = async () => {
  loading.value = true
  
  try {
    // In a real app, this would fetch data from your API
    const data = generateMockData(selectedPeriod.value)
    
    if (chartInstance) {
      chartInstance.destroy()
    }
    
    if (!chartCanvas.value) return
    
    const ctx = chartCanvas.value.getContext('2d')
    if (!ctx) return
    
    chartInstance = new ChartJS(ctx, {
      type: 'line',
      data: {
        labels: data.map(d => {
          const date = new Date(d.date)
          return selectedPeriod.value === '1W' || selectedPeriod.value === '1M'
            ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
        }),
        datasets: [
          {
            label: 'Portfolio Value',
            data: data.map(d => d.value),
            borderColor: 'rgb(14, 165, 233)',
            backgroundColor: 'rgba(14, 165, 233, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: 'rgb(14, 165, 233)',
            pointHoverBorderColor: 'white',
            pointHoverBorderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              title: (context) => {
                const date = new Date(data[context[0].dataIndex].date)
                return date.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })
              },
              label: (context) => {
                const value = context.parsed.y
                return `Portfolio Value: $${value.toLocaleString()}`
              }
            }
          }
        },
        scales: {
          x: {
            display: true,
            grid: {
              display: false
            },
            border: {
              display: false
            },
            ticks: {
              color: 'rgb(115, 115, 115)',
              font: {
                size: 12
              }
            }
          },
          y: {
            display: true,
            position: 'left',
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            border: {
              display: false
            },
            ticks: {
              color: 'rgb(115, 115, 115)',
              font: {
                size: 12
              },
              callback: function(value) {
                return '$' + (value as number).toLocaleString()
              }
            }
          }
        }
      }
    })
  } catch (error) {
    console.error('Error updating chart:', error)
  } finally {
    loading.value = false
  }
}

watch(selectedPeriod, updateChart)

onMounted(() => {
  updateChart()
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy()
  }
})
</script>