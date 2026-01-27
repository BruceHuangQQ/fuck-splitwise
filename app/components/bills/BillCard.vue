<template>
  <div
    class="rounded-lg border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    @click="$emit('click', bill.id)"
  >
    <div class="flex items-start justify-between mb-4">
      <div class="flex-1">
        <h3 class="text-lg font-semibold text-card-foreground mb-1">
          {{ bill.title }}
        </h3>
        <p
          v-if="bill.participantName && type === 'iOwe'"
          class="text-sm text-muted-foreground"
        >
          You owe: {{ bill.participantName }}
        </p>
        <p
          v-if="type === 'owedToMe' && bill.participantCount !== undefined"
          class="text-sm text-muted-foreground"
        >
          {{
            bill.participantCount === 1
              ? '1 person owes you'
              : `${bill.participantCount} people owe you`
          }}
        </p>
      </div>
      <div class="text-right">
        <div
          :class="[
            'text-2xl font-bold',
            type === 'owedToMe' ? 'text-green-600' : 'text-red-600'
          ]"
        >
          {{ formattedAmount }}
        </div>
      </div>
    </div>

    <div class="flex items-center gap-4 text-sm text-muted-foreground">
      <div v-if="bill.dueDate" class="flex items-center gap-1">
        <span>Due:</span>
        <span class="font-medium">{{ formattedDueDate }}</span>
      </div>
      <div
        v-if="type === 'iOwe' && bill.amountOwed"
        class="flex items-center gap-1"
      >
        <span>Your share:</span>
        <span class="font-medium"
          >${{ parseFloat(bill.amountOwed).toFixed(2) }}</span
        >
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface Bill {
  id: string
  title: string
  totalAmount: string
  dueDate: Date | null
  createdAt: Date
  participantName?: string
  amountOwed?: string
  participantCount?: number
}

const props = defineProps<{
  bill: Bill
  type: 'owedToMe' | 'iOwe'
}>()

defineEmits<{
  click: [billId: string]
}>()

const formattedAmount = computed(() => {
  const amount = parseFloat(props.bill.totalAmount)
  return `$${amount.toFixed(2)}`
})

const formattedDueDate = computed(() => {
  if (!props.bill.dueDate) return 'No due date'
  const date = new Date(props.bill.dueDate)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
})
</script>
