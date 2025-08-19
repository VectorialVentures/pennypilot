import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database'
import { 
  getBatchStatus, 
  downloadBatchResults, 
  parseOpenAIResponse, 
  validateAssessmentResponse 
} from '~/server/utils/OpenAIService'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const supabase = await serverSupabaseServiceRole<Database>(event)

  // Check if OpenAI API key is configured
  if (!config.openaiApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'OpenAI API key not configured'
    })
  }

  try {
    console.log('Checking active batch jobs...')

    // Get all active security analysis jobs
    const { data: activeJobs, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .eq('type', 'security_analysis')
      .eq('active', true)

    if (jobsError) {
      console.error('Error fetching active jobs:', jobsError)
      throw jobsError
    }

    if (!activeJobs || activeJobs.length === 0) {
      return {
        success: true,
        message: 'No active batch jobs found',
        processed: 0
      }
    }

    console.log(`Found ${activeJobs.length} active batch jobs`)

    let completedJobs = 0
    let failedJobs = 0
    const results = []

    for (const job of activeJobs) {
      if (!job.external_id) {
        console.log(`Skipping job ${job.id} - no external_id (batch_id)`)
        continue
      }

      try {
        // Check batch status with OpenAI
        const batchStatus = await getBatchStatus(job.external_id, config.openaiApiKey)
        
        if (!batchStatus) {
          console.error(`Failed to get batch status for job ${job.id}`)
          failedJobs++
          continue
        }

        // Update job data with current status
        await supabase
          .from('jobs')
          .update({
            data: {
              ...job.data as any,
              status: batchStatus.status,
              last_checked: new Date().toISOString()
            }
          })
          .eq('id', job.id)

        if (batchStatus.status === 'completed') {
          console.log(`Batch job ${job.id} completed, processing results...`)
          
          // Get and process results
          const processResult = await processBatchResults(job, batchStatus, config.openaiApiKey, supabase)
          
          if (processResult.success) {
            // Mark job as inactive
            await supabase
              .from('jobs')
              .update({
                active: false,
                data: {
                  ...job.data as any,
                  status: 'completed',
                  completed_at: new Date().toISOString(),
                  assessments_created: processResult.assessments_created,
                  errors_encountered: processResult.errors_encountered || 0,
                  error_file_processed: processResult.error_file_processed || false
                }
              })
              .eq('id', job.id)

            completedJobs++
            results.push({
              job_id: job.id,
              status: 'completed',
              assessments_created: processResult.assessments_created,
              errors_encountered: processResult.errors_encountered || 0
            })
          } else {
            failedJobs++
            results.push({
              job_id: job.id,
              status: 'failed',
              error: processResult.error
            })
          }
        } else if (batchStatus.status === 'failed' || batchStatus.status === 'cancelled') {
          console.log(`Batch job ${job.id} failed or cancelled`)
          
          // Mark job as inactive
          await supabase
            .from('jobs')
            .update({
              active: false,
              data: {
                ...job.data as any,
                status: batchStatus.status,
                completed_at: new Date().toISOString(),
                error: batchStatus.error || 'Job failed or was cancelled'
              }
            })
            .eq('id', job.id)

          failedJobs++
          results.push({
            job_id: job.id,
            status: batchStatus.status,
            error: batchStatus.error
          })
        } else {
          results.push({
            job_id: job.id,
            status: batchStatus.status
          })
        }

      } catch (error) {
        console.error(`Error processing job ${job.id}:`, error)
        failedJobs++
        results.push({
          job_id: job.id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return {
      success: true,
      message: `Processed ${activeJobs.length} jobs: ${completedJobs} completed, ${failedJobs} failed`,
      results: {
        total_jobs: activeJobs.length,
        completed: completedJobs,
        failed: failedJobs,
        details: results
      }
    }

  } catch (error) {
    console.error('Job checking process failed:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to check batch jobs'
    })
  }
})

// checkBatchStatus function moved to OpenAI service

async function processBatchResults(job: any, batchStatus: any, openaiApiKey: string, supabase: any) {
  try {
    if (!batchStatus.output_file_id) {
      return {
        success: false,
        error: 'No output file ID in batch result'
      }
    }

    // Download the results file using the service
    const resultsText = await downloadBatchResults(batchStatus.output_file_id, openaiApiKey)
    
    if (!resultsText) {
      return {
        success: false,
        error: 'Failed to download batch results'
      }
    }
    const resultLines = resultsText.trim().split('\n')
    
    let assessmentsCreated = 0
    let errorsEncountered = 0
    const jobData = job.data as any
    
    // Create lookup map using the stored security metadata
    const securityMap = new Map()
    if (jobData.security_metadata) {
      jobData.security_metadata.forEach((meta: any) => {
        securityMap.set(meta.custom_id, meta)
      })
    }

    // Also handle error file if present
    let errorResults = []
    if (batchStatus.error_file_id) {
      try {
        const errorText = await downloadBatchResults(batchStatus.error_file_id, openaiApiKey)
        if (errorText) {
          errorResults = errorText.trim().split('\n').filter(line => line.trim())
          console.log(`Found ${errorResults.length} errors in batch`)
        }
      } catch (errorFetchError) {
        console.error('Failed to fetch error file:', errorFetchError)
      }
    }

    for (const line of resultLines) {
      try {
        const result = JSON.parse(line)
        
        if (result.response?.body?.choices?.[0]?.message?.content) {
          const content = result.response.body.choices[0].message.content
          const securityInfo = securityMap.get(result.custom_id)
          
          if (securityInfo) {
            // Parse and validate the response using the service
            const parsedResponse = parseOpenAIResponse(content, securityInfo.symbol)
            
            if (!parsedResponse) {
              errorsEncountered++
              continue
            }
            
            const validatedAssessment = validateAssessmentResponse(parsedResponse, securityInfo.symbol)
            
            if (!validatedAssessment) {
              errorsEncountered++
              continue
            }

            // Check for existing assessment today to prevent duplicates
            const today = new Date().toISOString().split('T')[0]
            const { data: existingAssessment } = await supabase
              .from('security_analysis')
              .select('id')
              .eq('security_id', securityInfo.security_id)
              .gte('created_at', today + 'T00:00:00.000Z')
              .lt('created_at', today + 'T23:59:59.999Z')
              .single()

            if (existingAssessment) {
              console.log(`Assessment already exists for ${securityInfo.symbol} today, skipping`)
              continue
            }

            // Insert into security_analysis table
            const { error: insertError } = await supabase
              .from('security_analysis')
              .insert({
                security_id: securityInfo.security_id,
                title: validatedAssessment.title,
                assessment: validatedAssessment.analysis,
                recommendation: validatedAssessment.recommendation
              })

            if (!insertError) {
              assessmentsCreated++
              console.log(`Created assessment for ${securityInfo.symbol}`)
            } else {
              console.error(`Error inserting assessment for ${securityInfo.symbol}:`, insertError)
              errorsEncountered++
            }
          } else {
            console.error(`No security metadata found for custom_id: ${result.custom_id}`)
            errorsEncountered++
          }
        } else if (result.error) {
          // Handle individual request errors
          const securityInfo = securityMap.get(result.custom_id)
          console.error(`Request error for ${securityInfo?.symbol || result.custom_id}:`, result.error)
          errorsEncountered++
        }
      } catch (lineError) {
        console.error('Error processing result line:', lineError)
        errorsEncountered++
      }
    }

    return {
      success: true,
      assessments_created: assessmentsCreated,
      errors_encountered: errorsEncountered,
      error_file_processed: errorResults.length > 0
    }

  } catch (error) {
    console.error('Error processing batch results:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}