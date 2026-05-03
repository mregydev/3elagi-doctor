<template>
  <div class="p-4 md:p-6 space-y-5" :dir="locale === 'ar' ? 'rtl' : 'ltr'">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <h1 class="text-xl md:text-2xl font-bold">{{ $t('nav.patients') }}</h1>
    </div>

    <div class="inline-flex bg-slate-100 p-1 rounded-xl gap-1">
      <button
        v-for="t in (['future','past'] as const)"
        :key="t"
        @click="tab = t"
        class="px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors"
        :class="tab === t ? 'bg-white text-[hsl(var(--primary))] shadow-sm' : 'text-slate-500'"
      >
        {{ $t(`doctorPatients.${t}`) }}
      </button>
    </div>

    <div v-if="isLoading" class="flex justify-center py-12">
      <Loader2 class="animate-spin text-[hsl(var(--primary))]" :size="32" />
    </div>
    <div v-else-if="!filtered.length" class="text-center py-16 text-[hsl(var(--muted-foreground))] text-sm">
      {{ $t('doctorPatients.empty') }}
    </div>

    <div v-else class="space-y-2.5">
      <div
        v-for="p in filtered"
        :key="p.patient_id"
        class="rounded-xl border border-[hsl(var(--border))] bg-white p-4 flex items-center justify-between gap-3 hover:shadow-sm cursor-pointer transition"
        @click="goTo(p)"
      >
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold flex-shrink-0">
            {{ p.name?.charAt(0) || '?' }}
          </div>
          <div class="min-w-0">
            <div class="font-semibold text-sm truncate">{{ p.name }}</div>
            <div class="text-xs text-[hsl(var(--muted-foreground))]">{{ p.phone }}</div>
          </div>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          <span v-if="p.last_intake_test_id" class="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-blue-50 text-[hsl(var(--primary))]">
            {{ $t('doctorPatients.hasIntake') }}
          </span>
          <span class="text-xs text-[hsl(var(--muted-foreground))]">{{ formatDate(p.last_date) }}</span>
          <ChevronLeft v-if="locale === 'ar'" :size="16" class="text-[hsl(var(--muted-foreground))]" />
          <ChevronRight v-else :size="16" class="text-[hsl(var(--muted-foreground))]" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { apiFetch } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth'

interface DoctorPatient {
  patient_id: string
  name: string
  phone: string
  last_appointment_id: string
  last_date: string
  last_intake_test_id: string | null
  future_count: number
  past_count: number
}

const { locale } = useI18n()
const router = useRouter()
const auth = useAuthStore()
const doctorId = computed(() => (auth.profile as { id?: string } | null)?.id)
const tab = ref<'future' | 'past'>('future')

const { data: list, isLoading } = useQuery({
  queryKey: computed(() => ['doctor-patients', doctorId.value]),
  queryFn: () => apiFetch<DoctorPatient[]>(`/patients/by-doctor/${doctorId.value}`),
  enabled: computed(() => !!doctorId.value),
})

const filtered = computed(() => {
  const arr = list.value ?? []
  return arr.filter(p => tab.value === 'future' ? p.future_count > 0 : p.past_count > 0)
})

function formatDate(d: string) {
  const localeStr = locale.value === 'ar' ? 'ar-EG' : 'en-GB'
  return new Date(d).toLocaleDateString(localeStr, { year: 'numeric', month: 'short', day: 'numeric' })
}

function goTo(p: DoctorPatient) {
  // Navigate to patient detail; will land on intake exams tab via query param
  router.push(`/doctor/patients/${p.patient_id}?tab=intake_exams`)
}
</script>
