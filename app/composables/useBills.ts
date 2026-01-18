import { ref, computed, readonly, watch } from 'vue'
import { useDocumentVisibility, useIntervalFn } from '@vueuse/core'

export interface BillParticipant {
  userId: string
  amountOwed: string
  email: string
  displayName: string
}

export interface BillWithParticipants {
  id: string
  ownerUserId: string
  title: string
  totalAmount: string
  dueDate: string | null
  createdAt: string
  participants: BillParticipant[]
}

export interface BillParticipantRecord {
  billId: string
  userId: string
  amountOwed: string
}

export interface BillsData {
  owns: BillWithParticipants[]
  owes: Array<{
    bill: BillWithParticipants
    participant: BillParticipantRecord
  }>
}

const billsData = ref<BillsData | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const lastFetchTime = ref<Date | null>(null)

// Stale threshold: 45 seconds (between 30-60s as requested)
const STALE_THRESHOLD_MS = 45 * 1000

// Singleton setup flag
let isInitialized = false
let hasInitialFetch = false

async function fetchBills() {
  loading.value = true
  error.value = null
  try {
    const response = await $fetch<BillsData>('/api/bills')
    billsData.value = response
    lastFetchTime.value = new Date()
  } catch (err: any) {
    error.value = err.data?.error || 'Failed to fetch bills'
    console.error('Failed to fetch bills:', err)
  } finally {
    loading.value = false
  }
}

function isStale(): boolean {
  if (!lastFetchTime.value) return true
  const now = new Date()
  const age = now.getTime() - lastFetchTime.value.getTime()
  return age > STALE_THRESHOLD_MS
}

export function useBills() {
  // Initialize watchers and intervals only once
  if (!isInitialized && import.meta.client) {
    isInitialized = true
    const visibility = useDocumentVisibility()

    // Refresh on visibility change if stale
    watch(visibility, (isVisible) => {
      if (isVisible && isStale()) {
        fetchBills()
      }
    })

    // Interval refresh (45 seconds)
    useIntervalFn(() => {
      if (!loading.value) {
        fetchBills()
      }
    }, STALE_THRESHOLD_MS)
  }

  // Auto-fetch on first use if data is not loaded
  if (import.meta.client && !hasInitialFetch && !billsData.value && !loading.value) {
    hasInitialFetch = true
    fetchBills()
  }

  // Computed properties for filtered bills
  const owedToMeBills = computed(() => {
    if (!billsData.value) return []
    return billsData.value.owns.map(bill => {
      // Get first participant (who owes)
      const firstParticipant = bill.participants.find(p => p.userId !== bill.ownerUserId) || bill.participants[0]
      return {
        id: bill.id,
        title: bill.title,
        totalAmount: bill.totalAmount,
        dueDate: bill.dueDate ? new Date(bill.dueDate) : null,
        createdAt: new Date(bill.createdAt),
        participantName: firstParticipant?.displayName || 'Unknown'
      }
    })
  })

  const iOweBills = computed(() => {
    if (!billsData.value) return []
    return billsData.value.owes.map(({ bill, participant }) => {
      const ownerParticipant = bill.participants.find(p => p.userId === bill.ownerUserId)
      return {
        id: bill.id,
        title: bill.title,
        totalAmount: bill.totalAmount,
        dueDate: bill.dueDate ? new Date(bill.dueDate) : null,
        createdAt: new Date(bill.createdAt),
        participantName: ownerParticipant?.displayName || 'Unknown',
        amountOwed: participant.amountOwed
      }
    })
  })

  return {
    billsData: readonly(billsData),
    loading: readonly(loading),
    error: readonly(error),
    lastFetchTime: readonly(lastFetchTime),
    fetchBills,
    isStale,
    owedToMeBills,
    iOweBills,
  }
}
