// Minimal Nuxt 3 configuration using TailwindCSS module
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  srcDir: '.',
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/tailwind.css'],
  compatibilityDate: '2026-02-17',
  typescript: {
    strict: true,
    typeCheck: true
  },
  app: {
    head: {
      title: 'Racer Nuxt Frontend',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  }
})
