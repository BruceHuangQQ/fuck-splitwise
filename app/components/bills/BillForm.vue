<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <Field>
      <FieldLabel>Title</FieldLabel>
      <Input
        v-model="formData.title"
        placeholder="Enter bill title"
        required
        :disabled="isSubmitting"
      />
      <FieldDescription>Enter a descriptive name for this bill</FieldDescription>
      <FieldError v-if="errors.title">{{ errors.title }}</FieldError>
    </Field>

    <Field>
      <FieldLabel>Total Amount</FieldLabel>
      <Input
        v-model="formData.totalAmount"
        type="number"
        step="0.01"
        min="0"
        placeholder="0.00"
        required
        :disabled="isSubmitting"
      />
      <FieldDescription>Total amount of the bill</FieldDescription>
      <FieldError v-if="errors.totalAmount">{{ errors.totalAmount }}</FieldError>
    </Field>

    <Field>
      <FieldLabel>Due Date (Optional)</FieldLabel>
      <Input
        v-model="formData.dueDate"
        type="date"
        :disabled="isSubmitting"
      />
      <FieldDescription>When is this bill due?</FieldDescription>
      <FieldError v-if="errors.dueDate">{{ errors.dueDate }}</FieldError>
    </Field>

    <Field>
      <FieldLabel>Participants</FieldLabel>
      <FieldDescription>Add participants and their share of the bill</FieldDescription>
      <div class="space-y-3 mt-2">
        <div
          v-for="(participant, index) in formData.participants"
          :key="index"
          class="flex gap-3 items-end"
        >
          <div class="flex-1">
            <Select v-model="participant.userId" required :disabled="isSubmitting">
              <SelectTrigger>
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
               <SelectContent>
                 <SelectItem
                   v-for="user in users"
                   :key="user.id"
                   :value="user.id"
                 >
                   <span class="flex items-center gap-2">
                     <span>{{ user.displayName }}</span>
                     <span class="text-muted-foreground text-xs truncate max-w-[120px]">
                       ({{ truncateEmail(user.email) }})
                     </span>
                   </span>
                 </SelectItem>
               </SelectContent>
            </Select>
          </div>
          <div class="w-32">
            <Input
              v-model="participant.amountOwed"
              type="number"
              step="0.01"
              min="0"
              placeholder="Amount"
              required
              :disabled="isSubmitting"
            />
          </div>
          <Button
            v-if="formData.participants.length > 1"
            type="button"
            variant="ghost"
            size="icon"
            @click="removeParticipant(index)"
            :disabled="isSubmitting"
          >
            <X class="h-4 w-4" />
          </Button>
        </div>
      <Button
        type="button"
        variant="outline"
        @click="addParticipant"
        :disabled="isSubmitting"
      >
        <Plus class="h-4 w-4 mr-2" />
        Add Participant
      </Button>
      </div>
      <FieldError v-if="errors.participants">{{ errors.participants }}</FieldError>
    </Field>

    <div class="flex justify-end gap-3 pt-4">
      <Button
        type="button"
        variant="outline"
        @click="$emit('cancel')"
        :disabled="isSubmitting"
      >
        Cancel
      </Button>
      <Button type="submit" :disabled="isSubmitting">
        <span v-if="isSubmitting" class="flex items-center gap-2">
          <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ isEdit ? 'Updating...' : 'Creating...' }}
        </span>
        <span v-else>{{ isEdit ? 'Update' : 'Create' }}</span>
      </Button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Field, FieldLabel, FieldDescription, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, X } from 'lucide-vue-next'

export interface BillFormData {
  title: string
  totalAmount: string
  dueDate: string
  participants: Array<{
    userId: string
    amountOwed: string
  }>
}

export interface User {
  id: string
  email: string
  displayName: string
}

const props = defineProps<{
  initialData?: BillFormData
  isEdit?: boolean
  isSubmitting?: boolean
}>()

const emit = defineEmits<{
  submit: [data: BillFormData]
  cancel: []
}>()

const formData = ref<BillFormData>({
  title: '',
  totalAmount: '',
  dueDate: '',
  participants: [{ userId: '', amountOwed: '' }]
})

const errors = ref<Record<string, string>>({})
const users = ref<User[]>([])

const isSubmitting = computed(() => props.isSubmitting ?? false)


const isEdit = computed(() => props.isEdit ?? false)

watch(() => props.initialData, (newData) => {
  if (newData) {
    formData.value = {
      title: newData.title || '',
      totalAmount: newData.totalAmount || '',
      dueDate: newData.dueDate || '',
      participants: newData.participants.length > 0 
        ? [...newData.participants] 
        : [{ userId: '', amountOwed: '' }]
    }
  }
}, { immediate: true })

onMounted(async () => {
  try {
    const response = await $fetch<User[]>('/api/users')
    users.value = response
  } catch (error) {
    console.error('Failed to fetch users:', error)
  }
})

function addParticipant() {
  formData.value.participants.push({ userId: '', amountOwed: '' })
}

function removeParticipant(index: number) {
  formData.value.participants.splice(index, 1)
}

function truncateEmail(email: string, maxLength: number = 20): string {
  if (email.length <= maxLength) {
    return email
  }
  return email.substring(0, maxLength) + '...'
}

function validate(): boolean {
  errors.value = {}

  if (!formData.value.title.trim()) {
    errors.value.title = 'Title is required'
  }

  const amount = parseFloat(formData.value.totalAmount)
  if (!formData.value.totalAmount || isNaN(amount) || amount <= 0) {
    errors.value.totalAmount = 'Valid amount greater than 0 is required'
  }

  if (formData.value.participants.length === 0) {
    errors.value.participants = 'At least one participant is required'
  }

  const totalParticipantAmount = formData.value.participants.reduce((sum, p) => {
    const amt = parseFloat(p.amountOwed || '0')
    return sum + (isNaN(amt) ? 0 : amt)
  }, 0)

  if (Math.abs(totalParticipantAmount - amount) > 0.01) {
    errors.value.participants = `Participant amounts (${totalParticipantAmount.toFixed(2)}) must equal total amount (${amount.toFixed(2)})`
  }

  for (let i = 0; i < formData.value.participants.length; i++) {
    const p = formData.value.participants[i]
    if (!p.userId) {
      errors.value.participants = 'All participants must have a user selected'
      break
    }
    const amt = parseFloat(p.amountOwed || '0')
    if (!p.amountOwed || isNaN(amt) || amt <= 0) {
      errors.value.participants = 'All participants must have a valid amount'
      break
    }
  }

  return Object.keys(errors.value).length === 0
}

function handleSubmit() {
  if (!validate()) {
    return
  }

  if (isSubmitting.value) {
    return
  }

  emit('submit', { ...formData.value })
}
</script>

