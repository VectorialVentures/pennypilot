# PennyPilot Setup Guide

This guide will help you set up PennyPilot with the new plan selection and Stripe integration.

## Prerequisites

1. **Supabase Project**: Set up your Supabase project with the required tables
2. **Stripe Account**: Set up Stripe with the following products and prices:
   - Basic Plan: `price_basic_monthly` ($9.99/month)
   - Premium Plan: `price_premium_monthly` ($24.99/month)

## Environment Variables

Make sure these environment variables are set in your `.env` file:

```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_endpoint_secret

# App
NUXT_SECRET_KEY=your_secret_key
```

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Initialize Subscription Plans

Run this endpoint to set up the subscription plans in your database:

```bash
curl -X POST http://localhost:3000/api/setup-subscription-plans
```

This will create the three plans (Free, Basic, Premium) in your `subscription_plans` table.

### 3. Configure Stripe Webhooks

Set up a webhook endpoint in your Stripe dashboard pointing to:
```
https://yourdomain.com/api/stripe/webhook
```

Enable these events:
- `customer.subscription.created`
- `customer.subscription.updated` 
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

### 4. Create Stripe Products and Prices

In your Stripe dashboard, create:

1. **Basic Plan Product**
   - Product ID: `prod_basic`
   - Price ID: `price_basic_monthly`
   - Amount: $9.99
   - Recurring: Monthly
   - Trial: 14 days

2. **Premium Plan Product**
   - Product ID: `prod_premium` 
   - Price ID: `price_premium_monthly`
   - Amount: $24.99
   - Recurring: Monthly
   - Trial: 14 days

## New Features

### 1. Plan Selection
- Elegant 2025-style plan selection page at `/pricing`
- Integrated into signup flow for smooth user experience
- Free plan signup requires no payment details

### 2. Subscription Management
- Full subscription management at `/subscription`
- Upgrade/downgrade between plans
- Customer portal integration
- Usage tracking and limits

### 3. Plan-Based Access Control
- Middleware automatically enforces plan limits
- Composable `useSubscription()` for feature checks
- Navigation shows current plan and trial status

### 4. Database Integration
- Comprehensive webhook handling
- Automatic account and subscription sync
- Billing history tracking

## Usage

### For Users
1. Visit `/pricing` to see available plans
2. Sign up with plan selection
3. Free users get immediate access
4. Paid plan users go through 14-day trial
5. Manage subscription at `/subscription`

### For Developers
```vue
<script setup>
const { isFreePlan, canAccessAIRecommendations, needsUpgrade } = useSubscription()

// Check if user can access a feature
if (needsUpgrade('ai_recommendations')) {
  // Show upgrade prompt
}
</script>
```

## Testing

1. **Free Plan Signup**: Should work without payment
2. **Paid Plan Signup**: Should redirect to Stripe Checkout
3. **Plan Upgrades**: Test through subscription page
4. **Webhooks**: Test with Stripe CLI for local development

## Support

The implementation includes:
- World-class web design with modern aesthetics
- Smooth signup flow to maximize conversion
- Comprehensive error handling
- Mobile-responsive design
- Accessibility features