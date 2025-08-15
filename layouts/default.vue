<template>
  <div class="min-h-screen bg-background-950">
    <AppNavigation />
    <main>
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