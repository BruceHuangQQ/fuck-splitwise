<template>
  <div class="relative w-full">
    <div class="grid grid-cols-2 relative border-b border-border">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        type="button"
        :class="[
          'relative py-4 px-6 text-sm font-medium transition-colors',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          modelValue === tab.value
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        ]"
        @click="$emit('update:modelValue', tab.value)"
      >
        <span class="flex flex-col items-start">
          <span>{{ tab.label }}</span>
          <span class="text-xs text-muted-foreground">
            {{ tab.subtitle }}
          </span>
        </span>
      </button>

      <!-- Sliding indicator -->
      <div
        class="absolute bottom-0 left-0 h-0.5 bg-primary transition-transform duration-300 ease-in-out"
        :style="{
          width: `${100 / tabs.length}%`,
          transform: `translateX(${activeIndex * 100}%)`
        }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: 'owedToMe' | 'iOwe'
}>()

defineEmits<{
  'update:modelValue': [value: 'owedToMe' | 'iOwe']
}>()

const tabs = [
  {
    label: 'Owed To Me',
    subtitle: 'People who owe you',
    value: 'owedToMe' as const
  },
  {
    label: 'I Owe',
    subtitle: 'You need to pay',
    value: 'iOwe' as const
  }
]

const activeIndex = computed(() => {
  return tabs.findIndex((tab) => tab.value === props.modelValue)
})
</script>
