import Stripe from 'stripe'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  if (!config.stripeSecretKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Stripe secret key not configured'
    })
  }

  const stripe = new Stripe(config.stripeSecretKey, {
    apiVersion: '2024-06-20'
  })

  try {
    const { sessionId } = body

    if (!sessionId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Session ID is required'
      })
    }

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (!session) {
      return {
        success: false,
        message: 'Checkout session not found'
      }
    }

    // Check if this was an anonymous checkout that should have created a user
    if (session.metadata?.anonymous_checkout !== 'true') {
      return {
        success: false,
        message: 'This was not an anonymous checkout session'
      }
    }

    // Check if payment was successful
    if (session.payment_status !== 'paid') {
      return {
        success: false,
        message: 'Payment was not successful'
      }
    }

    // Get the user's setup token from Supabase
    const supabase = await serverSupabaseServiceRole<Database>(event)
    let setupToken = null

    if (session.customer_details?.email) {
      const { data: user } = await supabase.auth.admin.listUsers()
      const matchingUser = user.users?.find(u => u.email === session.customer_details?.email)
      
      if (matchingUser && matchingUser.user_metadata?.setup_token) {
        setupToken = matchingUser.user_metadata.setup_token
      }
    }

    return {
      success: true,
      customerEmail: session.customer_details?.email,
      planType: session.metadata?.plan_type,
      stripeCustomerId: session.customer,
      setupToken: setupToken
    }

  } catch (error) {
    console.error('Checkout session verification error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to verify checkout session'
    })
  }
})