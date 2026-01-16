// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ["@sidebase/nuxt-auth", "shadcn-nuxt"],

  css: ["~/assets/css/main.css"],

  alias: {
    '@': fileURLToPath(new URL('./app', import.meta.url)),
  },

  vite: {
    plugins: [
      tailwindcss(),
    ],
  },

  shadcn: {
    /**
     * Prefix for all the imported component.
     * @default "Ui"
     */
    prefix: '',
    /**
     * Directory that the component lives in.
     * Will respect the Nuxt aliases.
     * @link https://nuxt.com/docs/api/nuxt-config#alias
     * @default "@/components/ui"
     */
    componentDir: '@/components/ui'
  },

  runtimeConfig: {
    // Private keys (only available on server-side)
    authSecret: process.env.NUXT_AUTH_SECRET,
    // Public keys (exposed to client-side)
    public: {
      authOrigin: process.env.AUTH_ORIGIN || process.env.NUXT_PUBLIC_AUTH_ORIGIN,
    },
  },

  auth: {
    // Use Auth.js provider (the "NextAuth-like" mode)
    provider: {
      type: "authjs",
    },
    // Set origin from environment variable for production
    origin: process.env.AUTH_ORIGIN || process.env.NUXT_PUBLIC_AUTH_ORIGIN,
  },
})