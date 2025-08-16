<template>
  <div class="relative">
    <canvas
      ref="chartCanvas"
      class="w-full"
      style="max-height: 400px;"
    ></canvas>
    
    <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-background-900/80 rounded-lg">
      <div class="flex items-center space-x-2">
        <svg class="animate-spin h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-sm text-white/60">Loading chart...</span>
      </div>
    </div>

    <div v-if="!loading && !hasData" class="absolute inset-0 flex items-center justify-center">
      <div class="text-center">
        <ChartBarIcon class="w-12 h-12 text-white/40 mx-auto mb-4" />
        <h4 class="text-lg font-medium text-white mb-2">No price data</h4>
        <p class="text-white/70">No historical price data available for this security.</p>
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
import { ChartBarIcon } from '@heroicons/vue/24/outline'

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
  price: number
}

const props = defineProps<{
  securityId: string
  symbol: string
  period: string
}>()

const supabase = useSupabaseClient()
const chartCanvas = ref<HTMLCanvasElement>()
const loading = ref(false)
const hasData = ref(true)
let chartInstance: ChartJS<'line'> | null = null

// Fetch security price data for chart
const fetchSecurityPrices = async (period: string): Promise<ChartDataPoint[]> => {
  try {
    // Calculate date range based on period
    const now = new Date()
    let startDate = new Date()
    
    switch (period) {
      case '1W': startDate.setDate(now.getDate() - 7); break
      case '1M': startDate.setMonth(now.getMonth() - 1); break
      case '3M': startDate.setMonth(now.getMonth() - 3); break
      case '6M': startDate.setMonth(now.getMonth() - 6); break
      case '1Y': startDate.setFullYear(now.getFullYear() - 1); break
      default: startDate.setFullYear(now.getFullYear() - 5); break // ALL
    }

    const { data, error } = await supabase
      .from('security_prices')
      .select('date, price')
      .eq('security_id', props.securityId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true })

    if (error) throw error

    const chartData: ChartDataPoint[] = (data || [])
      .filter(entry => entry.price !== null)
      .map(entry => ({
        date: entry.date,
        price: entry.price || 0
      }))

    return chartData
  } catch (error) {
    console.error('Error fetching security prices:', error)
    return []
  }
}

const updateChart = async () => {
  loading.value = true
  hasData.value = true
  
  try {
    // Fetch real security price data
    const data = await fetchSecurityPrices(props.period)
    
    if (data.length === 0) {
      hasData.value = false
      loading.value = false
      return
    }
    
    if (chartInstance) {
      chartInstance.destroy()
    }
    
    if (!chartCanvas.value) return
    
    const ctx = chartCanvas.value.getContext('2d')
    if (!ctx) return

    // Calculate price change color
    const firstPrice = data[0]?.price || 0
    const lastPrice = data[data.length - 1]?.price || 0
    const priceChange = lastPrice - firstPrice
    const isPositive = priceChange >= 0
    
    const lineColor = isPositive ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'
    const fillColor = isPositive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'
    
    chartInstance = new ChartJS(ctx, {
      type: 'line',
      data: {
        labels: data.map(d => {
          const date = new Date(d.date)
          return props.period === '1W' || props.period === '1M'
            ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
        }),
        datasets: [
          {
            label: `${props.symbol} Price`,
            data: data.map(d => d.price),
            borderColor: lineColor,
            backgroundColor: fillColor,
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: lineColor,
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
                return `${props.symbol}: $${value.toFixed(2)}`
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
              color: 'rgb(156, 163, 175)',
              font: {
                size: 12
              }
            }
          },
          y: {
            display: true,
            position: 'left',
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            border: {
              display: false
            },
            ticks: {
              color: 'rgb(156, 163, 175)',
              font: {
                size: 12
              },
              callback: function(value) {
                return '$' + (value as number).toFixed(2)
              }
            }
          }
        }
      }
    })
  } catch (error) {
    console.error('Error updating chart:', error)
    hasData.value = false
  } finally {
    loading.value = false
  }
}

watch(() => props.period, updateChart)

onMounted(() => {
  updateChart()
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy()
  }
})
</script>