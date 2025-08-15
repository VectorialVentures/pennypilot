<template>
  <!-- Background matching landing page -->
  <div class="min-h-full">
    <div class="absolute inset-0 bg-gradient-to-br from-background-950 via-background-900 to-background-950">
      <div class="absolute inset-0 bg-gradient-to-tr from-primary-900/20 via-transparent to-accent-900/20 animate-gradient-shift"></div>
      <div class="absolute inset-0 bg-gradient-to-bl from-transparent via-primary-800/30 to-transparent animate-gradient-pulse"></div>
    </div>
    
    <!-- Floating Gradient Orbs -->
    <div class="absolute top-20 left-1/4 w-64 h-64 bg-gradient-to-r from-primary-500/20 to-accent-500/20 rounded-full blur-2xl animate-float-slow"></div>
    <div class="absolute bottom-20 right-1/4 w-96 h-96 bg-gradient-to-l from-accent-400/15 to-primary-400/15 rounded-full blur-3xl animate-float-reverse"></div>
    
    <div class="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold gradient-text">Profile Settings</h1>
      <p class="text-secondary-600 mt-2">Manage your account information and preferences</p>
    </div>

    <div class="grid gap-6">
      <!-- Profile Information -->
      <div class="card">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-secondary-900">Personal Information</h2>
          <button
            v-if="!editMode"
            @click="editMode = true"
            class="btn-secondary"
          >
            <PencilIcon class="w-4 h-4 mr-2" />
            Edit
          </button>
        </div>

        <form v-if="editMode" @submit.prevent="updateProfile" class="space-y-6">
          <div class="grid md:grid-cols-2 gap-6">
            <div>
              <label for="fullName" class="block text-sm font-medium text-secondary-700">Full Name</label>
              <input
                id="fullName"
                v-model="form.fullName"
                type="text"
                required
                class="input-field mt-1"
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <label for="email" class="block text-sm font-medium text-secondary-700">Email</label>
              <input
                id="email"
                v-model="form.email"
                type="email"
                disabled
                class="input-field mt-1 bg-secondary-50 text-secondary-500"
              />
              <p class="text-xs text-secondary-500 mt-1">Email cannot be changed</p>
            </div>
          </div>

          <div class="flex justify-end space-x-3">
            <button
              type="button"
              @click="cancelEdit"
              class="btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="loading"
              class="btn-primary"
            >
              <span v-if="loading" class="flex items-center">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
              <span v-else>Save Changes</span>
            </button>
          </div>
        </form>

        <div v-else class="grid md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-secondary-700">Full Name</label>
            <p class="mt-1 text-sm text-secondary-900">{{ profile?.full_name || 'Not provided' }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-secondary-700">Email</label>
            <p class="mt-1 text-sm text-secondary-900">{{ profile?.email }}</p>
          </div>
        </div>
      </div>

      <!-- Subscription Information -->
      <div class="card">
        <h2 class="text-xl font-semibold text-secondary-900 mb-6">Subscription</h2>
        
        <div class="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
          <div>
            <div class="flex items-center space-x-2">
              <span class="text-lg font-semibold text-secondary-900 capitalize">{{ profile?.subscription_plan }} Plan</span>
              <span
                :class="[
                  'px-2 py-1 text-xs font-medium rounded-full',
                  profile?.subscription_status === 'active' ? 'bg-accent-100 text-accent-800' :
                  profile?.subscription_status === 'trial' ? 'bg-primary-100 text-primary-800' :
                  'bg-danger-100 text-danger-800'
                ]"
              >
                {{ profile?.subscription_status }}
              </span>
            </div>
            <p class="text-sm text-secondary-600 mt-1">
              <span v-if="profile?.subscription_status === 'trial' && profile?.trial_ends_at">
                Trial expires {{ formatDate(profile.trial_ends_at) }}
              </span>
              <span v-else-if="profile?.subscription_status === 'active'">
                Next billing cycle starts soon
              </span>
            </p>
          </div>
          
          <NuxtLink
            v-if="profile?.subscription_plan === 'free'"
            to="/pricing"
            class="btn-primary"
          >
            Upgrade Plan
          </NuxtLink>
          
          <button
            v-else
            @click="manageBilling"
            class="btn-secondary"
          >
            Manage Billing
          </button>
        </div>
      </div>

      <!-- Account Actions -->
      <div class="card">
        <h2 class="text-xl font-semibold text-secondary-900 mb-6">Account Actions</h2>
        
        <div class="space-y-4">
          <div class="flex items-center justify-between p-4 border border-secondary-200 rounded-lg">
            <div>
              <h3 class="text-sm font-medium text-secondary-900">Change Password</h3>
              <p class="text-sm text-secondary-600">Update your account password</p>
            </div>
            <button @click="changePassword" class="btn-secondary">
              Change Password
            </button>
          </div>
          
          <div class="flex items-center justify-between p-4 border border-danger-200 rounded-lg">
            <div>
              <h3 class="text-sm font-medium text-danger-900">Delete Account</h3>
              <p class="text-sm text-danger-600">Permanently delete your account and all data</p>
            </div>
            <button @click="deleteAccount" class="btn-secondary text-danger-600 border-danger-300 hover:bg-danger-50">
              Delete Account
            </button>
          </div>
          </div>
        </div>
      </div>

    <!-- Success/Error Messages -->
    <div v-if="message" class="fixed bottom-4 right-4 z-50">
      <div
        :class="[
          'p-4 rounded-lg shadow-strong',
          message.type === 'success' ? 'bg-accent-50 text-accent-800 border border-accent-200' :
          'bg-danger-50 text-danger-800 border border-danger-200'
        ]"
      >
        {{ message.text }}
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PencilIcon } from '@heroicons/vue/24/outline'

definePageMeta({
  middleware: 'auth'
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const profile = ref<any>(null)
const editMode = ref(false)
const loading = ref(false)
const message = ref<{ type: 'success' | 'error', text: string } | null>(null)

const form = ref({
  fullName: '',
  email: ''
})

const originalForm = ref({})

// Load profile data
const loadProfile = async () => {
  if (!user.value) return
  
  try {
    // Get account data instead of profiles
    const { data: accountData, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('owner_id', user.value.id)
      .single()
    
    if (accountError && accountError.code !== 'PGRST116') {
      throw accountError
    }

    // Get subscription data
    const { data: subData } = await supabase
      .from('subscriptions')
      .select(`
        *,
        subscription_plans (name, amount)
      `)
      .eq('account_id', accountData?.id)
      .in('status', ['active', 'trialing', 'past_due'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    profile.value = {
      id: user.value.id,
      email: user.value.email || accountData?.billing_email || '',
      full_name: accountData?.name || '',
      subscription_plan: subData?.subscription_plans?.name?.toLowerCase() || 'free',
      subscription_status: subData?.status || (accountData ? 'active' : 'trial'),
      trial_ends_at: subData?.trial_end || null
    }
    
    form.value = {
      fullName: profile.value.full_name || '',
      email: profile.value.email || ''
    }
    originalForm.value = { ...form.value }
  } catch (error) {
    console.error('Error loading profile:', error)
    // Create default profile if none exists
    profile.value = {
      id: user.value.id,
      email: user.value.email || '',
      full_name: '',
      subscription_plan: 'free',
      subscription_status: 'trial',
      trial_ends_at: null
    }
    
    form.value = {
      fullName: '',
      email: user.value.email || ''
    }
    originalForm.value = { ...form.value }
  }
}

const updateProfile = async () => {
  loading.value = true
  
  try {
    // Update account name instead of profiles
    const { error } = await supabase
      .from('accounts')
      .update({
        name: form.value.fullName,
        updated_at: new Date().toISOString()
      })
      .eq('owner_id', user.value!.id)
    
    if (error) throw error
    
    profile.value = {
      ...profile.value,
      full_name: form.value.fullName
    }
    
    editMode.value = false
    showMessage('success', 'Profile updated successfully')
  } catch (error) {
    console.error('Error updating profile:', error)
    showMessage('error', 'Failed to update profile')
  } finally {
    loading.value = false
  }
}

const cancelEdit = () => {
  form.value = { ...originalForm.value }
  editMode.value = false
}

const changePassword = async () => {
  try {
    const { error } = await supabase.auth.updateUser({
      email: user.value!.email
    })
    
    if (error) throw error
    
    showMessage('success', 'Password reset email sent')
  } catch (error) {
    console.error('Error sending password reset:', error)
    showMessage('error', 'Failed to send password reset email')
  }
}

const manageBilling = async () => {
  try {
    const { useCreateCustomerPortal } = await import('~/composables/useStripe')
    const url = await useCreateCustomerPortal()
    window.open(url, '_blank')
  } catch (error) {
    console.error('Error opening billing portal:', error)
    showMessage('error', 'Failed to open billing portal')
  }
}

const deleteAccount = async () => {
  if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
    return
  }
  
  // This would typically call an API endpoint to handle account deletion
  showMessage('error', 'Account deletion is not implemented yet')
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const showMessage = (type: 'success' | 'error', text: string) => {
  message.value = { type, text }
  setTimeout(() => {
    message.value = null
  }, 5000)
}

onMounted(() => {
  loadProfile()
})

useHead({
  title: 'Profile Settings - StockAdvisor'
})
</script>