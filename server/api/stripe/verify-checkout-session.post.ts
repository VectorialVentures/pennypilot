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
    console.warn("SESSION", session);

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

    // Get the user's setup token from Supabase using stored user_id in session metadata
    const supabase = await serverSupabaseServiceRole<Database>(event)
    let setupToken = null
    const userId = session.metadata?.user_id

    if (userId) {
      try {
        const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId)
        console.warn("GOT USER", user);
        if (userError) {
          console.error('Error getting user by ID:', userError)
        } else if (user?.raw_user_meta_data?.setup_token) {
          setupToken = user.raw_user_meta_data.setup_token
        }
      } catch (error) {
        console.error('Error retrieving user setup token:', error)
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
