import { loadStripe, type Stripe } from '@stripe/stripe-js'

let stripePromise: Promise<Stripe | null>

export const useStripe = () => {
  const config = useRuntimeConfig()
  
  if (!stripePromise) {
    stripePromise = loadStripe(config.public.stripePublishableKey)
  }
  
  return stripePromise
}

export const useCreateCheckoutSession = async (priceId: string, customerId?: string) => {
  const { data } = await $fetch<{ sessionId: string }>('/api/stripe/create-checkout-session', {
    method: 'POST',
    body: {
      priceId,
      customerId
    }
  })
  
  return data.sessionId
}

export const useCreateCustomerPortal = async () => {
  const { data } = await $fetch<{ url: string }>('/api/stripe/create-portal-session', {
    method: 'POST'
  })
  
  return data.url
}

export const useSubscriptionPlans = () => {
  return [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      interval: null,
      features: [
        '1 Portfolio',
        'Basic Analytics',
        'Limited AI Recommendations',
        'Email Support'
      ],
      popular: false,
      priceId: null
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 29,
      interval: 'month',
      features: [
        '5 Portfolios',
        'Advanced Analytics',
        'Unlimited AI Recommendations',
        'Real-time Market Data',
        'Priority Support',
        'Export Reports'
      ],
      popular: true,
      priceId: 'price_pro_monthly' // Replace with actual Stripe price ID
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 99,
      interval: 'month',
      features: [
        'Unlimited Portfolios',
        'Advanced Analytics',
        'Unlimited AI Recommendations',
        'Real-time Market Data',
        'Priority Support',
        'Export Reports',
        'API Access',
        'Custom Alerts',
        'Dedicated Account Manager'
      ],
      popular: false,
      priceId: 'price_premium_monthly' // Replace with actual Stripe price ID
    }
  ]
}