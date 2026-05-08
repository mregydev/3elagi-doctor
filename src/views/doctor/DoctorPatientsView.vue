<template>
  <div class="p-4 md:p-6 space-y-5" :dir="locale === 'ar' ? 'rtl' : 'ltr'">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <h1 class="text-xl md:text-2xl font-bold">{{ $t('nav.patients') }}</h1>
      <button
        @click="showCreate = true"
        class="flex items-center justify-center gap-2 px-4 py-2.5 bg-[hsl(var(--primary))] text-white text-sm font-semibold rounded-lg hover:opacity-90 w-full sm:w-auto"
      >
        <Plus :size="16" />
        {{ $t('patients.add') }}
      </button>
    </div>

    <div class="inline-flex bg-slate-100 p-1 rounded-xl gap-1">
      <button
        v-for="t in (['future','past','all'] as const)"
        :key="t"
        @click="tab = t"
        class="px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors"
        :class="tab === t ? 'bg-white text-[hsl(var(--primary))] shadow-sm' : 'text-slate-500'"
      >
        {{ $t(`doctorPatients.${t}`) }}
      </button>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <Loader2 class="animate-spin text-[hsl(var(--primary))]" :size="32" />
    </div>
    <div v-else-if="!displayList.length" class="text-center py-16 text-[hsl(var(--muted-foreground))] text-sm">
      {{ $t('doctorPatients.empty') }}
    </div>

    <div v-else class="space-y-2.5">
      <div
        v-for="p in displayList"
        :key="p.id"
        class="rounded-xl border border-[hsl(var(--border))] bg-white p-4 flex items-center justify-between gap-3 hover:shadow-sm cursor-pointer transition"
        @click="router.push(`/doctor/patients/${p.id}?tab=intake_exams`)"
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
          <span v-if="p.hasIntake" class="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-blue-50 text-[hsl(var(--primary))]">
            {{ $t('doctorPatients.hasIntake') }}
          </span>
          <span v-if="p.lastDate" class="text-xs text-[hsl(var(--muted-foreground))]">{{ formatDate(p.lastDate) }}</span>
          <ChevronLeft v-if="locale === 'ar'" :size="16" class="text-[hsl(var(--muted-foreground))]" />
          <ChevronRight v-else :size="16" class="text-[hsl(var(--muted-foreground))]" />
        </div>
      </div>
    </div>
  </div>

  <!-- Add patient modal -->
  <Teleport to="body">
    <div v-if="showCreate" class="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" @click.self="closeCreate">
      <div class="bg-white rounded-t-2xl sm:rounded-2xl p-5 md:p-6 w-full sm:max-w-md space-y-4 max-h-[92vh] overflow-y-auto">
        <div class="flex items-center justify-between">
          <h2 class="font-bold text-lg">{{ $t('patients.add') }}</h2>
          <button @click="closeCreate" class="p-1 rounded-lg hover:bg-[hsl(var(--muted))]">
            <X :size="18" />
          </button>
        </div>
        <form @submit.prevent="submitCreate" class="space-y-3">
          <div>
            <label class="block text-xs font-medium mb-1">{{ $t('patients.name') }}</label>
            <input
              v-model="form.name"
              required
              class="w-full px-3 py-2 text-sm border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
            />
          </div>
          <div>
            <label class="block text-xs font-medium mb-1">{{ $t('appointments.phone') }}</label>
            <input
              v-model="form.phone"
              type="tel"
              required
              class="w-full px-3 py-2 text-sm border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
            />
          </div>
          <div>
            <label class="block text-xs font-medium mb-1">{{ $t('auth.email') }}</label>
            <input
              v-model="form.email"
              type="email"
              class="w-full px-3 py-2 text-sm border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
            />
          </div>
          <div>
            <label class="block text-xs font-medium mb-1">{{ $t('patients.birthDate') }}</label>
            <input
              v-model="form.birth_date"
              type="date"
              class="w-full px-3 py-2 text-sm border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
            />
          </div>
          <div class="flex gap-3 pt-1">
            <button
              type="button"
              @click="closeCreate"
              class="flex-1 py-2.5 text-sm border border-[hsl(var(--border))] rounded-lg hover:bg-[hsl(var(--muted))]"
            >
              {{ $t('common.cancel') }}
            </button>
            <button
              type="submit"
              :disabled="saving"
              class="flex-1 py-2.5 text-sm bg-[hsl(var(--primary))] text-white rounded-lg disabled:opacity-50 hover:opacity-90"
            >
              {{ saving ? $t('common.loading') : $t('common.save') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Loader2, ChevronLeft, ChevronRight, Plus, X } from 'lucide-vue-next'
import { apiFetch } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth'
import type { DoctorProfile } from '@/stores/auth'
import type { Patient } from '@/domains/patient/types'

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

interface DisplayPatient {
  id: string
  name: string
  phone: string
  lastDate?: string
  hasIntake?: boolean
}

const { locale } = useI18n()
const router = useRouter()
const auth = useAuthStore()
const qc = useQueryClient()
const doctorProfile = computed(() => auth.profile as DoctorProfile | null)
const doctorId = computed(() => doctorProfile.value?.id)
const clinicId = computed(() => doctorProfile.value?.default_clinic_id ?? undefined)
const tab = ref<'future' | 'past' | 'all'>('future')

const showCreate = ref(false)
const saving = ref(false)
const form = reactive({ name: '', phone: '', email: '', birth_date: '' })

function closeCreate() {
  showCreate.value = false
  Object.assign(form, { name: '', phone: '', email: '', birth_date: '' })
}

async function submitCreate() {
  saving.value = true
  try {
    await apiFetch('/patients', {
      method: 'POST',
      body: JSON.stringify({
        name: form.name,
        phone: form.phone,
        ...(form.email ? { email: form.email } : {}),
        ...(form.birth_date ? { birth_date: form.birth_date } : {}),
        ...(clinicId.value ? { clinic_id: clinicId.value } : {}),
        ...(doctorId.value ? { doctor_id: doctorId.value } : {}),
      }),
    })
    qc.invalidateQueries({ queryKey: ['doctor-patients'] })
    qc.invalidateQueries({ queryKey: ['all-patients'] })
    closeCreate()
  } finally {
    saving.value = false
  }
}

const { data: list, isLoading: loadingByDoctor } = useQuery({
  queryKey: computed(() => ['doctor-patients', doctorId.value]),
  queryFn: () => apiFetch<DoctorPatient[]>(`/patients/by-doctor/${doctorId.value}`),
  enabled: computed(() => !!doctorId.value && tab.value !== 'all'),
})

const { data: allList, isLoading: loadingAll } = useQuery({
  queryKey: ['all-patients'],
  queryFn: () => apiFetch<Patient[]>('/patients'),
  enabled: computed(() => tab.value === 'all'),
})

const loading = computed(() => tab.value === 'all' ? loadingAll.value : loadingByDoctor.value)

const displayList = computed((): DisplayPatient[] => {
  if (tab.value === 'all') {
    return (allList.value ?? []).map(p => ({ id: p.id, name: p.name, phone: p.phone }))
  }
  const arr = list.value ?? []
  return arr
    .filter(p => tab.value === 'future' ? p.future_count > 0 : p.past_count > 0)
    .map(p => ({ id: p.patient_id, name: p.name, phone: p.phone, lastDate: p.last_date, hasIntake: !!p.last_intake_test_id }))
})

function formatDate(d: string) {
  const localeStr = locale.value === 'ar' ? 'ar-EG' : 'en-GB'
  return new Date(d).toLocaleDateString(localeStr, { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>
