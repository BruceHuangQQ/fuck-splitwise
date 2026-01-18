<template>
  <div class="min-h-screen flex items-center justify-center px-6">
    <div class="w-full max-w-sm">
      <div class="mb-6 flex flex-col items-center gap-4">
        <img src="/logo.svg" alt="Fuck Splitwise Logo" class="h-16 w-16" />
        <h1 class="text-3xl font-semibold tracking-tight text-center">
          Sign in to Fuck Splitwise
        </h1>
      </div>

      <button
        type="button"
        @click="handleGoogle"
        :disabled="loading"
        class="mb-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <img
          src="/google.favicon.svg"
          alt="Google"
          width="18"
          height="18"
          aria-hidden="true"
        />
        {{ loading ? 'Signing in...' : 'Continue with Google' }}
      </button>

      <p class="text-sm text-gray-500 text-center">
        By continuing, you agree to our terms and acknowledge our privacy
        policy.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue'

const { loggedIn } = useUserSession()
const loading = ref(false)

// If already logged in, bounce to home
watchEffect(() => {
  if (loggedIn.value) {
    navigateTo('/')
  }
})

function handleGoogle() {
  loading.value = true
  // Redirect to OAuth endpoint (full page redirect for OAuth flow)
  window.location.href = '/api/auth/google'
}
</script>
