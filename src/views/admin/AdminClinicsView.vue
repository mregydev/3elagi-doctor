<template>
  <div class="p-4 md:p-6 max-w-6xl mx-auto" :dir="locale === 'ar' ? 'rtl' : 'ltr'">
    <h1 class="text-xl md:text-2xl font-bold mb-1">{{ $t('admin.clinicsTitle') }}</h1>
    <p class="text-xs text-[hsl(var(--muted-foreground))] mb-4">{{ $t('admin.clinicsSubtitle') }}</p>

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
      {{ $t('admin.noClinics') }}
    </div>
    <div v-else class="bg-white border border-[hsl(var(--border))] rounded-xl overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-[hsl(var(--muted))] text-xs uppercase">
          <tr>
            <th class="text-start px-3 py-2.5">{{ $t('admin.colName') }}</th>
            <th class="text-start px-3 py-2.5">{{ $t('admin.colPhone') }}</th>
            <th class="text-start px-3 py-2.5">{{ $t('admin.colLocation') }}</th>
            <th class="text-start px-3 py-2.5">{{ $t('admin.colStatus') }}</th>
            <th class="text-end px-3 py-2.5">{{ $t('admin.colActions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in visible" :key="c.id" class="border-t border-[hsl(var(--border))]">
            <td class="px-3 py-2.5 font-semibold">
              {{ c.name }}
              <span v-if="c.is_personal" class="ms-1 text-[10px] text-slate-400 uppercase">({{ $t('admin.personalClinic') }})</span>
            </td>
            <td class="px-3 py-2.5 text-[hsl(var(--muted-foreground))]">{{ c.phone || '—' }}</td>
            <td class="px-3 py-2.5 text-[hsl(var(--muted-foreground))]">{{ c.location || '—' }}</td>
            <td class="px-3 py-2.5">
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border" :class="badgeClass(c.approval_status)">
                {{ $t(`admin.${c.approval_status || 'pending'}`) }}
              </span>
            </td>
            <td class="px-3 py-2.5 text-end whitespace-nowrap">
              <button v-if="c.approval_status !== 'approved'" @click="setStatus(c, 'approved')" class="px-2 py-1 text-xs font-semibold text-emerald-700 rounded-md hover:bg-emerald-50">{{ $t('admin.approve') }}</button>
              <button v-if="c.approval_status !== 'rejected'" @click="setStatus(c, 'rejected')" class="ms-1 px-2 py-1 text-xs font-semibold text-red-600 rounded-md hover:bg-red-50">{{ $t('admin.reject') }}</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { apiFetch } from '@/lib/utils'

type ApprovalStatus = 'pending' | 'approved' | 'rejected'
interface Clinic {
  id: string; name: string; phone?: string | null; location?: string | null;
  is_personal?: boolean; approval_status?: ApprovalStatus
}

const { locale } = useI18n()
const qc = useQueryClient()
const filter = ref<'all' | ApprovalStatus>('pending')

const filters: { key: 'all' | ApprovalStatus }[] = [
  { key: 'pending' }, { key: 'approved' }, { key: 'rejected' }, { key: 'all' },
]

const { data, isLoading } = useQuery({
  queryKey: ['admin', 'clinics'],
  queryFn: () => apiFetch<Clinic[]>('/admin/clinics'),
})
const clinics = computed(() => data.value ?? [])
const counts = computed<Record<string, number>>(() => {
  const out: Record<string, number> = { all: clinics.value.length, pending: 0, approved: 0, rejected: 0 }
  for (const c of clinics.value) out[c.approval_status || 'pending']++
  return out
})
const visible = computed(() =>
  filter.value === 'all' ? clinics.value : clinics.value.filter((c) => (c.approval_status || 'pending') === filter.value),
)

function badgeClass(s: ApprovalStatus | undefined): string {
  switch (s) {
    case 'approved': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'rejected': return 'bg-red-50 text-red-700 border-red-200'
    default: return 'bg-amber-50 text-amber-700 border-amber-200'
  }
}

async function setStatus(c: Clinic, status: ApprovalStatus) {
  await apiFetch(`/admin/clinics/${c.id}/approval`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
  qc.invalidateQueries({ queryKey: ['admin', 'clinics'] })
}
</script>
