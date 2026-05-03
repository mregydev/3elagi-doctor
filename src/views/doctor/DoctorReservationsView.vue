<template>
  <div class="p-4 md:p-6 max-w-5xl mx-auto" :dir="locale === 'ar' ? 'rtl' : 'ltr'">
    <div class="mb-4">
      <h1 class="text-xl md:text-2xl font-bold">{{ $t('reservations.title') }}</h1>
      <p class="text-xs md:text-sm text-[hsl(var(--muted-foreground))] mt-1">{{ $t('reservations.subtitle') }}</p>
    </div>

    <div v-if="isLoading" class="text-sm text-[hsl(var(--muted-foreground))]">{{ $t('common.loading') }}</div>

    <div v-else-if="!appts.length" class="p-8 text-center text-sm text-[hsl(var(--muted-foreground))] bg-white rounded-xl border border-dashed border-[hsl(var(--border))]">
      {{ $t('reservations.empty') }}
    </div>

    <div v-else class="space-y-6">
      <section v-for="group in groups" :key="group.label">
        <h2 class="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">{{ $t(group.label) }}</h2>
        <div class="bg-white border border-[hsl(var(--border))] rounded-xl overflow-hidden divide-y divide-[hsl(var(--border))]">
          <div
            v-for="a in group.items"
            :key="a.id"
            class="px-4 py-3 flex flex-wrap items-center gap-3 justify-between hover:bg-slate-50/40"
          >
            <div class="min-w-0">
              <div class="font-semibold">{{ a.patient_name || a.patient_phone }}</div>
              <div class="text-xs text-[hsl(var(--muted-foreground))]">
                {{ a.date }} · {{ (a.time || '').slice(0,5) }} · {{ a.patient_phone }}
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span
                v-if="a.booked_via_app"
                class="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 text-[hsl(var(--primary))] uppercase tracking-wide"
              >{{ $t('reservations.bookedVia') }}</span>
              <span
                class="text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide"
                :class="statusClass(a.status)"
              >{{ $t(`appointments.status.${a.status}`) }}</span>
              <button
                v-if="a.intake_test_id"
                @click="viewIntake(a)"
                class="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-[hsl(var(--primary))] bg-blue-50 rounded-md hover:bg-blue-100"
              >
                <ClipboardList :size="13" /> {{ $t('reservations.viewIntake') }}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>

    <Teleport to="body">
      <div v-if="intakeModal" class="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" @click.self="intakeModal = null">
        <div class="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between p-5 border-b border-[hsl(var(--border))] sticky top-0 bg-white">
            <h3 class="font-bold">{{ $t('reservations.intakeDialog') }}</h3>
            <button @click="intakeModal = null" class="p-1 rounded-lg hover:bg-[hsl(var(--muted))]"><X :size="18" /></button>
          </div>
          <div class="p-5 space-y-3">
            <div v-if="intakeQuestions && intakeAnswersList.length" v-for="row in intakeAnswersList" :key="row.qid" class="p-3 rounded-lg border border-[hsl(var(--border))] bg-slate-50/50">
              <div class="text-sm font-semibold mb-1">{{ row.qText }}</div>
              <div class="text-sm text-[hsl(var(--foreground))]">{{ row.answers.join(' · ') || '—' }}</div>
            </div>
            <div v-else class="text-sm text-[hsl(var(--muted-foreground))]">{{ $t('reservations.noIntake') }}</div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuery } from '@tanstack/vue-query'
import { ClipboardList, X } from 'lucide-vue-next'
import { apiFetch } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth'
import type { DoctorProfile } from '@/stores/auth'

interface Appt {
  id: string
  patient_name: string | null
  patient_phone: string
  date: string
  time: string | null
  status: string
  booked_via_app: boolean
  intake_test_id: string | null
  intake_answers: Record<string, string[]> | null
}

interface IntakeQ {
  id: string
  text_ar: string
  text_en: string
  options: { id: string; text_ar: string; text_en: string }[]
}
interface IntakeTest { id: string; name: string; questions: IntakeQ[] }

const { locale } = useI18n()
const auth = useAuthStore()
const doctorId = computed(() => (auth.profile as DoctorProfile | null)?.id)

const { data, isLoading } = useQuery({
  queryKey: ['my-reservations', doctorId],
  enabled: computed(() => !!doctorId.value),
  queryFn: () => apiFetch<Appt[]>(`/appointments/doctor/${doctorId.value}/list`),
})

const appts = computed(() => data.value ?? [])

const today = new Date().toISOString().slice(0, 10)
const groups = computed(() => {
  const upcoming = appts.value.filter((a) => a.date >= today)
  const past = appts.value.filter((a) => a.date < today)
  const out: { label: string; items: Appt[] }[] = []
  if (upcoming.length) out.push({ label: 'reservations.upcoming', items: upcoming })
  if (past.length) out.push({ label: 'reservations.past', items: past })
  return out
})

function statusClass(s: string) {
  if (s === 'waiting') return 'bg-amber-50 text-amber-700'
  if (s === 'active') return 'bg-blue-50 text-[hsl(var(--primary))]'
  if (s === 'done') return 'bg-emerald-50 text-emerald-700'
  return 'bg-slate-100 text-slate-500'
}

const intakeModal = ref<Appt | null>(null)
const intakeQuestions = ref<IntakeQ[] | null>(null)

async function viewIntake(a: Appt) {
  intakeModal.value = a
  intakeQuestions.value = null
  if (!a.intake_test_id) return
  try {
    const all = await apiFetch<IntakeTest[]>('/intake-tests')
    const t = all.find((x) => x.id === a.intake_test_id)
    intakeQuestions.value = t?.questions ?? []
  } catch {
    intakeQuestions.value = []
  }
}

const intakeAnswersList = computed(() => {
  const a = intakeModal.value
  const qs = intakeQuestions.value
  if (!a || !qs) return []
  const ans = a.intake_answers || {}
  return qs.map((q) => {
    const selected = ans[q.id] || []
    const labels = selected.map((oid) => {
      const o = q.options.find((x) => x.id === oid)
      if (!o) return oid
      return locale.value === 'ar' ? (o.text_ar || o.text_en) : (o.text_en || o.text_ar)
    })
    return {
      qid: q.id,
      qText: locale.value === 'ar' ? (q.text_ar || q.text_en) : (q.text_en || q.text_ar),
      answers: labels,
    }
  })
})
</script>
