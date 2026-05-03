<template>
  <div class="p-4 md:p-6 max-w-6xl mx-auto" :dir="locale === 'ar' ? 'rtl' : 'ltr'">
    <h1 class="text-xl md:text-2xl font-bold mb-1">{{ $t('admin.doctorsTitle') }}</h1>
    <p class="text-xs text-[hsl(var(--muted-foreground))] mb-4">{{ $t('admin.doctorsSubtitle') }}</p>

    <!-- Status filter chips -->
    <div class="flex gap-2 mb-4">
      <button
        v-for="f in filters" :key="f.key"
        @click="filter = f.key"
        :class="filter === f.key
          ? 'bg-[hsl(var(--primary))] text-white border-[hsl(var(--primary))]'
          : 'bg-white text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))]'"
        class="px-3 py-1.5 text-xs font-semibold rounded-full border"
      >
        {{ $t(`admin.${f.key === 'all' ? 'filterAll' : f.key}`) }}
        <span v-if="counts[f.key]" class="ms-1 opacity-80">({{ counts[f.key] }})</span>
      </button>
    </div>

    <div v-if="isLoading" class="text-sm text-[hsl(var(--muted-foreground))]">{{ $t('common.loading') }}</div>
    <div v-else-if="!visible.length" class="p-8 text-center bg-white border border-dashed border-[hsl(var(--border))] rounded-xl text-sm text-[hsl(var(--muted-foreground))]">
      {{ $t('admin.noDoctors') }}
    </div>
    <div v-else class="bg-white border border-[hsl(var(--border))] rounded-xl overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-[hsl(var(--muted))] text-xs uppercase">
          <tr>
            <th class="text-start px-3 py-2.5">{{ $t('admin.colName') }}</th>
            <th class="text-start px-3 py-2.5">{{ $t('admin.colEmail') }}</th>
            <th class="text-start px-3 py-2.5">{{ $t('admin.colPhone') }}</th>
            <th class="text-start px-3 py-2.5">{{ $t('admin.colStatus') }}</th>
            <th class="text-end px-3 py-2.5">{{ $t('admin.colActions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="d in visible" :key="d.id" class="border-t border-[hsl(var(--border))]">
            <td class="px-3 py-2.5 font-semibold">{{ d.name }}</td>
            <td class="px-3 py-2.5 text-[hsl(var(--muted-foreground))]">{{ d.email || '—' }}</td>
            <td class="px-3 py-2.5 text-[hsl(var(--muted-foreground))]">{{ d.phone || '—' }}</td>
            <td class="px-3 py-2.5">
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border" :class="badgeClass(d.approval_status)">
                {{ $t(`admin.${d.approval_status || 'pending'}`) }}
              </span>
            </td>
            <td class="px-3 py-2.5 text-end whitespace-nowrap">
              <button v-if="d.approval_status !== 'approved'" @click="setStatus(d, 'approved')" class="px-2 py-1 text-xs font-semibold text-emerald-700 rounded-md hover:bg-emerald-50">{{ $t('admin.approve') }}</button>
              <button v-if="d.approval_status !== 'rejected'" @click="setStatus(d, 'rejected')" class="ms-1 px-2 py-1 text-xs font-semibold text-red-600 rounded-md hover:bg-red-50">{{ $t('admin.reject') }}</button>
              <button @click="edit(d)" class="ms-1 px-2 py-1 text-xs font-semibold rounded-md hover:bg-[hsl(var(--muted))]">{{ $t('common.edit') }}</button>
              <button @click="remove(d)" class="ms-1 px-2 py-1 text-xs font-semibold text-red-500 rounded-md hover:bg-red-50">{{ $t('common.delete') }}</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Edit modal -->
    <div v-if="editing" class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" @click.self="editing = null">
      <div class="bg-white rounded-2xl p-5 w-full max-w-md space-y-3">
        <h2 class="font-bold text-base">{{ $t('admin.editDoctor') }}</h2>
        <label class="block text-xs font-semibold">{{ $t('admin.colName') }}
          <input v-model="editing.name" class="mt-1 w-full px-2.5 py-1.5 text-sm border rounded-lg" />
        </label>
        <label class="block text-xs font-semibold">{{ $t('admin.colEmail') }}
          <input v-model="editing.email" class="mt-1 w-full px-2.5 py-1.5 text-sm border rounded-lg" />
        </label>
        <label class="block text-xs font-semibold">{{ $t('admin.colPhone') }}
          <input v-model="editing.phone" class="mt-1 w-full px-2.5 py-1.5 text-sm border rounded-lg" />
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

type ApprovalStatus = 'pending' | 'approved' | 'rejected'
interface Doctor {
  id: string; name: string; email?: string | null; phone?: string | null;
  approval_status?: ApprovalStatus
}

const { locale, t } = useI18n()
const qc = useQueryClient()
const editing = ref<Doctor | null>(null)
const saving = ref(false)
const error = ref('')
const filter = ref<'all' | ApprovalStatus>('pending')

const filters: { key: 'all' | ApprovalStatus }[] = [
  { key: 'pending' }, { key: 'approved' }, { key: 'rejected' }, { key: 'all' },
]

const { data, isLoading } = useQuery({
  queryKey: ['admin', 'doctors'],
  queryFn: () => apiFetch<Doctor[]>('/admin/doctors'),
})
const doctors = computed(() => data.value ?? [])
const counts = computed<Record<string, number>>(() => {
  const out: Record<string, number> = { all: doctors.value.length, pending: 0, approved: 0, rejected: 0 }
  for (const d of doctors.value) out[d.approval_status || 'pending']++
  return out
})
const visible = computed(() =>
  filter.value === 'all' ? doctors.value : doctors.value.filter((d) => (d.approval_status || 'pending') === filter.value),
)

function badgeClass(s: ApprovalStatus | undefined): string {
  switch (s) {
    case 'approved': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'rejected': return 'bg-red-50 text-red-700 border-red-200'
    default: return 'bg-amber-50 text-amber-700 border-amber-200'
  }
}

async function setStatus(d: Doctor, status: ApprovalStatus) {
  await apiFetch(`/admin/doctors/${d.id}/approval`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
  qc.invalidateQueries({ queryKey: ['admin', 'doctors'] })
  qc.invalidateQueries({ queryKey: ['admin', 'clinics'] })
}

function edit(d: Doctor) {
  editing.value = { ...d }
  error.value = ''
}

async function saveEdit() {
  if (!editing.value) return
  saving.value = true
  error.value = ''
  try {
    const { id, name, email, phone } = editing.value
    await apiFetch(`/admin/doctors/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name, email, phone }),
    })
    qc.invalidateQueries({ queryKey: ['admin', 'doctors'] })
    editing.value = null
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    saving.value = false
  }
}

async function remove(d: Doctor) {
  // eslint-disable-next-line no-alert
  if (!window.confirm(t('admin.deleteDoctorConfirm'))) return
  await apiFetch(`/admin/doctors/${d.id}`, { method: 'DELETE' })
  qc.invalidateQueries({ queryKey: ['admin', 'doctors'] })
}
</script>
