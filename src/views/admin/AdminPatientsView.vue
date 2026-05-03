<template>
  <div class="p-4 md:p-6 max-w-5xl mx-auto" :dir="locale === 'ar' ? 'rtl' : 'ltr'">
    <h1 class="text-xl md:text-2xl font-bold mb-1">{{ $t('admin.patientsTitle') }}</h1>
    <p class="text-xs text-[hsl(var(--muted-foreground))] mb-4">{{ $t('admin.patientsSubtitle') }}</p>

    <div v-if="isLoading" class="text-sm text-[hsl(var(--muted-foreground))]">{{ $t('common.loading') }}</div>
    <div v-else-if="!patients.length" class="p-8 text-center bg-white border border-dashed border-[hsl(var(--border))] rounded-xl text-sm text-[hsl(var(--muted-foreground))]">
      {{ $t('admin.noPatients') }}
    </div>
    <div v-else class="bg-white border border-[hsl(var(--border))] rounded-xl overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-[hsl(var(--muted))] text-xs uppercase">
          <tr>
            <th class="text-start px-3 py-2.5">{{ $t('admin.colName') }}</th>
            <th class="text-start px-3 py-2.5">{{ $t('admin.colPhone') }}</th>
            <th class="text-start px-3 py-2.5">{{ $t('admin.colGender') }}</th>
            <th class="text-end px-3 py-2.5">{{ $t('admin.colActions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in patients" :key="p.user_id" class="border-t border-[hsl(var(--border))]">
            <td class="px-3 py-2.5 font-semibold">{{ p.name }}</td>
            <td class="px-3 py-2.5 text-[hsl(var(--muted-foreground))]">{{ p.phone || '—' }}</td>
            <td class="px-3 py-2.5 text-[hsl(var(--muted-foreground))]">{{ p.gender || '—' }}</td>
            <td class="px-3 py-2.5 text-end">
              <button @click="edit(p)" class="px-2 py-1 text-xs font-semibold rounded-md hover:bg-[hsl(var(--muted))]">{{ $t('common.edit') }}</button>
              <button @click="remove(p)" class="ms-1 px-2 py-1 text-xs font-semibold text-red-500 rounded-md hover:bg-red-50">{{ $t('common.delete') }}</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="editing" class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" @click.self="editing = null">
      <div class="bg-white rounded-2xl p-5 w-full max-w-md space-y-3">
        <h2 class="font-bold text-base">{{ $t('admin.editPatient') }}</h2>
        <label class="block text-xs font-semibold">{{ $t('admin.colName') }}
          <input v-model="editing.name" class="mt-1 w-full px-2.5 py-1.5 text-sm border rounded-lg" />
        </label>
        <label class="block text-xs font-semibold">{{ $t('admin.colPhone') }}
          <input v-model="editing.phone" class="mt-1 w-full px-2.5 py-1.5 text-sm border rounded-lg" />
        </label>
        <label class="block text-xs font-semibold">{{ $t('admin.colGender') }}
          <input v-model="editing.gender" class="mt-1 w-full px-2.5 py-1.5 text-sm border rounded-lg" />
        </label>
        <label class="block text-xs font-semibold">{{ $t('admin.colChronic') }}
          <textarea v-model="editing.chronic_conditions" rows="2" class="mt-1 w-full px-2.5 py-1.5 text-sm border rounded-lg" />
        </label>
        <label class="block text-xs font-semibold">{{ $t('admin.colAllergies') }}
          <textarea v-model="editing.allergies" rows="2" class="mt-1 w-full px-2.5 py-1.5 text-sm border rounded-lg" />
        </label>
        <div v-if="error" class="text-xs text-red-600">{{ error }}</div>
        <div class="flex justify-end gap-2 pt-2">
          <button @click="editing = null" class="px-3 py-1.5 text-sm border rounded-lg">{{ $t('common.cancel') }}</button>
          <button @click="saveEdit" :disabled="saving" class="px-3 py-1.5 text-sm bg-[hsl(var(--primary))] text-white rounded-lg disabled:opacity-50">{{ $t('common.save') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { apiFetch } from '@/lib/utils'

interface Patient {
  user_id: string
  name: string
  phone: string
  gender?: string | null
  chronic_conditions?: string | null
  allergies?: string | null
}

const { locale, t } = useI18n()
const qc = useQueryClient()
const editing = ref<Patient | null>(null)
const saving = ref(false)
const error = ref('')

const { data, isLoading } = useQuery({
  queryKey: ['admin', 'patients'],
  queryFn: () => apiFetch<Patient[]>('/admin/patients'),
})
const patients = computed(() => data.value ?? [])

function edit(p: Patient) {
  editing.value = { ...p }
  error.value = ''
}

async function saveEdit() {
  if (!editing.value) return
  saving.value = true
  error.value = ''
  try {
    const { user_id, name, phone, gender, chronic_conditions, allergies } = editing.value
    await apiFetch(`/admin/patients/${user_id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name, phone, gender, chronic_conditions, allergies }),
    })
    qc.invalidateQueries({ queryKey: ['admin', 'patients'] })
    editing.value = null
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    saving.value = false
  }
}

async function remove(p: Patient) {
  // eslint-disable-next-line no-alert
  if (!window.confirm(t('admin.deletePatientConfirm'))) return
  await apiFetch(`/admin/patients/${p.user_id}`, { method: 'DELETE' })
  qc.invalidateQueries({ queryKey: ['admin', 'patients'] })
}
</script>
