import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const supabase = await serverSupabaseServiceRole<Database>(event)

  try {
    const body = await readBody(event)
    
    if (!body.jobId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Job ID is required'
      })
    }

    // Get the job details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', body.jobId)
      .eq('active', true) // Only allow cancelling active jobs
      .single()

    if (jobError) {
      console.error('Error fetching job:', jobError)
      throw createError({
        statusCode: 404,
        statusMessage: 'Job not found or already inactive'
      })
    }

    if (!job) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Job not found or already inactive'
      })
    }

    console.log(`Cancelling job ${job.id} of type ${job.type}`)

    // Cancel the external job based on job type
    const cancellationResult = await cancelExternalJob(job, config)

    // Mark the job as cancelled in the database
    const { error: updateError } = await supabase
      .from('jobs')
      .update({
        active: false,
        data: {
          ...job.data as any,
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: 'Manual cancellation',
          external_cancellation_result: cancellationResult
        }
      })
      .eq('id', job.id)

    if (updateError) {
      console.error('Error updating job status:', updateError)
      // Don't throw error here - external cancellation may have succeeded
    }

    return {
      success: true,
      message: `Job ${job.id} has been cancelled`,
      job_id: job.id,
      job_type: job.type,
      external_cancellation: cancellationResult
    }

  } catch (error) {
    console.error('Job cancellation failed:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to cancel job'
    })
  }
})

async function cancelExternalJob(job: any, config: any) {
  switch (job.type) {
    case 'security_analysis':
      return await cancelOpenAIBatchJob(job, config)
    
    default:
      console.log(`No specific cancellation handler for job type: ${job.type}`)
      return {
        success: true,
        message: 'Job marked as cancelled (no external cancellation required)',
        type: 'internal_only'
      }
  }
}

async function cancelOpenAIBatchJob(job: any, config: any) {
  try {
    if (!config.openaiApiKey) {
      return {
        success: false,
        error: 'OpenAI API key not configured'
      }
    }

    if (!job.external_id) {
      return {
        success: false,
        error: 'No OpenAI batch ID found in job'
      }
    }

    console.log(`Cancelling OpenAI batch: ${job.external_id}`)

    // Cancel the OpenAI batch job
    const response = await fetch(`https://api.openai.com/v1/batches/${job.external_id}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.openaiApiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`OpenAI batch cancellation error: ${response.status} ${response.statusText}`, errorText)
      
      // Check if batch is already completed/cancelled
      if (response.status === 400) {
        return {
          success: false,
          error: `Batch cannot be cancelled (may be completed or already cancelled): ${errorText}`,
          http_status: response.status
        }
      }

      return {
        success: false,
        error: `Failed to cancel OpenAI batch: ${response.status} ${response.statusText}`,
        http_status: response.status
      }
    }

    const result = await response.json()
    console.log(`OpenAI batch cancellation successful: ${job.external_id}`, result)

    return {
      success: true,
      message: 'OpenAI batch job cancelled successfully',
      batch_id: job.external_id,
      openai_response: result
    }

  } catch (error) {
    console.error('Error cancelling OpenAI batch job:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error cancelling OpenAI batch'
    }
  }
}