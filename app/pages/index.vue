<template>
  <div class="h-[100dvh] flex flex-col relative">
    <!-- Fixed Header Section (non-scrollable) -->
    <div class="flex-shrink-0 px-4 sm:px-6 md:px-8 pt-4 sm:pt-6 md:pt-8 pb-4 sm:pb-6 bg-background">
      <!-- Title and Avatar -->
      <div class="mb-4 sm:mb-6 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <img
            src="/logo.svg"
            alt="Fuck Splitwise Logo"
            class="h-8 w-8 sm:h-10 sm:w-10"
          />
          <h1 class="text-2xl sm:text-3xl font-semibold tracking-tight">Fuck Splitwise</h1>
        </div>
        <div v-if="user" class="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            :disabled="loading"
            @click="handleRefresh"
            class="rounded-full"
            title="Refresh bills"
          >
            <RefreshCw :class="['h-4 w-4', loading && 'animate-spin']" />
            <span class="sr-only">Refresh bills</span>
          </Button>
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
      
      <!-- Tabs (non-scrollable) -->
      <div class="flex-shrink-0">
        <BillsTabs v-model="activeTab" />
      </div>
    </div>

    <!-- Scrollable Bill List Area -->
    <div class="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 md:px-8 pb-20 sm:pb-8">
      <div class="py-4 sm:py-6">
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
    </div>

    <!-- Floating Action Button (only on owedToMe tab) -->
    <Button
      v-if="activeTab === 'owedToMe'"
      class="absolute right-4 sm:right-6 md:right-8 bottom-4 sm:bottom-6 md:bottom-8 z-50 rounded-full shadow-lg h-14 w-14 flex items-center justify-center"
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
import { Plus, LogOut, RefreshCw } from "lucide-vue-next";
import { useBills } from "@/composables/useBills";

const { user, clear } = useUserSession();
const activeTab = ref<"owedToMe" | "iOwe">("owedToMe");

const { loading, fetchBills } = useBills();
const createBillRef = ref<{ handleCreateClick: () => void } | null>(null)

function handleRefresh() {
  fetchBills()
}

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

