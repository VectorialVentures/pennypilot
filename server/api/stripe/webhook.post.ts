import Stripe from 'stripe'

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
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(stripeEvent.data.object as Stripe.Subscription)
        break
      
      case 'customer.subscription.deleted':
        await handleSubscriptionCancellation(stripeEvent.data.object as Stripe.Subscription)
        break
      
      case 'invoice.payment_succeeded':
        await handlePaymentSuccess(stripeEvent.data.object as Stripe.Invoice)
        break
      
      case 'invoice.payment_failed':
        await handlePaymentFailure(stripeEvent.data.object as Stripe.Invoice)
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

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const supabase = await useSupabaseServiceRole()
  console.log('Subscription updated:', subscription.id)
  
  try {
    const accountId = subscription.metadata?.account_id
    const planName = subscription.metadata?.plan_name
    
    if (!accountId) {
      console.error('No account_id in subscription metadata')
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

    // Check if subscription already exists (from signup)
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('id, stripe_subscription_id')
      .eq('account_id', accountId)
      .single()

    if (existingSubscription && existingSubscription.stripe_subscription_id.startsWith('pending_')) {
      // Update existing pending subscription
      await supabase
        .from('subscriptions')
        .update({
          stripe_subscription_id: subscription.id,
          stripe_customer_id: subscription.customer as string,
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
          trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
          cancel_at_period_end: subscription.cancel_at_period_end,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSubscription.id)
    } else {
      // Upsert subscription record (for existing customers or direct Stripe subscriptions)
      await supabase
        .from('subscriptions')
        .upsert({
          stripe_subscription_id: subscription.id,
          stripe_customer_id: subscription.customer as string,
          account_id: accountId,
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
          trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
          cancel_at_period_end: subscription.cancel_at_period_end,
          updated_at: new Date().toISOString()
        })
    }

    console.log('Subscription updated successfully for account:', accountId)
  } catch (error) {
    console.error('Error updating subscription:', error)
    throw error
  }
}

async function handleSubscriptionCancellation(subscription: Stripe.Subscription) {
  const supabase = await useSupabaseServiceRole()
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

async function handlePaymentSuccess(invoice: Stripe.Invoice) {
  const supabase = await useSupabaseServiceRole()
  console.log('Payment succeeded for invoice:', invoice.id)
  
  try {
    // Store invoice record
    await supabase
      .from('invoices')
      .upsert({
        stripe_invoice_id: invoice.id,
        stripe_customer_id: invoice.customer as string,
        subscription_id: invoice.subscription as string,
        amount_due: invoice.amount_due,
        amount_paid: invoice.amount_paid,
        currency: invoice.currency,
        status: invoice.status || 'paid',
        created: new Date(invoice.created * 1000).toISOString(),
        paid_at: invoice.status_transitions?.paid_at ? 
          new Date(invoice.status_transitions.paid_at * 1000).toISOString() : null,
        hosted_invoice_url: invoice.hosted_invoice_url,
        invoice_pdf: invoice.invoice_pdf,
        due_date: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
        updated_at: new Date().toISOString()
      })

    console.log('Payment success recorded for invoice:', invoice.id)
  } catch (error) {
    console.error('Error recording payment success:', error)
    throw error
  }
}

async function handlePaymentFailure(invoice: Stripe.Invoice) {
  const supabase = await useSupabaseServiceRole()
  console.log('Payment failed for invoice:', invoice.id)
  
  try {
    // Store invoice record
    await supabase
      .from('invoices')
      .upsert({
        stripe_invoice_id: invoice.id,
        stripe_customer_id: invoice.customer as string,
        subscription_id: invoice.subscription as string,
        amount_due: invoice.amount_due,
        amount_paid: invoice.amount_paid || 0,
        currency: invoice.currency,
        status: 'open', // Failed payments remain open
        created: new Date(invoice.created * 1000).toISOString(),
        due_date: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
        hosted_invoice_url: invoice.hosted_invoice_url,
        invoice_pdf: invoice.invoice_pdf,
        updated_at: new Date().toISOString()
      })

    // TODO: Send email notification about failed payment
    // TODO: Update account status if needed
    
    console.log('Payment failure recorded for invoice:', invoice.id)
  } catch (error) {
    console.error('Error recording payment failure:', error)
    throw error
  }
}