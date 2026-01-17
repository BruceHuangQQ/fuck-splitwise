<template>
  <div class="mt-6">
    <div v-if="bills.length === 0" class="text-center py-12 text-muted-foreground">
      <p class="text-lg">No bills found</p>
      <p class="text-sm mt-2">{{ type === 'owedToMe' ? 'No one owes you money yet.' : 'You don\'t owe anyone yet.' }}</p>
    </div>
    <div v-else class="space-y-4">
      <BillCard
        v-for="bill in bills"
        :key="bill.id"
        :bill="bill"
        :type="type"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BillCard from './BillCard.vue'
import type { Bill } from './BillCard.vue'

const props = defineProps<{
  type: 'owedToMe' | 'iOwe'
}>()

// Hardcoded mock data matching database schema
const mockBillsOwedToMe: Bill[] = [
  {
    id: '1',
    title: 'Lunch with Sarah',
    totalAmount: '25.50',
    dueDate: new Date('2026-01-15'),
    createdAt: new Date('2026-01-10'),
    participantName: 'Sarah Johnson'
  },
  {
    id: '2',
    title: 'Movie tickets',
    totalAmount: '40.00',
    dueDate: new Date('2026-01-13'),
    createdAt: new Date('2026-01-12'),
    participantName: 'Mike Chen'
  },
  {
    id: '3',
    title: 'Uber ride',
    totalAmount: '18.75',
    dueDate: null,
    createdAt: new Date('2026-01-14'),
    participantName: 'Alex Rivera'
  },
  {
    id: '8',
    title: 'Concert tickets',
    totalAmount: '150.00',
    dueDate: new Date('2026-01-22'),
    createdAt: new Date('2026-01-11'),
    participantName: 'Emma Wilson'
  },
  {
    id: '9',
    title: 'Dinner at Italian restaurant',
    totalAmount: '87.50',
    dueDate: null,
    createdAt: new Date('2026-01-13'),
    participantName: 'David Kim'
  },
  {
    id: '10',
    title: 'Coffee and pastries',
    totalAmount: '12.30',
    dueDate: new Date('2026-01-14'),
    createdAt: new Date('2026-01-12'),
    participantName: 'Lisa Park'
  },
  {
    id: '11',
    title: 'Weekend trip gas money',
    totalAmount: '45.20',
    dueDate: null,
    createdAt: new Date('2026-01-15'),
    participantName: 'Tom Anderson'
  },
  {
    id: '12',
    title: 'Birthday gift contribution',
    totalAmount: '35.00',
    dueDate: new Date('2026-01-17'),
    createdAt: new Date('2026-01-09'),
    participantName: 'Jessica Martinez'
  }
]

const mockBillsIOwe: Bill[] = [
  {
    id: '4',
    title: 'Electricity Bill',
    totalAmount: '80.75',
    dueDate: new Date('2026-01-20'),
    createdAt: new Date('2026-01-05'),
    participantName: 'Roommate',
    amountOwed: '40.38'
  },
  {
    id: '5',
    title: 'Gym Membership',
    totalAmount: '55.00',
    dueDate: null,
    createdAt: new Date('2026-01-01'),
    participantName: 'Friend',
    amountOwed: '55.00'
  },
  {
    id: '6',
    title: 'Groceries',
    totalAmount: '120.50',
    dueDate: new Date('2026-01-18'),
    createdAt: new Date('2026-01-08'),
    participantName: 'Roommate',
    amountOwed: '60.25'
  },
  {
    id: '7',
    title: 'Netflix Subscription',
    totalAmount: '15.99',
    dueDate: null,
    createdAt: new Date('2026-01-10'),
    participantName: 'Friend',
    amountOwed: '15.99'
  },
  {
    id: '13',
    title: 'Internet Bill',
    totalAmount: '89.99',
    dueDate: new Date('2026-01-28'),
    createdAt: new Date('2026-01-07'),
    participantName: 'Roommate',
    amountOwed: '44.99'
  },
  {
    id: '14',
    title: 'Restaurant dinner',
    totalAmount: '95.40',
    dueDate: null,
    createdAt: new Date('2026-01-14'),
    participantName: 'Friend',
    amountOwed: '47.70'
  },
  {
    id: '15',
    title: 'Spotify Family Plan',
    totalAmount: '16.99',
    dueDate: new Date('2026-01-26'),
    createdAt: new Date('2026-01-06'),
    participantName: 'Friend',
    amountOwed: '16.99'
  },
  {
    id: '16',
    title: 'Cleaning supplies',
    totalAmount: '28.50',
    dueDate: null,
    createdAt: new Date('2026-01-11'),
    participantName: 'Roommate',
    amountOwed: '14.25'
  },
  {
    id: '17',
    title: 'Parking fee',
    totalAmount: '12.00',
    dueDate: new Date('2026-01-16'),
    createdAt: new Date('2026-01-13'),
    participantName: 'Friend',
    amountOwed: '12.00'
  },
  {
    id: '18',
    title: 'Water bill',
    totalAmount: '65.20',
    dueDate: null,
    createdAt: new Date('2026-01-04'),
    participantName: 'Roommate',
    amountOwed: '32.60'
  }
]

const bills = computed(() => {
  return props.type === 'owedToMe' ? mockBillsOwedToMe : mockBillsIOwe
})
</script>

