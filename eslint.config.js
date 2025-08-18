import { createConfigForNuxt } from '@nuxt/eslint-config/flat'

export default createConfigForNuxt({
  features: {
    // Rules for module authors
    tooling: true,
    // Rules for formatting
    stylistic: false,
  },
  dirs: {
    src: [
      './components',
      './pages',
      './layouts',
      './middleware',
      './plugins',
      './utils',
      './composables',
      './server'
    ]
  }
})