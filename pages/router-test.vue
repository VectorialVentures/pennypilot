<template>
  <div style="padding: 20px; font-family: monospace; background: white; min-height: 100vh;">
    <h1>Router Test Page</h1>
    <p><strong>Current URL:</strong> {{ $route.fullPath }}</p>
    <p><strong>Current Route Name:</strong> {{ $route.name }}</p>
    <p><strong>Router Available:</strong> {{ !!$router }}</p>
    
    <hr style="margin: 20px 0;">
    
    <div style="margin-bottom: 20px;">
      <h3>Test 1: Basic href links</h3>
      <a href="/debug" style="display: block; margin: 5px 0; color: blue;">→ /debug (href)</a>
      <a href="/nav-test" style="display: block; margin: 5px 0; color: blue;">→ /nav-test (href)</a>
      <a href="/auth/signup" style="display: block; margin: 5px 0; color: blue;">→ /auth/signup (href)</a>
    </div>
    
    <div style="margin-bottom: 20px;">
      <h3>Test 2: JavaScript window.location</h3>
      <button @click="window.location.href = '/debug'" style="display: block; margin: 5px 0;">→ /debug (window.location)</button>
      <button @click="window.location.href = '/auth/signup'" style="display: block; margin: 5px 0;">→ /auth/signup (window.location)</button>
    </div>
    
    <div>
      <h3>Test 3: Router methods</h3>
      <button @click="testRouterPush('/debug')" style="display: block; margin: 5px 0;">→ /debug ($router.push)</button>
      <button @click="testNavigateTo('/debug')" style="display: block; margin: 5px 0;">→ /debug (navigateTo)</button>
    </div>
    
    <hr style="margin: 20px 0;">
    <div id="log" style="background: #f0f0f0; padding: 10px; height: 200px; overflow-y: auto;">
      <div v-for="(log, i) in logs" :key="i">{{ log }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
  auth: false
})

const logs = ref<string[]>([])

const addLog = (message: string) => {
  logs.value.push(`${new Date().toLocaleTimeString()}: ${message}`)
}

const testRouterPush = async (path: string) => {
  try {
    addLog(`Attempting $router.push('${path}')`)
    await $router.push(path)
    addLog(`✅ $router.push successful`)
  } catch (error) {
    addLog(`❌ $router.push error: ${error}`)
  }
}

const testNavigateTo = async (path: string) => {
  try {
    addLog(`Attempting navigateTo('${path}')`)
    await navigateTo(path)
    addLog(`✅ navigateTo successful`)
  } catch (error) {
    addLog(`❌ navigateTo error: ${error}`)
  }
}

onMounted(() => {
  addLog('Router test page mounted')
  addLog(`Current route: ${$route.fullPath}`)
})
</script>