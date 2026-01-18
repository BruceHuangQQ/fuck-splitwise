<template>
  <div class="relative">
    <div v-if="loading" class="text-center py-12 text-muted-foreground">
      <p>Loading bills...</p>
    </div>
    <div v-else-if="bills.length === 0" class="text-center py-12 text-muted-foreground">
      <p class="text-lg">No bills found</p>
      <p class="text-sm mt-2">{{ type === 'owedToMe' ? 'No one owes you money yet.' : 'You don\'t owe anyone yet.' }}</p>
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
      @deleted="handleBillDeleted"
    />

    <!-- Create/Edit Bill Dialog -->
    <Dialog v-model:open="formDialogOpen">
      <DialogContent class="max-w-[calc(100%-0.5rem)] sm:max-w-lg md:max-w-2xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>{{ editingBillId ? 'Edit Bill' : 'Create New Bill' }}</DialogTitle>
          <DialogDescription>
            {{ editingBillId ? 'Update the bill details below.' : 'Fill in the details to create a new bill.' }}
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
import { ref, computed } from 'vue'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import BillCard from './BillCard.vue'
import BillDetailsDialog from './BillDetailsDialog.vue'
import BillForm from './BillForm.vue'
import type { BillFormData } from './BillForm.vue'
import { useBills } from '@/composables/useBills'

const props = defineProps<{
  type: 'owedToMe' | 'iOwe'
}>()

const { loading, owedToMeBills, iOweBills, fetchBills } = useBills()

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
    const billDetails = await $fetch<{ title: string, totalAmount: string, dueDate: string | null, participants: any[] } | { error: string }>(`/api/bills/${billId}`)
    if ('error' in billDetails) {
      throw new Error(String(billDetails.error))
    }
    const dueDateStr: string = billDetails.dueDate ? new Date(billDetails.dueDate).toISOString().split('T')[0] || '' : ''
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
  try {
    if (editingBillId.value) {
      // Update existing bill
      await $fetch(`/api/bills/${editingBillId.value}`, {
        method: 'PUT',
        body: {
          title: data.title,
          totalAmount: parseFloat(data.totalAmount),
          dueDate: data.dueDate || null,
          participants: data.participants.map(p => ({
            userId: p.userId,
            amountOwed: parseFloat(p.amountOwed)
          }))
        }
      })
    } else {
      // Create new bill
      await $fetch('/api/bills', {
        method: 'POST',
        body: {
          title: data.title,
          totalAmount: parseFloat(data.totalAmount),
          dueDate: data.dueDate || null,
          participants: data.participants.map(p => ({
            userId: p.userId,
            amountOwed: parseFloat(p.amountOwed)
          }))
        }
      })
    }
    
    formDialogOpen.value = false
    editingBillId.value = null
    formInitialData.value = undefined
    await fetchBills() // Refresh the list
  } catch (error: any) {
    console.error('Failed to save bill:', error)
    alert(error.data?.error || 'Failed to save bill')
  } finally {
    isSubmittingBill.value = false
  }
}

function handleBillDeleted() {
  fetchBills() // Refresh the list
}

defineExpose({
  handleCreateClick
})
</script>
