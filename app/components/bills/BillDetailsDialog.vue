<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{{ bill?.title || 'Bill Details' }}</DialogTitle>
        <DialogDescription v-if="bill">
          Created on {{ formatDate(bill.createdAt) }}
        </DialogDescription>
      </DialogHeader>

      <div v-if="loading" class="py-8 text-center text-muted-foreground">
        Loading...
      </div>

      <div v-else-if="error" class="py-8 text-center text-destructive">
        {{ error }}
      </div>

      <div v-else-if="bill" class="space-y-6">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-muted-foreground">Total Amount</p>
            <p class="text-2xl font-bold">{{ formatCurrency(bill.totalAmount) }}</p>
          </div>
          <div>
            <p class="text-sm text-muted-foreground">Due Date</p>
            <p class="text-lg font-medium">
              {{ bill.dueDate ? formatDate(bill.dueDate) : 'No due date' }}
            </p>
          </div>
        </div>

        <div>
          <h3 class="text-sm font-semibold mb-3">Participants</h3>
          <div class="space-y-2">
            <div
              v-for="participant in bill.participants"
              :key="participant.userId"
              class="flex items-center justify-between p-3 border rounded-lg"
            >
              <div>
                <p class="font-medium">{{ participant.displayName }}</p>
                <p class="text-sm text-muted-foreground">{{ participant.email }}</p>
              </div>
              <p class="text-lg font-semibold">{{ formatCurrency(participant.amountOwed) }}</p>
            </div>
          </div>
        </div>

        <div v-if="isOwner" class="flex gap-3 pt-4 border-t">
          <Button
            variant="outline"
            @click="handleEdit"
          >
            <Edit class="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="destructive"
            @click="handleDelete"
            :disabled="isDeleting"
          >
            <Trash2 class="h-4 w-4 mr-2" />
            {{ isDeleting ? 'Deleting...' : 'Delete' }}
          </Button>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="close">Close</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Edit, Trash2 } from 'lucide-vue-next'

export interface BillParticipant {
  userId: string
  amountOwed: string
  email: string
  displayName: string
}

export interface BillDetails {
  id: string
  title: string
  totalAmount: string
  dueDate: string | null
  createdAt: string
  ownerUserId: string
  participants: BillParticipant[]
}

const props = defineProps<{
  billId: string | null
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  edit: [billId: string]
  deleted: []
}>()

const { user } = useUserSession()
const bill = ref<BillDetails | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const isDeleting = ref(false)

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

const isOwner = computed(() => {
  return bill.value && user.value && bill.value.ownerUserId === user.value.id
})

watch(() => props.billId, async (newBillId) => {
  if (newBillId && props.open) {
    await fetchBillDetails(newBillId)
  } else {
    bill.value = null
    error.value = null
  }
}, { immediate: true })

watch(() => props.open, async (isOpen) => {
  if (isOpen && props.billId) {
    await fetchBillDetails(props.billId)
  }
})

async function fetchBillDetails(billId: string) {
  loading.value = true
  error.value = null
  try {
    bill.value = await $fetch<BillDetails>(`/api/bills/${billId}`)
  } catch (err: any) {
    error.value = err.data?.error || 'Failed to load bill details'
    console.error('Failed to fetch bill:', err)
  } finally {
    loading.value = false
  }
}

function formatCurrency(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return `$${num.toFixed(2)}`
}

function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function handleEdit() {
  if (bill.value) {
    emit('edit', bill.value.id)
    close()
  }
}

async function handleDelete() {
  if (!bill.value || !confirm('Are you sure you want to delete this bill? This action cannot be undone.')) {
    return
  }

  isDeleting.value = true
  try {
    await $fetch(`/api/bills/${bill.value.id}`, {
      method: 'DELETE'
    })
    emit('deleted')
    close()
  } catch (err: any) {
    alert(err.data?.error || 'Failed to delete bill')
    console.error('Failed to delete bill:', err)
  } finally {
    isDeleting.value = false
  }
}

function close() {
  isOpen.value = false
}
</script>

