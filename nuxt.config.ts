// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ["@sidebase/nuxt-auth", "@nuxtjs/tailwindcss"],

  auth: {
    // Use Auth.js provider (the "NextAuth-like" mode)
    provider: {
      type: "authjs",
    },
  },
})
