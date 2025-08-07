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
  // Update user's subscription status in Supabase
  console.log('Subscription updated:', subscription.id)
  // TODO: Implement Supabase update logic
}

async function handleSubscriptionCancellation(subscription: Stripe.Subscription) {
  // Update user's subscription status to cancelled in Supabase
  console.log('Subscription cancelled:', subscription.id)
  // TODO: Implement Supabase update logic
}

async function handlePaymentSuccess(invoice: Stripe.Invoice) {
  // Handle successful payment
  console.log('Payment succeeded for invoice:', invoice.id)
  // TODO: Implement success handling logic
}

async function handlePaymentFailure(invoice: Stripe.Invoice) {
  // Handle failed payment
  console.log('Payment failed for invoice:', invoice.id)
  // TODO: Implement failure handling logic
}