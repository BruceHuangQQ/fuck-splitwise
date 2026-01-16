<template>
  <div class="min-h-screen p-8">
    <h1 class="mb-6 text-3xl font-semibold tracking-tight">Welcome to Fuck Splitwise</h1>
    
    <div class="bg-gray-100 p-6 rounded-lg border border-gray-300">
      <p class="mb-4 text-gray-600">
        Auth Status: <strong class="font-semibold">{{ status || 'unknown' }}</strong>
      </p>
      
      <div v-if="status === 'loading'" class="text-gray-500">
        <p>Loading authentication...</p>
      </div>
      <div v-else-if="data?.user" class="text-gray-800">
        <p class="mb-4">
          Logged in as: <strong class="font-semibold">{{ data.user.email }}</strong>
        </p>
        <p class="mb-4">
          Username: <strong class="font-semibold">{{ data.user.name }}</strong>
        </p>
        <button
          type="button"
          @click="handleLogout"
          :disabled="loading"
          class="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none disabled:opacity-60"
        >
          {{ loading ? "Signing out..." : "Sign out" }}
        </button>
      </div>
      <div v-else class="text-gray-600">
        <p>No user data available. Status: {{ status }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const { data, status, signOut } = useAuth();
const loading = ref(false);

async function handleLogout() {
  try {
    loading.value = true;
    await signOut({ callbackUrl: "/login" });
  } finally {
    loading.value = false;
  }
}
</script>

