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

// Helper to fetch user details for participants
async function fetchUserDetails(
  userId: string
): Promise<{ id: string; email: string; displayName: string } | null> {
  try {
    const users =
      await $fetch<Array<{ id: string; email: string; displayName: string }>>(
        '/api/users'
      )
    return users.find((u) => u.id === userId) || null
  } catch (err) {
    console.error('Failed to fetch user details:', err)
    return null
  }
}

// Optimistic update: Add a new bill
function optimisticallyAddBill(
  billData: Omit<BillWithParticipants, 'id' | 'createdAt' | 'participants'> & {
    id?: string
    createdAt?: string
  },
  participantsWithUserInfo: Array<{
    userId: string
    amountOwed: string
    email: string
    displayName: string
  }>
): () => void {
  if (!billsData.value) {
    billsData.value = { owns: [], owes: [] }
  }

  const tempId = billData.id || `temp-${Date.now()}`
  const newBill: BillWithParticipants = {
    id: tempId,
    ownerUserId: billData.ownerUserId,
    title: billData.title,
    totalAmount: billData.totalAmount,
    dueDate: billData.dueDate,
    createdAt: billData.createdAt || new Date().toISOString(),
    participants: participantsWithUserInfo.map((p) => ({
      userId: p.userId,
      amountOwed: p.amountOwed,
      email: p.email,
      displayName: p.displayName
    }))
  } as BillWithParticipants

  // Save current state for rollback
  const previousState = billsData.value
    ? JSON.parse(JSON.stringify(billsData.value))
    : null

  // Add to owns array
  billsData.value.owns = [...billsData.value.owns, newBill]

  // If user is also a participant, add to owes array
  const userParticipant = participantsWithUserInfo.find(
    (p) => p.userId !== billData.ownerUserId
  )
  if (userParticipant) {
    billsData.value.owes = [
      ...billsData.value.owes,
      {
        bill: newBill,
        participant: {
          billId: tempId,
          userId: userParticipant.userId,
          amountOwed: userParticipant.amountOwed
        }
      }
    ]
  }

  // Return rollback function
  return () => {
    if (previousState) {
      billsData.value = previousState
    } else {
      billsData.value = { owns: [], owes: [] }
    }
  }
}

// Optimistic update: Update an existing bill
function optimisticallyUpdateBill(
  billId: string,
  updates: Partial<
    Pick<BillWithParticipants, 'title' | 'totalAmount' | 'dueDate'>
  >,
  participantsWithUserInfo?: Array<{
    userId: string
    amountOwed: string
    email: string
    displayName: string
  }>
): () => void {
  if (!billsData.value) {
    return () => {}
  }

  // Save current state for rollback
  const previousState = JSON.parse(JSON.stringify(billsData.value))

  // Update in owns array
  const ownsIndex = billsData.value.owns.findIndex((b) => b.id === billId)
  if (ownsIndex !== -1) {
    const existingBill = billsData.value.owns[ownsIndex]
    if (existingBill) {
      const updatedBill: BillWithParticipants = {
        ...existingBill,
        ...updates,
        participants: participantsWithUserInfo
          ? participantsWithUserInfo.map((p) => ({
              userId: p.userId,
              amountOwed: p.amountOwed,
              email: p.email,
              displayName: p.displayName
            }))
          : existingBill.participants
      }
      billsData.value.owns[ownsIndex] = updatedBill

      // Update in owes array if it exists there
      const owesIndex = billsData.value.owes.findIndex(
        (item) => item.bill.id === billId
      )
      if (owesIndex !== -1 && billsData.value.owes[owesIndex]) {
        billsData.value.owes[owesIndex] = {
          bill: updatedBill,
          participant: billsData.value.owes[owesIndex].participant
        }
      }
    }
  }

  // Return rollback function
  return () => {
    billsData.value = previousState
  }
}

// Optimistic update: Remove a bill
function optimisticallyRemoveBill(billId: string): () => void {
  if (!billsData.value) {
    return () => {}
  }

  // Save current state for rollback
  const previousState = JSON.parse(JSON.stringify(billsData.value))

  // Remove from owns array
  billsData.value.owns = billsData.value.owns.filter((b) => b.id !== billId)

  // Remove from owes array
  billsData.value.owes = billsData.value.owes.filter(
    (item) => item.bill.id !== billId
  )

  // Return rollback function
  return () => {
    billsData.value = previousState
  }
}

// Replace temp bill with real bill from server (for create operations)
// This function finds the bill with the temp ID and replaces it with server data
// It updates: id (temp -> real), createdAt (client -> server), dueDate, totalAmount
function replaceTempBillWithRealBill(
  tempId: string,
  realBill: {
    id: string
    createdAt: string
    dueDate: string | null
    totalAmount?: string
  }
) {
  if (!billsData.value) {
    return
  }

  // Find the optimistic bill in the owns array by temp ID
  const ownsIndex = billsData.value.owns.findIndex((b) => b.id === tempId)
  if (ownsIndex !== -1 && billsData.value.owns[ownsIndex]) {
    const existingBill = billsData.value.owns[ownsIndex]

    // Replace temp ID with real ID and sync server fields
    billsData.value.owns[ownsIndex] = {
      ...existingBill,
      id: realBill.id, // Replace temp ID with real UUID
      createdAt: realBill.createdAt, // Use server's createdAt timestamp
      dueDate: realBill.dueDate, // Use server's dueDate (may be normalized)
      totalAmount: realBill.totalAmount || existingBill.totalAmount // Use server's totalAmount if provided
    }

    // Also update in owes array if the user is a participant
    const owesIndex = billsData.value.owes.findIndex(
      (item) => item.bill.id === tempId
    )
    if (owesIndex !== -1 && billsData.value.owes[owesIndex]) {
      billsData.value.owes[owesIndex] = {
        bill: billsData.value.owns[ownsIndex], // Use the updated bill from owns array
        participant: {
          ...billsData.value.owes[owesIndex].participant,
          billId: realBill.id // Update participant's billId reference
        }
      }
    }
  }
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
  if (
    import.meta.client &&
    !hasInitialFetch &&
    !billsData.value &&
    !loading.value
  ) {
    hasInitialFetch = true
    fetchBills()
  }

  // Computed properties for filtered bills
  const owedToMeBills = computed(() => {
    if (!billsData.value) return []
    return billsData.value.owns.map((bill) => {
      // Get first participant (who owes)
      const firstParticipant =
        bill.participants.find((p) => p.userId !== bill.ownerUserId) ||
        bill.participants[0]
      // Count participants excluding the owner
      const participantCount = bill.participants.filter(
        (p) => p.userId !== bill.ownerUserId
      ).length
      return {
        id: bill.id,
        title: bill.title,
        totalAmount: bill.totalAmount,
        dueDate: bill.dueDate ? new Date(bill.dueDate) : null,
        createdAt: new Date(bill.createdAt),
        participantName: firstParticipant?.displayName || 'Unknown',
        participantCount
      }
    })
  })

  const iOweBills = computed(() => {
    if (!billsData.value) return []
    return (
      billsData.value.owes
        // Filter out bills where the owner is also a participant (user owes themselves)
        .filter(
          ({ bill, participant }) => participant.userId !== bill.ownerUserId
        )
        .map(({ bill, participant }) => {
          const ownerParticipant = bill.participants.find(
            (p) => p.userId === bill.ownerUserId
          )
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
    )
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
    optimisticallyAddBill,
    optimisticallyUpdateBill,
    optimisticallyRemoveBill,
    replaceTempBillWithRealBill,
    fetchUserDetails
  }
}
