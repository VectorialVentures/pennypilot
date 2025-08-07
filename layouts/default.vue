<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
    <AppNavigation />
    <main class="pb-10">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
// This layout requires authentication
definePageMeta({
  middleware: 'auth'
})
</script>