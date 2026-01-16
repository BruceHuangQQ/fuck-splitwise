<template>
  <div class="min-h-screen flex items-center justify-center px-6">
    <div class="w-full max-w-sm">
      <h1 class="mb-6 text-3xl font-semibold tracking-tight">
        Sign in to Fuck Splitwise
      </h1>

      <button
        type="button"
        @click="handleGoogle"
        :disabled="loading"
        class="mb-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none disabled:opacity-60"
      >
        <img
          src="/public/google.favicon.svg"
          alt="Google"
          width="18"
          height="18"
          aria-hidden="true"
        />
        {{ loading ? "Signing in..." : "Continue with Google" }}
      </button>

      <p class="text-xs text-gray-500">
        By continuing, you agree to our terms and acknowledge our privacy policy.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect } from "vue";

const loading = ref(false);
const { status, signIn } = useAuth();

// If already logged in, bounce to home (or /app)
watchEffect(() => {
  if (status.value === "authenticated") {
    navigateTo("/");
  }
});

async function handleGoogle() {
  try {
    loading.value = true;
    // NuxtAuth provider id is "google"
    await signIn("google", { callbackUrl: "/" });
  } finally {
    // In most flows you'll be redirected before this runs,
    // but keep it for completeness.
    loading.value = false;
  }
}
</script>

