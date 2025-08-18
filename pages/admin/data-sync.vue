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

      <!-- Job Status Section --><div class="card-dark mb-8">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-xl font-semibold text-white">Active Jobs</h2>
            <p class="text-sm text-white/70">Monitor and complete active batch jobs</p>
          </div>
          <div class="flex space-x-3">
            <button
              @click="refreshJobs"
              :disabled="jobsLoading"
              class="btn-secondary"
              :class="{ 'opacity-50 cursor-not-allowed': jobsLoading }"
            >
              <svg v-if="jobsLoading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ jobsLoading ? 'Loading...' : 'Refresh' }}
            </button>
            <button
              @click="checkAndCompleteJobs"
              :disabled="jobsChecking"
              class="btn-primary"
              :class="{ 'opacity-50 cursor-not-allowed': jobsChecking }"
            >
              <svg v-if="jobsChecking" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ jobsChecking ? 'Checking...' : 'Check & Complete Jobs' }}
            </button>
          </div>
        </div>

        <!-- Active Jobs List -->
        <div v-if="activeJobs.length > 0" class="space-y-3">
          <div
            v-for="job in activeJobs"
            :key="job.id"
            class="p-4 rounded-lg bg-white/5 border border-white/10"
          >
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <div class="flex items-center space-x-3">
                  <div class="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
                  <div>
                    <div class="text-white font-medium">{{ job.type.replace('_', ' ').toUpperCase() }}</div>
                    <div class="text-white/60 text-sm">
                      Created: {{ formatTime(new Date(job.created_at)) }}
                      <span v-if="job.external_id" class="ml-2">• Batch ID: {{ job.external_id.slice(-8) }}</span>
                    </div>
                  </div>
                </div>
                <div v-if="job.data" class="mt-2 text-sm text-white/70">
                  <span v-if="job.data.total_assessments">{{ job.data.total_assessments }} assessments</span>
                  <span v-if="job.data.status" class="ml-2">• Status: {{ job.data.status }}</span>
                  <span v-if="job.data.last_checked" class="ml-2">• Last checked: {{ formatTime(new Date(job.data.last_checked)) }}</span>
                </div>
              </div>
              <div class="ml-4">
                <button
                  @click="cancelJob(job.id)"
                  :disabled="jobsCancelling.has(job.id)"
                  class="btn-secondary text-sm px-3 py-1 text-red-400 border-red-400/50 hover:bg-red-500/10"
                  :class="{ 'opacity-50 cursor-not-allowed': jobsCancelling.has(job.id) }"
                >
                  <svg v-if="jobsCancelling.has(job.id)" class="animate-spin -ml-1 mr-1 h-3 w-3 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ jobsCancelling.has(job.id) ? 'Cancelling...' : 'Cancel' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8 text-white/60">
          No active jobs
        </div>

        <!-- Job Cancellation Results -->
        <div v-if="jobCancelResult" class="mt-4 p-4 rounded-lg border"
             :class="{
               'border-green-500/50 bg-green-500/10': jobCancelResult.success,
               'border-red-500/50 bg-red-500/10': !jobCancelResult.success
             }">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <div class="text-white font-medium mb-1">{{ jobCancelResult.message }}</div>
              <div v-if="jobCancelResult.job_type" class="text-sm text-white/70">
                Job Type: {{ jobCancelResult.job_type.replace('_', ' ').toUpperCase() }}
              </div>
              <div v-if="jobCancelResult.external_cancellation && !jobCancelResult.external_cancellation.success" 
                   class="mt-2 text-sm text-orange-400">
                External cancellation: {{ jobCancelResult.external_cancellation.error }}
              </div>
            </div>
            <button @click="jobCancelResult = null" class="text-white/60 hover:text-white">
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Job Check Results -->
        <div v-if="jobCheckResult" class="mt-6 p-4 rounded-lg border"
             :class="{
               'border-green-500/50 bg-green-500/10': jobCheckResult.success,
               'border-red-500/50 bg-red-500/10': !jobCheckResult.success
             }">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <div class="text-white font-medium mb-2">{{ jobCheckResult.message }}</div>
              <div v-if="jobCheckResult.results" class="grid grid-cols-3 gap-4">
                <div class="text-center">
                  <div class="text-white font-medium">{{ jobCheckResult.results.total_jobs }}</div>
                  <div class="text-white/60">Total</div>
                </div>
                <div class="text-center">
                  <div class="text-green-400 font-medium">{{ jobCheckResult.results.completed }}</div>
                  <div class="text-white/60">Completed</div>
                </div>
                <div class="text-center">
                  <div class="text-red-400 font-medium">{{ jobCheckResult.results.failed }}</div>
                  <div class="text-white/60">Failed</div>
                </div>
              </div>
            </div>
            <button @click="jobCheckResult = null" class="text-white/60 hover:text-white">
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <!-- Portfolio Value Computation Section -->
      <div class="card-dark mb-8">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-xl font-semibold text-white">Portfolio Value Computation</h2>
            <p class="text-sm text-white/70">Compute current and historical portfolio values with accurate security holdings</p>
          </div>
          <div class="flex items-center space-x-4">
            <button
              @click="updateCurrentValues"
              :disabled="currentValuesUpdating"
              class="btn-secondary"
              :class="{ 'opacity-50 cursor-not-allowed': currentValuesUpdating }"
            >
              <div v-if="currentValuesUpdating" class="flex items-center space-x-2">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Updating...</span>
              </div>
              <span v-else>Update Current Values</span>
            </button>
            <button
              @click="showHistoricalModal = true"
              :disabled="historicalValuesComputing"
              class="btn-primary"
              :class="{ 'opacity-50 cursor-not-allowed': historicalValuesComputing }"
            >
              <div v-if="historicalValuesComputing" class="flex items-center space-x-2">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Computing...</span>
              </div>
              <span v-else>Compute Historical Values</span>
            </button>
          </div>
        </div>

        <!-- Current Values Results -->
        <div v-if="currentValuesResult" class="mt-6 p-4 rounded-lg border"
             :class="{
               'border-green-500/50 bg-green-500/10': currentValuesResult.success,
               'border-red-500/50 bg-red-500/10': !currentValuesResult.success
             }">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <div class="text-white font-medium mb-2">{{ currentValuesResult.message }}</div>
              <div v-if="currentValuesResult.results" class="grid grid-cols-4 gap-4">
                <div class="text-center">
                  <div class="text-white font-medium">{{ currentValuesResult.results.total }}</div>
                  <div class="text-white/60">Total Portfolios</div>
                </div>
                <div class="text-center">
                  <div class="text-green-400 font-medium">{{ currentValuesResult.results.updated }}</div>
                  <div class="text-white/60">Updated</div>
                </div>
                <div class="text-center">
                  <div class="text-blue-400 font-medium">${{ currentValuesResult.results.totalValue?.toFixed(0) || 0 }}</div>
                  <div class="text-white/60">Total Value</div>
                </div>
                <div class="text-center">
                  <div class="text-red-400 font-medium">{{ currentValuesResult.results.errors }}</div>
                  <div class="text-white/60">Errors</div>
                </div>
              </div>
            </div>
            <button @click="currentValuesResult = null" class="text-white/60 hover:text-white">
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Historical Values Results -->
        <div v-if="historicalValuesResult" class="mt-6 p-4 rounded-lg border"
             :class="{
               'border-green-500/50 bg-green-500/10': historicalValuesResult.success,
               'border-red-500/50 bg-red-500/10': !historicalValuesResult.success
             }">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <div class="text-white font-medium mb-2">{{ historicalValuesResult.message }}</div>
              <div v-if="historicalValuesResult.results" class="grid grid-cols-5 gap-4">
                <div class="text-center">
                  <div class="text-white font-medium">{{ historicalValuesResult.results.processed }}</div>
                  <div class="text-white/60">Portfolios</div>
                </div>
                <div class="text-center">
                  <div class="text-green-400 font-medium">{{ historicalValuesResult.results.totalDays }}</div>
                  <div class="text-white/60">Days Processed</div>
                </div>
                <div class="text-center">
                  <div class="text-blue-400 font-medium">{{ historicalValuesResult.results.totalValues }}</div>
                  <div class="text-white/60">Values Computed</div>
                </div>
                <div class="text-center">
                  <div class="text-yellow-400 font-medium">{{ historicalValuesResult.results.processingTimeSeconds }}s</div>
                  <div class="text-white/60">Processing Time</div>
                </div>
                <div class="text-center">
                  <div class="text-red-400 font-medium">{{ historicalValuesResult.results.errors }}</div>
                  <div class="text-white/60">Errors</div>
                </div>
              </div>
            </div>
            <button @click="historicalValuesResult = null" class="text-white/60 hover:text-white">
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <!-- Portfolio Analysis Section -->
      <div class="card-dark mb-8">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-xl font-semibold text-white">Portfolio Analysis</h2>
            <p class="text-sm text-white/70">Generate comprehensive AI-powered portfolio analysis and recommendations</p>
          </div>
          <div class="flex items-center space-x-4">
            <button
              @click="generatePortfolioAnalysis"
              :disabled="portfolioAnalysisGenerating"
              class="btn-primary"
              :class="{ 'opacity-50 cursor-not-allowed': portfolioAnalysisGenerating }"
            >
              <div v-if="portfolioAnalysisGenerating" class="flex items-center space-x-2">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Analyzing...</span>
              </div>
              <span v-else>Generate Portfolio Analysis</span>
            </button>
          </div>
        </div>

        <!-- Portfolio Analysis Results -->
        <div v-if="portfolioAnalysisResult" class="mt-6 p-4 rounded-lg border"
             :class="{
               'border-green-500/50 bg-green-500/10': portfolioAnalysisResult.success,
               'border-red-500/50 bg-red-500/10': !portfolioAnalysisResult.success
             }">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <div class="text-white font-medium mb-2">{{ portfolioAnalysisResult.message }}</div>
              <div v-if="portfolioAnalysisResult.results" class="grid grid-cols-4 gap-4">
                <div class="text-center">
                  <div class="text-white font-medium">{{ portfolioAnalysisResult.results.total }}</div>
                  <div class="text-white/60">Total Portfolios</div>
                </div>
                <div class="text-center">
                  <div class="text-green-400 font-medium">{{ portfolioAnalysisResult.results.processed }}</div>
                  <div class="text-white/60">Analyzed</div>
                </div>
                <div class="text-center">
                  <div class="text-red-400 font-medium">{{ portfolioAnalysisResult.results.errors }}</div>
                  <div class="text-white/60">Errors</div>
                </div>
                <div class="text-center">
                  <div class="text-blue-400 font-medium">
                    {{ portfolioAnalysisResult.details ? 
                        (portfolioAnalysisResult.details.filter(d => d.status === 'success').reduce((avg, d) => avg + (d.rating || 0), 0) / 
                         Math.max(1, portfolioAnalysisResult.details.filter(d => d.status === 'success').length)).toFixed(1) : 'N/A' }}
                  </div>
                  <div class="text-white/60">Avg Rating</div>
                </div>
              </div>
              <!-- Detailed Results -->
              <div v-if="portfolioAnalysisResult.details && portfolioAnalysisResult.details.length > 0" class="mt-4">
                <h4 class="text-white font-medium mb-2">Portfolio Details:</h4>
                <div class="space-y-2">
                  <div v-for="detail in portfolioAnalysisResult.details" :key="detail.portfolioId" 
                       class="flex items-center justify-between text-sm">
                    <span class="text-white/80">{{ detail.portfolioName }}</span>
                    <div class="flex items-center space-x-3">
                      <span v-if="detail.status === 'success'" class="text-green-400">
                        ✓ Rating: {{ detail.rating }}/10 ({{ detail.actionsCount }} actions)
                      </span>
                      <span v-else-if="detail.status === 'skipped'" class="text-yellow-400">
                        ⚠ {{ detail.reason }}
                      </span>
                      <span v-else class="text-red-400">
                        ✗ {{ detail.error }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <button @click="portfolioAnalysisResult = null" class="text-white/60 hover:text-white">
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <!-- AI Assessments Section -->
      <div class="card-dark mb-8">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-xl font-semibold text-white">AI Security Assessments</h2>
            <p class="text-sm text-white/70">Generate AI-powered investment analysis for all portfolio securities</p>
          </div>
          <div class="flex items-center space-x-4">
            <!-- Processing Mode Toggle -->
            <div class="flex items-center space-x-2">
              <label class="text-sm text-white/70">Mode:</label>
              <select 
                v-model="assessmentMode"
                :disabled="assessmentsFetching"
                class="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm"
              >
                <option value="batch">Batch (24h, 50% cheaper)</option>
                <option value="immediate">Immediate (higher cost)</option>
              </select>
            </div>
            <button
              @click="generateAssessments"
              :disabled="assessmentsFetching"
              class="btn-primary"
              :class="{ 'opacity-50 cursor-not-allowed': assessmentsFetching }"
            >
              <div v-if="assessmentsFetching" class="flex items-center space-x-2">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>{{ assessmentMode === 'immediate' ? 'Processing...' : 'Submitting...' }}</span>
              </div>
              <span v-else>
                {{ assessmentMode === 'immediate' ? 'Generate Immediately' : 'Submit Batch Job' }}
              </span>
            </button>
          </div>
        </div>

        <!-- Assessment Results -->
        <div v-if="assessmentResult" class="mt-6 p-4 rounded-lg border"
             :class="{
               'border-green-500/50 bg-green-500/10': assessmentResult.success,
               'border-red-500/50 bg-red-500/10': !assessmentResult.success
             }">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <div class="text-white font-medium mb-2">{{ assessmentResult.message }}</div>
              <div v-if="assessmentResult.results" class="grid grid-cols-3 gap-4">
                <div class="text-center">
                  <div class="text-white font-medium">{{ assessmentResult.results.total }}</div>
                  <div class="text-white/60">Total Securities</div>
                </div>
                <div class="text-center">
                  <div class="text-green-400 font-medium">
                    {{ assessmentResult.results.processed || assessmentResult.results.submitted || 0 }}
                  </div>
                  <div class="text-white/60">
                    {{ assessmentResult.results.mode === 'immediate' ? 'Processed' : 'Submitted' }}
                  </div>
                </div>
                <div class="text-center">
                  <div class="text-red-400 font-medium">{{ assessmentResult.results.errors || 0 }}</div>
                  <div class="text-white/60">Errors</div>
                </div>
              </div>
              <div v-if="assessmentResult.results.mode === 'immediate' && assessmentResult.details" 
                   class="mt-3 text-xs text-white/60">
                Show detailed results: {{ assessmentResult.details.filter(d => d.status === 'success').length }} successful, 
                {{ assessmentResult.details.filter(d => d.status === 'error').length }} errors, 
                {{ assessmentResult.details.filter(d => d.status === 'skipped').length }} skipped
              </div>
            </div>
            <button @click="assessmentResult = null" class="text-white/60 hover:text-white">
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

    <!-- Historical Values Modal -->
    <div v-if="showHistoricalModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="card-dark rounded-lg shadow-xl max-w-lg w-full mx-4 p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-white">Historical Portfolio Values</h3>
          <button @click="showHistoricalModal = false" class="text-white/60 hover:text-white">
            <XMarkIcon class="w-5 h-5" />
          </button>
        </div>
        
        <form @submit.prevent="computeHistoricalValues" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-white mb-2">Start Date</label>
            <input
              v-model="historicalOptions.startDate"
              type="date"
              class="input-field w-full"
              :max="historicalOptions.endDate"
            />
            <p class="text-xs text-white/60 mt-1">Leave empty to use portfolio creation date</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-white mb-2">End Date</label>
            <input
              v-model="historicalOptions.endDate"
              type="date"
              class="input-field w-full"
              :min="historicalOptions.startDate"
              :max="today"
            />
            <p class="text-xs text-white/60 mt-1">Leave empty to use today's date</p>
          </div>

          <div>
            <label class="flex items-center space-x-2">
              <input
                v-model="historicalOptions.forceRecalculate"
                type="checkbox"
                class="rounded border-gray-300"
              />
              <span class="text-sm text-white">Force recalculate existing values</span>
            </label>
            <p class="text-xs text-white/60 mt-1">By default, only missing historical values are computed</p>
          </div>

          <div class="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              @click="showHistoricalModal = false"
              class="btn-secondary"
              :disabled="historicalValuesComputing"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="btn-primary"
              :disabled="historicalValuesComputing"
            >
              <div v-if="historicalValuesComputing" class="flex items-center space-x-2">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Computing...</span>
              </div>
              <span v-else>Start Computation</span>
            </button>
          </div>
        </form>
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
const assessmentsFetching = ref(false)
const jobsLoading = ref(false)
const jobsChecking = ref(false)
const jobsCancelling = ref(new Set<string>())
const currentValuesUpdating = ref(false)
const historicalValuesComputing = ref(false)
const showHistoricalModal = ref(false)
const portfolioAnalysisGenerating = ref(false)
const assessmentMode = ref<'batch' | 'immediate'>('batch')
const newsResult = ref<any>(null)
const pricesResult = ref<any>(null)
const assessmentResult = ref<any>(null)
const jobCheckResult = ref<any>(null)
const jobCancelResult = ref<any>(null)
const currentValuesResult = ref<any>(null)
const historicalValuesResult = ref<any>(null)
const portfolioAnalysisResult = ref<any>(null)
const activeJobs = ref<any[]>([])
const activityLog = ref<Array<{
  timestamp: Date
  action: string
  details: string
  type: 'success' | 'error' | 'info'
}>>([])

// Historical options
const today = new Date().toISOString().split('T')[0]
const historicalOptions = ref({
  startDate: '',
  endDate: today,
  forceRecalculate: false
})

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

const generateAssessments = async () => {
  assessmentsFetching.value = true
  assessmentResult.value = null
  
  try {
    const useBatching = assessmentMode.value === 'batch'
    const modeText = useBatching ? 'batch processing' : 'immediate processing'
    
    addActivity(
      'Starting AI assessments', 
      `Generating AI-powered analysis for portfolio securities using ${modeText}`, 
      'info'
    )
    
    const result = await useGenerateAIAssessments({ useBatching })
    assessmentResult.value = result
    
    if (useBatching) {
      addActivity(
        'AI batch job submitted', 
        `Submitted ${result.results?.submitted || 0} assessments for batch processing`,
        result.success ? 'success' : 'error'
      )
    } else {
      addActivity(
        'AI assessments completed', 
        `Processed ${result.results?.processed || 0} assessments immediately, ${result.results?.errors || 0} errors`,
        result.success ? 'success' : 'error'
      )
    }
  } catch (error) {
    console.error('Error generating AI assessments:', error)
    assessmentResult.value = {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      results: { total: 0, processed: 0, errors: 1 }
    }
    
    addActivity('AI assessments failed', assessmentResult.value.message, 'error')
  } finally {
    assessmentsFetching.value = false
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

const refreshJobs = async () => {
  jobsLoading.value = true
  
  try {
    const jobs = await useGetActiveJobs()
    activeJobs.value = jobs
    
    addActivity('Jobs refreshed', `Found ${jobs.length} active jobs`, 'info')
  } catch (error) {
    console.error('Error refreshing jobs:', error)
    addActivity('Job refresh failed', error instanceof Error ? error.message : 'Unknown error', 'error')
  } finally {
    jobsLoading.value = false
  }
}

const checkAndCompleteJobs = async () => {
  jobsChecking.value = true
  jobCheckResult.value = null
  
  try {
    addActivity('Starting job check', 'Checking active batch jobs for completion', 'info')
    
    const result = await useCheckAndCompleteJobs()
    jobCheckResult.value = result
    
    // Refresh the jobs list after checking
    await refreshJobs()
    
    addActivity(
      'Job check completed', 
      `${result.results?.completed || 0} jobs completed, ${result.results?.failed || 0} failed`,
      result.success ? 'success' : 'error'
    )
  } catch (error) {
    console.error('Error checking jobs:', error)
    jobCheckResult.value = {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      results: { total_jobs: 0, completed: 0, failed: 0 }
    }
    
    addActivity('Job check failed', jobCheckResult.value.message, 'error')
  } finally {
    jobsChecking.value = false
  }
}

const cancelJob = async (jobId: string) => {
  jobsCancelling.value.add(jobId)
  jobCancelResult.value = null
  
  try {
    addActivity('Cancelling job', `Attempting to cancel job ${jobId}`, 'info')
    
    const result = await useCancelJob(jobId)
    jobCancelResult.value = result
    
    // Refresh the jobs list after cancellation
    await refreshJobs()
    
    if (result.success) {
      addActivity(
        'Job cancelled', 
        `Successfully cancelled ${result.job_type} job`,
        'success'
      )
    } else {
      addActivity('Job cancellation failed', result.message, 'error')
    }
  } catch (error) {
    console.error('Error cancelling job:', error)
    jobCancelResult.value = {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }
    
    addActivity('Job cancellation failed', jobCancelResult.value.message, 'error')
  } finally {
    jobsCancelling.value.delete(jobId)
  }
}

const updateCurrentValues = async () => {
  currentValuesUpdating.value = true
  currentValuesResult.value = null
  
  try {
    addActivity('Starting current value update', 'Updating current portfolio values using latest security prices', 'info')
    
    const result = await $fetch('/api/portfolios/update-all-values', {
      method: 'POST'
    })
    
    currentValuesResult.value = result
    
    addActivity(
      'Current values updated', 
      `Updated ${result.results?.updated || 0} portfolios with total value of $${result.results?.totalValue?.toFixed(0) || 0}`,
      'success'
    )
  } catch (error) {
    console.error('Error updating current values:', error)
    currentValuesResult.value = {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }
    
    addActivity('Current value update failed', currentValuesResult.value.message, 'error')
  } finally {
    currentValuesUpdating.value = false
  }
}

const computeHistoricalValues = async () => {
  historicalValuesComputing.value = true
  historicalValuesResult.value = null
  
  try {
    const { startDate, endDate, forceRecalculate } = historicalOptions.value
    
    addActivity(
      'Starting historical computation', 
      `Computing historical portfolio values from ${startDate || 'portfolio creation'} to ${endDate || 'today'}`,
      'info'
    )
    
    const result = await $fetch('/api/portfolios/compute-historical-values', {
      method: 'POST',
      body: {
        startDate: startDate || null,
        endDate: endDate || null,
        forceRecalculate
      }
    })
    
    historicalValuesResult.value = result
    showHistoricalModal.value = false
    
    addActivity(
      'Historical computation completed', 
      `Computed ${result.results?.totalValues || 0} values across ${result.results?.processed || 0} portfolios in ${result.results?.processingTimeSeconds || 0}s`,
      result.success ? 'success' : 'error'
    )
  } catch (error) {
    console.error('Error computing historical values:', error)
    historicalValuesResult.value = {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }
    
    addActivity('Historical computation failed', historicalValuesResult.value.message, 'error')
  } finally {
    historicalValuesComputing.value = false
  }
}

const generatePortfolioAnalysis = async () => {
  portfolioAnalysisGenerating.value = true
  portfolioAnalysisResult.value = null
  
  try {
    addActivity('Starting portfolio analysis', 'Generating comprehensive AI-powered portfolio analysis for all portfolios', 'info')
    
    const result = await $fetch('/api/portfolios/generate-analysis', {
      method: 'POST'
    })
    
    portfolioAnalysisResult.value = result
    
    addActivity(
      'Portfolio analysis completed', 
      `Analyzed ${result.results?.processed || 0} portfolios with ${result.results?.errors || 0} errors`,
      result.success ? 'success' : 'error'
    )
  } catch (error) {
    console.error('Error generating portfolio analysis:', error)
    portfolioAnalysisResult.value = {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }
    
    addActivity('Portfolio analysis failed', portfolioAnalysisResult.value.message, 'error')
  } finally {
    portfolioAnalysisGenerating.value = false
  }
}

const formatTime = (timestamp: Date) => {
  return timestamp.toLocaleTimeString()
}

// Load active jobs on page mount
onMounted(async () => {
  await refreshJobs()
})

useHead({
  title: 'Data Sync Admin - PennyPilot'
})
</script>