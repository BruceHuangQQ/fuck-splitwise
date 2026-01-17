<template>
  <div class="min-h-screen p-8">
    <!-- Header with avatar -->
    <div class="mb-15 flex items-center justify-between">
      <h1 class="text-3xl font-semibold tracking-tight">Fuck Splitwise</h1>
      <div v-if="user" class="flex items-center gap-3">
        <Avatar v-if="user">
          <AvatarImage v-if="user.image" :src="user.image" :alt="user.name || user.email || 'User'" />
          <AvatarFallback>
            {{ getInitials(user.name || user.email || 'U') }}
          </AvatarFallback>
        </Avatar>
      </div>

    </div>
    
    <BillsTabs v-model="activeTab" />

    <BillsList
      v-if="activeTab === 'owedToMe'"
      type="owedToMe"
    />

    <BillsList
      v-else
      type="iOwe"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const { loggedIn, user, ready, clear } = useUserSession();
const activeTab = ref<"owedToMe" | "iOwe">("owedToMe");

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
</script>

