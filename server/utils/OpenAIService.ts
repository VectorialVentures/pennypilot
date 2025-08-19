/**
 * OpenAI Service - Reusable utilities for OpenAI API interactions
 * Handles both immediate and batch processing with consistent request formatting
 */

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface JSONSchema {
  name: string
  schema: {
    type: 'object'
    properties: Record<string, unknown>
    required: string[]
    additionalProperties: boolean
  }
}

export interface OpenAIRequestOptions {
  model: string
  messages: OpenAIMessage[]
  temperature?: number
  max_tokens?: number
  json_schema?: JSONSchema
}

export interface BatchRequestOptions extends OpenAIRequestOptions {
  custom_id: string
}

export interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

export interface BatchResult {
  batch_id: string
  file_id: string
  status: string
}

/**
 * Creates a standardized OpenAI request configuration
 * Can be used for both immediate API calls and batch processing
 */
export function createOpenAIRequest(options: OpenAIRequestOptions) {
  const {
    model,
    messages,
    temperature = 0.7,
    max_tokens = 1000,
    json_schema
  } = options

  const requestBody: Record<string, unknown> = {
    model,
    messages,
    temperature,
    max_tokens
  }

  // Add structured JSON response format if schema provided
  if (json_schema) {
    requestBody.response_format = {
      type: "json_schema",
      json_schema
    }
  }

  return requestBody
}

/**
 * Creates a batch request for OpenAI Batch API
 * Note: Batch API doesn't support response_format yet, so we use prompt-based JSON formatting
 */
export function createBatchRequest(options: BatchRequestOptions) {
  const {
    custom_id,
    model,
    messages,
    temperature = 0.7,
    max_tokens = 1000,
    json_schema
  } = options

  // For batch requests, we need to modify the prompt to request JSON format
  // since response_format is not supported in Batch API yet
  const modifiedMessages = [...messages]
  
  if (json_schema && modifiedMessages.length > 0) {
    const lastMessage = modifiedMessages[modifiedMessages.length - 1]
    if (lastMessage.role === 'user') {
      // Add JSON formatting instruction to the user message
      const schemaExample = generateSchemaExample(json_schema)
      lastMessage.content += `\n\nFormat your response as JSON:\n${schemaExample}`
    }
    
    // Update system message to emphasize JSON formatting
    if (modifiedMessages[0]?.role === 'system') {
      modifiedMessages[0].content += ' Always respond with valid JSON matching the requested format.'
    }
  }

  return {
    custom_id,
    method: "POST",
    url: "/v1/chat/completions",
    body: {
      model,
      messages: modifiedMessages,
      temperature,
      max_tokens
    }
  }
}

/**
 * Makes an immediate call to OpenAI API
 */
export async function callOpenAI(
  options: OpenAIRequestOptions, 
  apiKey: string
): Promise<OpenAIResponse | null> {
  try {
    const requestBody = createOpenAIRequest(options)

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      console.error(`OpenAI API error: ${response.status} ${response.statusText}`)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Error calling OpenAI API:', error)
    return null
  }
}

/**
 * Submits a batch of requests to OpenAI Batch API
 */
export async function submitBatch(
  requests: BatchRequestOptions[], 
  apiKey: string
): Promise<BatchResult | null> {
  try {
    // Convert requests to batch format
    const batchRequests = requests.map(createBatchRequest)
    
    // Create the batch file content
    const batchContent = batchRequests.map(req => JSON.stringify(req)).join('\n')
    
    // Upload batch file to OpenAI
    const fileResponse = await fetch('https://api.openai.com/v1/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: (() => {
        const formData = new FormData()
        formData.append('purpose', 'batch')
        formData.append('file', new Blob([batchContent], { type: 'application/jsonl' }), 'batch_requests.jsonl')
        return formData
      })()
    })

    if (!fileResponse.ok) {
      console.error(`OpenAI file upload error: ${fileResponse.status} ${fileResponse.statusText}`)
      return null
    }

    const fileResult = await fileResponse.json()
    console.log(`Uploaded batch file: ${fileResult.id}`)

    // Create batch job
    const batchResponse = await fetch('https://api.openai.com/v1/batches', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input_file_id: fileResult.id,
        endpoint: '/v1/chat/completions',
        completion_window: '24h'
      })
    })

    if (!batchResponse.ok) {
      console.error(`OpenAI batch creation error: ${batchResponse.status} ${batchResponse.statusText}`)
      return null
    }

    const batchResult = await batchResponse.json()
    console.log(`Created batch job: ${batchResult.id}`)

    return {
      batch_id: batchResult.id,
      file_id: fileResult.id,
      status: batchResult.status
    }
  } catch (error) {
    console.error('Error submitting OpenAI batch:', error)
    return null
  }
}

/**
 * Parses and validates a JSON response from OpenAI
 */
export function parseOpenAIResponse<T = unknown>(
  content: string, 
  identifier?: string
): T | null {
  try {
    const parsed = JSON.parse(content)
    
    if (!parsed || typeof parsed !== 'object') {
      console.error(`Invalid response object${identifier ? ` for ${identifier}` : ''}:`, parsed)
      return null
    }
    
    return parsed as T
  } catch (parseError) {
    console.error(`JSON parsing error${identifier ? ` for ${identifier}` : ''}:`, parseError)
    console.error('Raw content:', content)
    return null
  }
}

/**
 * Validates an assessment response structure
 */
export function validateAssessmentResponse(
  assessment: unknown, 
  identifier?: string
): { title: string; analysis: string; recommendation: string } | null {
  if (!assessment || typeof assessment !== 'object') {
    console.error(`Invalid assessment object${identifier ? ` for ${identifier}` : ''}:`, assessment)
    return null
  }
  
  const assessmentObj = assessment as Record<string, unknown>
  
  if (!assessmentObj.title || typeof assessmentObj.title !== 'string') {
    console.error(`Missing or invalid title${identifier ? ` for ${identifier}` : ''}:`, assessment)
    return null
  }
  
  if (!assessmentObj.analysis || typeof assessmentObj.analysis !== 'string') {
    console.error(`Missing or invalid analysis${identifier ? ` for ${identifier}` : ''}:`, assessment)
    return null
  }
  
  if (!assessmentObj.recommendation || typeof assessmentObj.recommendation !== 'string') {
    console.error(`Missing or invalid recommendation${identifier ? ` for ${identifier}` : ''}:`, assessment)
    return null
  }
  
  // Validate recommendation against allowed values
  const validRecommendations = ['buy', 'hold', 'sell']
  const normalizedRecommendation = assessmentObj.recommendation.toLowerCase().trim()
  
  if (!validRecommendations.includes(normalizedRecommendation)) {
    console.error(`Invalid recommendation${identifier ? ` for ${identifier}` : ''}: "${assessmentObj.recommendation}" (normalized: "${normalizedRecommendation}")`)
    return null
  }

  return {
    title: assessmentObj.title.trim(),
    analysis: assessmentObj.analysis,
    recommendation: normalizedRecommendation
  }
}

/**
 * Gets batch status from OpenAI
 */
export async function getBatchStatus(batchId: string, apiKey: string) {
  try {
    const response = await fetch(`https://api.openai.com/v1/batches/${batchId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    })

    if (!response.ok) {
      console.error(`OpenAI batch status error: ${response.status} ${response.statusText}`)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Error checking batch status:', error)
    return null
  }
}

/**
 * Downloads batch results from OpenAI
 */
export async function downloadBatchResults(fileId: string, apiKey: string): Promise<string | null> {
  try {
    const response = await fetch(`https://api.openai.com/v1/files/${fileId}/content`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    })

    if (!response.ok) {
      console.error(`Failed to download results: ${response.status}`)
      return null
    }

    return await response.text()
  } catch (error) {
    console.error('Error downloading batch results:', error)
    return null
  }
}

/**
 * Generates a JSON schema example for prompt formatting
 */
function generateSchemaExample(jsonSchema: JSONSchema): string {
  const { schema } = jsonSchema
  const example: Record<string, string> = {}
  
  for (const [key, prop] of Object.entries(schema.properties)) {
    if (prop.type === 'string') {
      if (prop.enum) {
        example[key] = `${prop.enum.join('|')}`
      } else {
        example[key] = `Your ${prop.description || key} here...`
      }
    } else {
      example[key] = `Your ${key} here...`
    }
  }
  
  return JSON.stringify(example, null, 2)
}

/**
 * Security assessment JSON schema
 */
export const SECURITY_ASSESSMENT_SCHEMA: JSONSchema = {
  name: "security_assessment",
  schema: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "Short, representative title for the analysis (3-8 words)"
      },
      analysis: {
        type: "string",
        description: "Comprehensive analysis covering fundamentals, technical analysis, and market sentiment"
      },
      recommendation: {
        type: "string",
        enum: ["buy", "hold", "sell"],
        description: "Investment recommendation"
      }
    },
    required: ["title", "analysis", "recommendation"],
    additionalProperties: false
  }
}

/**
 * Portfolio analysis JSON schema
 */
export const PORTFOLIO_ANALYSIS_SCHEMA: JSONSchema = {
  name: "portfolio_analysis",
  schema: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "Short, descriptive title for the portfolio analysis (3-8 words)"
      },
      assessment: {
        type: "string",
        description: "Comprehensive portfolio analysis including performance, diversification, risk alignment, and strategic observations"
      },
      rating: {
        type: "number",
        minimum: 1,
        maximum: 10,
        description: "Overall portfolio rating from 1 (poor) to 10 (excellent)"
      },
      actions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            action: {
              type: "string",
              enum: ["buy", "sell", "hold", "rebalance"],
              description: "Recommended action type"
            },
            symbol: {
              type: "string",
              description: "Security symbol (required for buy/sell actions)"
            },
            amount: {
              type: "number",
              description: "Suggested amount or percentage for the action"
            },
            reasoning: {
              type: "string",
              description: "Explanation for this specific action"
            },
            priority: {
              type: "string",
              enum: ["high", "medium", "low"],
              description: "Priority level for this action"
            }
          },
          required: ["action", "reasoning", "priority"],
          additionalProperties: false
        },
        description: "List of recommended portfolio actions"
      },
      risk_assessment: {
        type: "object",
        properties: {
          current_risk_level: {
            type: "string",
            enum: ["conservative", "moderate", "aggressive"],
            description: "Current portfolio risk level"
          },
          alignment_with_target: {
            type: "string",
            enum: ["aligned", "too_conservative", "too_aggressive"],
            description: "How current portfolio aligns with target risk level"
          },
          recommendations: {
            type: "string",
            description: "Risk-specific recommendations"
          }
        },
        required: ["current_risk_level", "alignment_with_target", "recommendations"],
        additionalProperties: false
      }
    },
    required: ["title", "assessment", "rating", "actions", "risk_assessment"],
    additionalProperties: false
  }
}