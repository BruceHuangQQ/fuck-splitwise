<template>
  <div class="min-h-screen p-8">
    <!-- Header with avatar -->
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-3xl font-semibold tracking-tight">Welcome to Fuck Splitwise</h1>
      <div v-if="user" class="flex items-center gap-3">
        <Avatar v-if="user">
          <AvatarImage :src="(user as any).image" :alt="user.name || user.email || 'User'" />
          <AvatarFallback>
            {{ getInitials(user.name || user.email || 'U') }}
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
    
    <div class="bg-gray-100 p-6 rounded-lg border border-gray-300">
      <p class="mb-4 text-gray-600">
        Auth Status: <strong class="font-semibold">{{ loggedIn ? 'authenticated' : 'not authenticated' }}</strong>
      </p>
      
      <div v-if="!ready" class="text-gray-500">
        <p>Loading authentication...</p>
      </div>
      <div v-else-if="user" class="text-gray-800">
        <p class="mb-4">
          Logged in as: <strong class="font-semibold">{{ user.email }}</strong>
        </p>
        <p class="mb-4">
          Username: <strong class="font-semibold">{{ user.name }}</strong>
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
        <p>No user data available.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const { loggedIn, user, ready, clear } = useUserSession();
const loading = ref(false);

function getInitials(name: string): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/).filter(p => p.length > 0);
  if (parts.length >= 2) {
    const firstPart = parts[0];
    const lastPart = parts[parts.length - 1];
    if (firstPart && lastPart && firstPart[0] && lastPart[0]) {
      return (firstPart[0] + lastPart[0]).toUpperCase();
    }
  }
  if (name.length >= 2) {
    return name.substring(0, 2).toUpperCase();
  }
  return name.substring(0, 1).toUpperCase() || "U";
}

async function handleLogout() {
  try {
    loading.value = true;
    await clear();
    await navigateTo("/login");
  } finally {
    loading.value = false;
  }
}
</script>

