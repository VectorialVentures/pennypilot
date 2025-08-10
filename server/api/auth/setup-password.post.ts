import jwt from 'jsonwebtoken'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  const supabase = await serverSupabaseServiceRole<Database>(event)

  try {
    const { token, password } = body

    if (!token || !password) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Token and password are required'
      })
    }

    if (password.length < 8) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Password must be at least 8 characters long'
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

    // Get the user
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(decoded.userId)

    if (userError || !user) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User not found'
      })
    }

    // Check if this user was created via Stripe and needs password setup
    if (!user.user.user_metadata?.created_via_stripe || user.user.user_metadata?.password_set) {
      throw createError({
        statusCode: 400,
        statusMessage: 'This user does not need password setup'
      })
    }

    // Update the user's password
    const { error: updateError } = await supabase.auth.admin.updateUserById(decoded.userId, {
      password: password,
      user_metadata: {
        ...user.user.user_metadata,
        password_set: true,
        password_set_at: new Date().toISOString()
      }
    })

    if (updateError) {
      console.error('Error updating user password:', updateError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update password'
      })
    }

    return {
      success: true,
      message: 'Password set successfully'
    }

  } catch (error: any) {
    console.error('Password setup error:', error)

    // If it's already a createError, re-throw it
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to setup password'
    })
  }
})
