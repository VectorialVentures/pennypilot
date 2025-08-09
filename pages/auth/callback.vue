<template>
  <div class="min-h-screen gradient-bg flex items-center justify-center">
    <div class="text-center">
      <div v-if="loading" class="flex flex-col items-center">
        <svg class="animate-spin h-12 w-12 text-primary-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <h2 class="text-xl font-semibold text-secondary-900">Completing sign in...</h2>
        <p class="text-secondary-600 mt-2">Please wait while we redirect you.</p>
      </div>
      
      <div v-else-if="error" class="glass rounded-2xl shadow-strong p-8 max-w-md">
        <div class="text-danger-600 mb-4">
          <svg class="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
          </svg>
        </div>
        <h2 class="text-xl font-semibold text-secondary-900 mb-2">Authentication Error</h2>
        <p class="text-secondary-600 mb-6">{{ error }}</p>
        <NuxtLink to="/auth/login" class="btn-primary">
          Back to Sign In
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
  auth: false
})

const supabase = useSupabaseClient()
const router = useRouter()
const route = useRoute()

const loading = ref(true)
const error = ref('')

const handlePaidPlanSetup = async (planType: string, user: any) => {
  try {
    // Create account first
    const account = await createAccountWithPlan(planType, user)
    
    // Get user's currency
    const getUserCurrency = () => {
      const locale = navigator.language || 'en-US'
      if (locale.includes('sv') || locale.includes('SE')) return 'sek'
      if (locale.includes('de') || locale.includes('fr') || locale.includes('es') || locale.includes('it')) return 'eur'
      return 'sek'
    }

    const { data } = await $fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      body: {
        plan: planType,
        currency: getUserCurrency(),
        accountId: account.id
      }
    })

    if (data?.sessionId) {
      // Redirect to Stripe Checkout
      const stripe = await import('@stripe/stripe-js').then(m => 
        m.loadStripe(useRuntimeConfig().public.stripePublishableKey)
      )
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId: data.sessionId })
      }
    }
  } catch (error) {
    console.error('Paid plan setup error:', error)
    throw error
  }
}

const createAccountWithPlan = async (plan: string, user: any) => {
  const { data, error } = await supabase
    .from('accounts')
    .insert({
      name: `${user.user_metadata?.full_name || user.email}'s Account`,
      slug: `user-${user.id}`,
      owner_id: user.id,
      billing_email: user.email,
      status: plan === 'free' ? 'active' : 'trialing'
    })
    .select()
    .single()

  if (error) throw error

  // Create account member record
  await supabase
    .from('account_members')
    .insert({
      account_id: data.id,
      user_id: user.id,
      role: 'owner',
      joined_at: new Date().toISOString()
    })

  // Create initial subscription record
  if (plan === 'free') {
    await supabase
      .from('subscriptions')
      .insert({
        account_id: data.id,
        status: 'active',
        stripe_customer_id: '', // Will be populated if they upgrade
        stripe_subscription_id: `free_${data.id}`, // Unique identifier for free plan
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
  } else {
    // Create pending subscription record for paid plans - will be updated by webhook
    const trialEndDate = new Date()
    trialEndDate.setDate(trialEndDate.getDate() + 14) // 14-day trial
    
    await supabase
      .from('subscriptions')
      .insert({
        account_id: data.id,
        status: 'trialing',
        stripe_customer_id: '', // Will be populated by webhook
        stripe_subscription_id: `pending_${data.id}`, // Temporary ID until Stripe creates it
        trial_start: new Date().toISOString(),
        trial_end: trialEndDate.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
  }

  return data
}

onMounted(async () => {
  try {
    const { data, error: authError } = await supabase.auth.getSession()
    
    if (authError) {
      throw authError
    }
    
    if (data.session) {
      // Check if user has an account, if not create one
      const { data: account, error: accountError } = await supabase
        .from('accounts')
        .select('*')
        .eq('owner_id', data.session.user.id)
        .single()
      
      if (accountError && accountError.code === 'PGRST116') {
        // Account doesn't exist, create one
        const selectedPlan = data.session.user.user_metadata?.selected_plan || 'free'
        
        const { data: newAccount } = await supabase
          .from('accounts')
          .insert({
            name: `${data.session.user.user_metadata?.full_name || data.session.user.email}'s Account`,
            slug: `user-${data.session.user.id}`,
            owner_id: data.session.user.id,
            billing_email: data.session.user.email!,
            status: selectedPlan === 'free' ? 'active' : 'trialing',
            onboarding_completed: false
          })
          .select()
          .single()
          
        // Create account member record
        if (newAccount) {
          await supabase
            .from('account_members')
            .insert({
              account_id: newAccount.id,
              user_id: data.session.user.id,
              role: 'owner',
              joined_at: new Date().toISOString()
            })
        }
        
        // If user selected a paid plan, redirect to checkout
        if (selectedPlan !== 'free') {
          await handlePaidPlanSetup(selectedPlan, data.session.user)
          return
        }
        
        // New user - redirect to onboarding
        await router.push('/onboarding')
      } else if (account) {
        // Existing user - check if they've completed onboarding
        if (!account.onboarding_completed) {
          await router.push('/onboarding')
        } else {
          await router.push('/dashboard')
        }
      } else {
        await router.push('/dashboard')
      }
    } else {
      throw new Error('No session found')
    }
  } catch (err: any) {
    console.error('Auth callback error:', err)
    error.value = err.message || 'Authentication failed'
  } finally {
    loading.value = false
  }
})
</script>