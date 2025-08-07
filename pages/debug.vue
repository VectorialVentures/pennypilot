<template>
  <div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full mx-auto">
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">Debug Information</h2>
        
        <div class="space-y-4">
          <div>
            <h3 class="text-sm font-medium text-gray-700">Current User:</h3>
            <pre class="text-xs bg-gray-100 p-2 rounded mt-1">{{ user ? JSON.stringify(user, null, 2) : 'No user' }}</pre>
          </div>
          
          <div>
            <h3 class="text-sm font-medium text-gray-700">Current Route:</h3>
            <pre class="text-xs bg-gray-100 p-2 rounded mt-1">{{ $route.path }}</pre>
          </div>
          
          <div>
            <h3 class="text-sm font-medium text-gray-700">Supabase Session:</h3>
            <pre class="text-xs bg-gray-100 p-2 rounded mt-1">{{ session ? JSON.stringify(session, null, 2) : 'No session' }}</pre>
          </div>
        </div>
        
        <div class="mt-6 space-y-3">
          <button @click="clearSession" class="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
            Clear Session
          </button>
          <NuxtLink to="/auth/signup" class="block w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-center">
            Go to Signup
          </NuxtLink>
          <NuxtLink to="/auth/login" class="block w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 text-center">
            Go to Login
          </NuxtLink>
          <NuxtLink to="/" class="block w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-center">
            Go to Home
          </NuxtLink>
        </div>
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
const user = useSupabaseUser()
const session = ref(null)

const clearSession = async () => {
  await supabase.auth.signOut()
  await navigateTo('/')
}

onMounted(async () => {
  const { data } = await supabase.auth.getSession()
  session.value = data.session
})
</script>