<template>
  <div class="min-h-[100dvh] flex flex-col p-8 relative overflow-hidden pb-24 md:pb-8">
    <!-- Header with avatar -->
    <div class="mb-6 flex items-center justify-between flex-shrink-0">
      <h1 class="text-3xl font-semibold tracking-tight">Fuck Splitwise</h1>
      <div v-if="user" class="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <button class="rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
              <Avatar>
                <AvatarImage v-if="user.image" :src="user.image" :alt="user.name || user.email || 'User'" />
                <AvatarFallback>
                  {{ getInitials(user.name || user.email || 'U') }}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-56">
            <DropdownMenuLabel>
              <div class="flex flex-col space-y-1">
                <p class="text-sm font-medium leading-none">{{ user.name || 'User' }}</p>
                <p class="text-xs leading-none text-muted-foreground">{{ user.email }}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem @click="handleLogout" class="cursor-pointer">
              <LogOut class="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

    </div>
    
    <div class="flex-shrink-0 mb-6">
      <BillsTabs v-model="activeTab" />
    </div>

    <div class="flex-1 overflow-y-auto min-h-0">
      <BillsList
        v-if="activeTab === 'owedToMe'"
        ref="createBillRef"
        type="owedToMe"
      />

      <BillsList
        v-else
        type="iOwe"
      />
    </div>

    <!-- Floating Action Button (only on owedToMe tab) -->
    <Button
      v-if="activeTab === 'owedToMe'"
      class="fixed right-6 z-50 rounded-full shadow-lg h-14 w-14 flex items-center justify-center bottom-[calc(env(safe-area-inset-bottom)+1.5rem)] md:absolute md:bottom-8 md:right-8"
      size="icon"
      @click="handleCreate"
    >
      <Plus class="h-6 w-6" />
      <span class="sr-only">Create new bill</span>
    </Button>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, LogOut } from "lucide-vue-next";

const { loggedIn, user, ready, clear } = useUserSession();
const activeTab = ref<"owedToMe" | "iOwe">("owedToMe");

const createBillRef = ref<{ handleCreateClick: () => void } | null>(null)

function handleCreate() {
  createBillRef.value?.handleCreateClick()
}

async function handleLogout() {
  await clear()
  await navigateTo('/login')
}

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

