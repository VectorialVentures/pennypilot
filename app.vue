<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
useHead({
  title: 'StockAdvisor - AI-Powered Investment Platform',
  meta: [
    { name: 'description', content: 'Transform your investment strategy with AI-powered portfolio management and intelligent stock recommendations.' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { property: 'og:title', content: 'StockAdvisor - AI-Powered Investment Platform' },
    { property: 'og:description', content: 'Transform your investment strategy with AI-powered portfolio management and intelligent stock recommendations.' },
    { property: 'og:type', content: 'website' }
  ],
  link: [
    { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
  ]
})
</script>