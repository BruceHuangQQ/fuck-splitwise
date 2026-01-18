<template>
  <div class="relative">
    <div v-if="loading" class="text-center py-12 text-muted-foreground">
      <p>Loading bills...</p>
    </div>
    <div
      v-else-if="bills.length === 0"
      class="text-center py-12 text-muted-foreground"
    >
      <p class="text-lg">No bills found</p>
      <p class="text-sm mt-2">
        {{
          type === 'owedToMe'
            ? 'No one owes you money yet.'
            : "You don't owe anyone yet."
        }}
      </p>
    </div>
    <div v-else class="space-y-4">
      <BillCard
        v-for="bill in bills"
        :key="bill.id"
        :bill="bill"
        :type="type"
        @click="handleBillClick"
      />
    </div>

    <!-- Bill Details Dialog -->
    <BillDetailsDialog
      :bill-id="selectedBillId"
      :open="detailsDialogOpen"
      @update:open="detailsDialogOpen = $event"
      @edit="handleEdit"
    />

    <!-- Create/Edit Bill Dialog -->
    <Dialog v-model:open="formDialogOpen">
      <DialogContent
        class="max-w-[calc(100%-0.5rem)] sm:max-w-lg md:max-w-2xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6"
      >
        <DialogHeader>
          <DialogTitle>{{
            editingBillId ? 'Edit Bill' : 'Create New Bill'
          }}</DialogTitle>
          <DialogDescription>
            {{
              editingBillId
                ? 'Update the bill details below.'
                : 'Fill in the details to create a new bill.'
            }}
          </DialogDescription>
        </DialogHeader>
        <BillForm
          :initial-data="formInitialData"
          :is-edit="!!editingBillId"
          :is-submitting="isSubmittingBill"
          @submit="handleFormSubmit"
          @cancel="formDialogOpen = false"
        />
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import BillCard from './BillCard.vue'
import BillDetailsDialog from './BillDetailsDialog.vue'
import BillForm from './BillForm.vue'
import type { BillFormData } from './BillForm.vue'
import { useBills } from '@/composables/useBills'

interface User {
  id: string
  email: string
  displayName: string
}

const props = defineProps<{
  type: 'owedToMe' | 'iOwe'
}>()

const {
  loading,
  owedToMeBills,
  iOweBills,
  fetchBills,
  optimisticallyAddBill,
  optimisticallyUpdateBill,
  optimisticallyRemoveBill,
  replaceTempBillWithRealBill,
  fetchUserDetails
} = useBills()

const users = ref<User[]>([])

onMounted(async () => {
  try {
    users.value = await $fetch<User[]>('/api/users')
  } catch (error) {
    console.error('Failed to fetch users:', error)
  }
})

const bills = computed(() => {
  return props.type === 'owedToMe' ? owedToMeBills.value : iOweBills.value
})

const selectedBillId = ref<string | null>(null)
const detailsDialogOpen = ref(false)
const formDialogOpen = ref(false)
const editingBillId = ref<string | null>(null)
const formInitialData = ref<BillFormData | undefined>(undefined)
const isSubmittingBill = ref(false)

function handleBillClick(billId: string) {
  selectedBillId.value = billId
  detailsDialogOpen.value = true
}

function handleCreateClick() {
  editingBillId.value = null
  formInitialData.value = undefined
  formDialogOpen.value = true
}

async function handleEdit(billId: string) {
  try {
    const billDetails = await $fetch<
      | {
          title: string
          totalAmount: string
          dueDate: string | null
          participants: any[]
        }
      | { error: string }
    >(`/api/bills/${billId}`)
    if ('error' in billDetails) {
      throw new Error(String(billDetails.error))
    }
    const dueDateStr: string = billDetails.dueDate
      ? new Date(billDetails.dueDate).toISOString().split('T')[0] || ''
      : ''
    formInitialData.value = {
      title: billDetails.title,
      totalAmount: billDetails.totalAmount,
      dueDate: dueDateStr,
      participants: billDetails.participants.map((p: any) => ({
        userId: p.userId,
        amountOwed: String(p.amountOwed || '0')
      }))
    }
    editingBillId.value = billId
    formDialogOpen.value = true
  } catch (error) {
    console.error('Failed to load bill for editing:', error)
    alert('Failed to load bill details')
  }
}

async function handleFormSubmit(data: BillFormData) {
  isSubmittingBill.value = true
  let rollback: (() => void) | null = null

  try {
    // Get user info for participants
    const participantsWithUserInfo = await Promise.all(
      data.participants.map(async (p) => {
        const user =
          users.value.find((u) => u.id === p.userId) ||
          (await fetchUserDetails(p.userId))
        if (!user) {
          throw new Error(`User not found: ${p.userId}`)
        }
        return {
          userId: p.userId,
          amountOwed: p.amountOwed,
          email: user.email,
          displayName: user.displayName
        }
      })
    )

    const { user } = useUserSession()
    if (!user.value?.id) {
      throw new Error('User not authenticated')
    }

    if (editingBillId.value) {
      // Optimistic update for edit
      rollback = optimisticallyUpdateBill(
        editingBillId.value,
        {
          title: data.title,
          totalAmount: data.totalAmount,
          dueDate: data.dueDate || null
        },
        participantsWithUserInfo
      )

      // Update existing bill - no refresh needed, optimistic state is already correct
      await $fetch(`/api/bills/${editingBillId.value}`, {
        method: 'PUT',
        body: {
          title: data.title,
          totalAmount: parseFloat(data.totalAmount),
          dueDate: data.dueDate || null,
          participants: data.participants.map((p) => ({
            userId: p.userId,
            amountOwed: parseFloat(p.amountOwed)
          }))
        }
      })
      // Keep optimistic state - no refresh needed
    } else {
      // Optimistic update for create
      const tempId = `temp-${Date.now()}`
      rollback = optimisticallyAddBill(
        {
          id: tempId,
          ownerUserId: user.value.id,
          title: data.title,
          totalAmount: data.totalAmount,
          dueDate: data.dueDate || null
        },
        participantsWithUserInfo
      )

      // Create new bill
      const response = await $fetch<{
        success: boolean
        bill: {
          id: string
          createdAt: string
          dueDate: string | null
          totalAmount: string
        }
      }>('/api/bills', {
        method: 'POST',
        body: {
          title: data.title,
          totalAmount: parseFloat(data.totalAmount),
          dueDate: data.dueDate || null,
          participants: data.participants.map((p) => ({
            userId: p.userId,
            amountOwed: parseFloat(p.amountOwed)
          }))
        }
      })

      // Replace temp ID with real server data (ID, createdAt, dueDate, totalAmount)
      // This syncs the optimistic bill with the actual server response
      if (response.bill) {
        replaceTempBillWithRealBill(tempId, response.bill)
      }
    }

    formDialogOpen.value = false
    editingBillId.value = null
    formInitialData.value = undefined
    rollback = null // Clear rollback since we succeeded
  } catch (error: any) {
    console.error('Failed to save bill:', error)
    // Rollback optimistic update on error
    if (rollback) {
      rollback()
    }
    alert(error.data?.error || 'Failed to save bill')
  } finally {
    isSubmittingBill.value = false
  }
}

defineExpose({
  handleCreateClick
})
</script>
