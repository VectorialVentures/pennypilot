<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="max-w-md w-full bg-white rounded-lg shadow p-8">
      <h1 class="text-2xl font-bold text-center text-gray-900 mb-6">Signup Test Page</h1>
      
      <div class="space-y-4">
        <p class="text-sm text-gray-600">This is a minimal signup test page to check if routing works.</p>
        
        <div class="border border-gray-200 rounded p-4">
          <h3 class="font-medium text-gray-900 mb-2">Current Route:</h3>
          <code class="text-sm bg-gray-100 p-2 rounded block">{{ $route.path }}</code>
        </div>
        
        <div class="space-y-2">
          <NuxtLink to="/auth/login" class="block bg-blue-500 text-white text-center px-4 py-2 rounded hover:bg-blue-600">
            Back to Login
          </NuxtLink>
          <NuxtLink to="/" class="block bg-gray-500 text-white text-center px-4 py-2 rounded hover:bg-gray-600">
            Back to Home
          </NuxtLink>
        </div>
        
        <div class="mt-6 p-4 bg-green-50 rounded">
          <p class="text-sm text-green-800">✅ If you can see this page, routing to /auth/signup-test works!</p>
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

console.log('Signup test page loaded successfully!')
</script>