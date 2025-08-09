import jwt from 'jsonwebtoken'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  const supabase = await serverSupabaseServiceRole<Database>(event)

  try {
    const { token } = body

    if (!token) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Token is required'
      })
    }

    // Verify the JWT token
    let decoded: any
    try {
      decoded = jwt.verify(token, config.nuxtSecretKey)
    } catch (err) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid or expired token'
      })
    }

    // Check if the user exists and hasn't set up a password yet
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(decoded.userId)

    if (userError || !user) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User not found'
      })
    }

    // Check if this user was created via Stripe and needs password setup
    if (!user.user_metadata?.created_via_stripe || user.user_metadata?.password_set) {
      throw createError({
        statusCode: 400,
        statusMessage: 'This user does not need password setup'
      })
    }

    return {
      success: true,
      email: user.email,
      userId: user.id
    }

  } catch (error: any) {
    console.error('Token verification error:', error)
    
    // If it's already a createError, re-throw it
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to verify token'
    })
  }
})