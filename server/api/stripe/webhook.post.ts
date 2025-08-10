import Stripe from 'stripe'
import jwt from 'jsonwebtoken'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  
  if (!config.stripeSecretKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Stripe secret key not configured'
    })
  }

  const stripe = new Stripe(config.stripeSecretKey, {
    apiVersion: '2024-06-20'
  })

  const body = await readRawBody(event)
  const sig = getHeader(event, 'stripe-signature')

  if (!body || !sig) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing body or signature'
    })
  }

  let stripeEvent: Stripe.Event

  try {
    stripeEvent = stripe.webhooks.constructEvent(body, sig, config.stripeWebhookSecret!)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid signature'
    })
  }

  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(stripeEvent.data.object as Stripe.Checkout.Session, event)
        break
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(stripeEvent.data.object as Stripe.Subscription, event)
        break
      
      case 'customer.subscription.deleted':
        await handleSubscriptionCancellation(stripeEvent.data.object as Stripe.Subscription, event)
        break
      
      case 'invoice.created':
        await handleInvoiceCreated(stripeEvent.data.object as Stripe.Invoice, event)
        break
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSuccess(stripeEvent.data.object as Stripe.Invoice, event)
        break
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailure(stripeEvent.data.object as Stripe.Invoice, event)
        break
      
      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`)
    }

    return { received: true }
  } catch (error) {
    console.error('Webhook processing error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Webhook processing failed'
    })
  }
})

async function handleSubscriptionChange(subscription: Stripe.Subscription, event: any) {
  const supabase = await serverSupabaseServiceRole<Database>(event)
  const config = useRuntimeConfig()
  const stripe = new Stripe(config.stripeSecretKey, {
    apiVersion: '2024-06-20'
  })
  
  console.log('Subscription updated:', subscription.id)
  
  try {
    let accountId = subscription.metadata?.account_id
    const planName = subscription.metadata?.plan_name
    
    // If no account_id in subscription metadata, try to get it from customer or find by customer_id
    if (!accountId) {
      console.warn('No account_id in subscription metadata, attempting to resolve...')
      
      // First try to get from customer metadata
      try {
        const customer = await stripe.customers.retrieve(subscription.customer as string)
        if (!customer.deleted && customer.metadata?.account_id) {
          accountId = customer.metadata.account_id
          
          // Update subscription metadata for future use
          await stripe.subscriptions.update(subscription.id, {
            metadata: {
              ...subscription.metadata,
              account_id: accountId
            }
          })
        }
      } catch (error) {
        console.error('Error retrieving customer:', error)
      }
      
      // If still no account_id, try to find by customer_id in database
      if (!accountId) {
        const { data: account } = await supabase
          .from('accounts')
          .select('id')
          .eq('stripe_customer_id', subscription.customer as string)
          .single()
        
        if (account?.id) {
          accountId = account.id
          
          // Update both customer and subscription metadata
          try {
            await Promise.all([
              stripe.customers.update(subscription.customer as string, {
                metadata: { account_id: accountId }
              }),
              stripe.subscriptions.update(subscription.id, {
                metadata: {
                  ...subscription.metadata,
                  account_id: accountId
                }
              })
            ])
            console.log('Updated Stripe metadata with account_id:', accountId)
          } catch (error) {
            console.error('Error updating Stripe metadata:', error)
          }
        }
      }
    }
    
    if (!accountId) {
      console.error('Unable to resolve account_id for subscription:', subscription.id)
      return
    }

    // Update account status
    await supabase
      .from('accounts')
      .update({
        stripe_customer_id: subscription.customer as string,
        status: subscription.status === 'trialing' ? 'trialing' : 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', accountId)

    // Get plan_id from subscription_plans table using Stripe price ID
    let planId = null
    if (subscription.items?.data?.[0]?.price?.id) {
      const stripePriceId = subscription.items.data[0].price.id
      const { data: plan } = await supabase
        .from('subscription_plans')
        .select('id')
        .eq('stripe_price_id', stripePriceId)
        .single()
      planId = plan?.id || null
    }

    // Create or update subscription record
    await supabase
      .from('subscriptions')
      .upsert({
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer as string,
        account_id: accountId,
        plan_id: planId,
        status: subscription.status,
        current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
        current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
        trial_start: (subscription as any).trial_start ? new Date((subscription as any).trial_start * 1000).toISOString() : null,
        trial_end: (subscription as any).trial_end ? new Date((subscription as any).trial_end * 1000).toISOString() : null,
        cancel_at_period_end: (subscription as any).cancel_at_period_end || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    console.log('Subscription updated successfully for account:', accountId)
  } catch (error) {
    console.error('Error updating subscription:', error)
    throw error
  }
}

async function handleSubscriptionCancellation(subscription: Stripe.Subscription, event: any) {
  const supabase = await serverSupabaseServiceRole<Database>(event)
  console.log('Subscription cancelled:', subscription.id)
  
  try {
    const accountId = subscription.metadata?.account_id
    
    if (!accountId) {
      console.error('No account_id in subscription metadata')
      return
    }

    // Update account status
    await supabase
      .from('accounts')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', accountId)

    // Update subscription record
    await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        canceled_at: new Date().toISOString(),
        ended_at: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id)

    console.log('Subscription cancelled successfully for account:', accountId)
  } catch (error) {
    console.error('Error cancelling subscription:', error)
    throw error
  }
}

// Helper function to get customer metadata and account info
async function getCustomerAccountInfo(customerId: string, event: any) {
  const config = useRuntimeConfig()
  const stripe = new Stripe(config.stripeSecretKey, {
    apiVersion: '2024-06-20'
  })
  const supabase = await serverSupabaseServiceRole<Database>(event)

  try {
    // Get customer from Stripe to access metadata
    const customer = await stripe.customers.retrieve(customerId)
    
    if (customer.deleted) {
      throw new Error('Customer has been deleted')
    }

    const accountId = customer.metadata?.account_id
    if (!accountId) {
      console.warn('No account_id found in customer metadata for customer:', customerId)
      return { accountId: null, subscriptionId: null }
    }

    // Get subscription_id from the account's active subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('account_id', accountId)
      .eq('stripe_customer_id', customerId)
      .in('status', ['active', 'trialing', 'past_due'])
      .single()

    return {
      accountId,
      subscriptionId: subscription?.stripe_subscription_id || null
    }
  } catch (error) {
    console.error('Error getting customer account info:', error)
    return { accountId: null, subscriptionId: null }
  }
}

// Helper function to create/update invoice record
async function upsertInvoiceRecord(invoice: Stripe.Invoice, accountId: string | null, subscriptionId: string | null, event: any) {
  const supabase = await serverSupabaseServiceRole<Database>(event)

  const invoiceData = {
    stripe_invoice_id: invoice.id,
    stripe_customer_id: invoice.customer as string,
    account_id: accountId,
    subscription_id: subscriptionId,
    amount_due: invoice.amount_due,
    amount_paid: invoice.amount_paid,
    currency: invoice.currency,
    status: invoice.status || 'draft',
    created: new Date(invoice.created * 1000).toISOString(),
    paid_at: invoice.status_transitions?.paid_at ? 
      new Date(invoice.status_transitions.paid_at * 1000).toISOString() : null,
    hosted_invoice_url: invoice.hosted_invoice_url,
    invoice_pdf: invoice.invoice_pdf,
    due_date: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
    updated_at: new Date().toISOString()
  }

  const { error } = await supabase
    .from('invoices')
    .upsert(invoiceData)

  if (error) {
    console.error('Error upserting invoice record:', error)
    throw error
  }

  return invoiceData
}

async function handleInvoiceCreated(invoice: Stripe.Invoice, event: any) {
  console.log('Invoice created:', invoice.id)
  
  try {
    // Get customer account information
    const { accountId, subscriptionId } = await getCustomerAccountInfo(invoice.customer as string, event)
    
    // Create invoice record
    await upsertInvoiceRecord(invoice, accountId, subscriptionId, event)
    
    console.log('Invoice created successfully for account:', accountId)
  } catch (error) {
    console.error('Error handling invoice creation:', error)
    throw error
  }
}

async function handleInvoicePaymentSuccess(invoice: Stripe.Invoice, event: any) {
  console.log('Payment succeeded for invoice:', invoice.id)
  
  try {
    // Get customer account information
    const { accountId, subscriptionId } = await getCustomerAccountInfo(invoice.customer as string, event)
    
    // Update invoice record with payment success
    await upsertInvoiceRecord(invoice, accountId, subscriptionId, event)
    
    console.log('Payment success recorded for invoice:', invoice.id)
  } catch (error) {
    console.error('Error recording payment success:', error)
    throw error
  }
}

async function handleInvoicePaymentFailure(invoice: Stripe.Invoice, event: any) {
  console.log('Payment failed for invoice:', invoice.id)
  
  try {
    // Get customer account information
    const { accountId, subscriptionId } = await getCustomerAccountInfo(invoice.customer as string, event)
    
    // Update invoice record with payment failure
    await upsertInvoiceRecord(invoice, accountId, subscriptionId, event)
    
    // TODO: Send email notification about failed payment
    // TODO: Update account status if needed
    
    console.log('Payment failure recorded for invoice:', invoice.id)
  } catch (error) {
    console.error('Error recording payment failure:', error)
    throw error
  }
}


async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session, event: any) {
  const supabase = await serverSupabaseServiceRole<Database>(event)
  console.log('Checkout session completed:', session.id)
  
  try {
    // Only handle anonymous checkouts (new user registration)
    if (session.metadata?.anonymous_checkout !== 'true') {
      console.log('Skipping non-anonymous checkout session')
      return
    }

    const customerEmail = session.customer_details?.email
    const planType = session.metadata?.plan_type
    const stripeCustomerId = session.customer as string
    
    if (!customerEmail || !planType) {
      console.error('Missing customer email or plan type in checkout session')
      return
    }

    // Generate a temporary password for the user
    const tempPassword = generateTempPassword()
    
    // Create Supabase user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: customerEmail,
      password: tempPassword,
      email_confirm: true, // Auto-confirm email since they completed payment
      user_metadata: {
        full_name: session.customer_details?.name || '',
        created_via_stripe: true,
        checkout_session_id: session.id,
        plan_type: planType,
        password_set: false
      }
    })

    if (authError || !authData.user) {
      console.error('Error creating Supabase user:', authError)
      return
    }

    console.log('Created Supabase user:', authData.user.id)

    // Generate setup token for password setup
    const setupToken = generateSetupToken(authData.user.id, customerEmail, session.id)
    
    // Store setup token in user metadata
    await supabase.auth.admin.updateUserById(authData.user.id, {
      user_metadata: {
        ...authData.user.user_metadata,
        setup_token: setupToken
      }
    })

    // Update Stripe session metadata with user ID for easy retrieval
    const stripe = new Stripe(useRuntimeConfig().stripeSecretKey, {
      apiVersion: '2024-06-20'
    })
    
    try {
      await stripe.checkout.sessions.update(session.id, {
        metadata: {
          ...session.metadata,
          user_id: authData.user.id
        }
      })
    } catch (error) {
      console.error('Error updating session metadata:', error)
      // Don't fail the entire webhook for this
    }

    // Create account
    const { data: accountData, error: accountError } = await supabase
      .from('accounts')
      .insert({
        name: `${session.customer_details?.name || customerEmail}'s Account`,
        slug: `user-${authData.user.id}`,
        owner_id: authData.user.id,
        billing_email: customerEmail,
        status: 'trialing',
        stripe_customer_id: stripeCustomerId,
        onboarding_completed: false
      })
      .select()
      .single()

    if (accountError || !accountData) {
      console.error('Error creating account:', accountError)
      return
    }

    console.log('Created account:', accountData.id)

    // Update Stripe customer metadata with account_id
    try {
      await stripe.customers.update(stripeCustomerId, {
        metadata: {
          account_id: accountData.id,
          user_id: authData.user.id
        }
      })
      console.log('Updated Stripe customer metadata with account_id:', accountData.id)
    } catch (error) {
      console.error('Error updating Stripe customer metadata:', error)
      // Don't fail the entire webhook for this
    }

    // Create account member record
    await supabase
      .from('account_members')
      .insert({
        account_id: accountData.id,
        user_id: authData.user.id,
        role: 'owner',
        joined_at: new Date().toISOString()
      })

    // Get subscription details and create subscription record
    if (session.subscription) {
      const stripe = new Stripe(useRuntimeConfig().stripeSecretKey, {
        apiVersion: '2024-06-20'
      })
      
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
      
      // Get plan_id from subscription_plans table using Stripe price ID
      let planId = null
      if (subscription.items?.data?.[0]?.price?.id) {
        const stripePriceId = subscription.items.data[0].price.id
        const { data: plan } = await supabase
          .from('subscription_plans')
          .select('id')
          .eq('stripe_price_id', stripePriceId)
          .single()
        planId = plan?.id || null
      }
      
      await supabase
        .from('subscriptions')
        .insert({
          stripe_subscription_id: subscription.id,
          stripe_customer_id: stripeCustomerId,
          account_id: accountData.id,
          plan_id: planId,
          status: subscription.status,
          current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
          current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
          trial_start: (subscription as any).trial_start ? new Date((subscription as any).trial_start * 1000).toISOString() : null,
          trial_end: (subscription as any).trial_end ? new Date((subscription as any).trial_end * 1000).toISOString() : null,
          cancel_at_period_end: (subscription as any).cancel_at_period_end || false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
    }

    // Send welcome email with login instructions
    // TODO: Implement email sending with temporary password
    console.log(`User created successfully: ${customerEmail} with temp password: ${tempPassword}`)
    console.log('Account created successfully for checkout session:', session.id)
    
  } catch (error) {
    console.error('Error handling checkout session completion:', error)
    throw error
  }
}

function generateTempPassword(): string {
  // Generate a secure temporary password
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

function generateSetupToken(userId: string, email: string, sessionId: string): string {
  const config = useRuntimeConfig()
  
  const payload = {
    userId,
    email,
    sessionId,
    purpose: 'password_setup',
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours expiry
  }

  return jwt.sign(payload, config.nuxtSecretKey)
}