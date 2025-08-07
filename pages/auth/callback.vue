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

onMounted(async () => {
  try {
    const { data, error: authError } = await supabase.auth.getSession()
    
    if (authError) {
      throw authError
    }
    
    if (data.session) {
      // Check if user has a profile, if not create one
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.session.user.id)
        .single()
      
      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create one
        await supabase
          .from('profiles')
          .insert({
            id: data.session.user.id,
            email: data.session.user.email!,
            full_name: data.session.user.user_metadata?.full_name || null,
            subscription_status: 'trial',
            subscription_plan: 'free',
            trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
          })
      }
      
      await router.push('/dashboard')
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