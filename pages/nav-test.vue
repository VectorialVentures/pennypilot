<template>
  <div class="min-h-screen bg-gray-50 py-12 px-4">
    <div class="max-w-md mx-auto bg-white rounded-lg shadow p-6">
      <h1 class="text-2xl font-bold mb-6">Navigation Test</h1>
      
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-medium text-gray-700 mb-2">NuxtLink Navigation:</h3>
          <div class="space-y-2">
            <NuxtLink to="/auth/login" class="block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Go to Login (NuxtLink)
            </NuxtLink>
            <NuxtLink to="/auth/signup" class="block bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
              Go to Signup (NuxtLink)
            </NuxtLink>
            <NuxtLink to="/" class="block bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
              Go to Home (NuxtLink)
            </NuxtLink>
          </div>
        </div>
        
        <div>
          <h3 class="text-sm font-medium text-gray-700 mb-2">Regular Links:</h3>
          <div class="space-y-2">
            <a href="/auth/login" class="block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Go to Login (href)
            </a>
            <a href="/auth/signup" class="block bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
              Go to Signup (href)
            </a>
            <a href="/" class="block bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
              Go to Home (href)
            </a>
          </div>
        </div>
        
        <div>
          <h3 class="text-sm font-medium text-gray-700 mb-2">Programmatic Navigation:</h3>
          <div class="space-y-2">
            <button @click="$router.push('/auth/login')" class="block w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Go to Login ($router.push)
            </button>
            <button @click="$router.push('/auth/signup')" class="block w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
              Go to Signup ($router.push)
            </button>
            <button @click="navigateTo('/auth/signup')" class="block w-full bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600">
              Go to Signup (navigateTo)
            </button>
          </div>
        </div>
        
        <div>
          <h3 class="text-sm font-medium text-gray-700 mb-2">Current Route Info:</h3>
          <pre class="text-xs bg-gray-100 p-2 rounded">{{ JSON.stringify($route, null, 2) }}</pre>
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
</script>