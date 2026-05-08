<template>
  <div class="p-4 md:p-6 max-w-5xl mx-auto" :dir="locale === 'ar' ? 'rtl' : 'ltr'">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
      <div>
        <h1 class="text-xl md:text-2xl font-bold">{{ $t('reservations.title') }}</h1>
        <p class="text-xs md:text-sm text-[hsl(var(--muted-foreground))] mt-1">{{ $t('reservations.subtitle') }}</p>
      </div>
      <button
        @click="openCreate"
        class="flex items-center justify-center gap-2 px-4 py-2.5 bg-[hsl(var(--primary))] text-white text-sm font-semibold rounded-lg hover:opacity-90 w-full sm:w-auto"
      >
        <Plus :size="16" />
        {{ $t('appointments.add') }}
      </button>
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

    <!-- Intake answers modal -->
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

    <!-- Create appointment modal -->
    <Teleport to="body">
      <div v-if="showCreate" class="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" @click.self="closeCreate">
        <div class="bg-white rounded-t-2xl sm:rounded-2xl p-5 md:p-6 w-full sm:max-w-md space-y-4 max-h-[92vh] overflow-y-auto">
          <div class="flex items-center justify-between">
            <h2 class="font-bold text-lg">{{ $t('appointments.create') }}</h2>
            <button @click="closeCreate" class="p-1 rounded-lg hover:bg-[hsl(var(--muted))]">
              <X :size="18" />
            </button>
          </div>
          <form @submit.prevent="createAppointment" class="space-y-3">

            <!-- Phone lookup -->
            <div>
              <label class="block text-xs font-medium mb-1">{{ $t('appointments.phone') }}</label>
              <input
                v-model="newAppt.patient_phone"
                type="tel"
                required
                :placeholder="$t('patients.search')"
                class="w-full px-3 py-2 text-sm border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                @blur="lookupPatient"
              />
            </div>

            <!-- Patient found banner -->
            <div v-if="foundPatient" class="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 text-sm p-3 rounded-lg">
              <UserCheck :size="16" class="flex-shrink-0" />
              <span>{{ $t('appointments.patientFound') }}: <strong>{{ foundPatient.name }}</strong></span>
            </div>

            <!-- Patient not found -->
            <template v-else-if="newAppt.patient_phone && lookedUp">
              <div class="bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm p-3 rounded-lg">
                {{ $t('appointments.patientNotFound') }}
              </div>
              <button
                type="button"
                @click="showNewPatient = !showNewPatient"
                class="flex items-center gap-2 text-sm text-[hsl(var(--primary))] font-semibold hover:underline"
              >
                <UserPlus :size="14" />
                {{ $t('appointments.newPatient') }}
              </button>

              <div v-if="showNewPatient" class="border border-[hsl(var(--border))] rounded-xl p-4 space-y-3 bg-[hsl(var(--muted))]">
                <p class="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
                  {{ $t('appointments.newPatientDetails') }}
                </p>
                <div>
                  <label class="block text-xs font-medium mb-1">{{ $t('patients.name') }}</label>
                  <input
                    v-model="newPatientForm.name"
                    required
                    class="w-full px-3 py-2 text-sm border border-[hsl(var(--border))] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                  />
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-medium mb-1">{{ $t('patients.birthDate') }}</label>
                    <input
                      v-model="newPatientForm.birth_date"
                      type="date"
                      class="w-full px-3 py-2 text-sm border border-[hsl(var(--border))] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium mb-1">{{ $t('patients.age') }}</label>
                    <input
                      v-model.number="newPatientForm.age"
                      type="number"
                      min="0"
                      class="w-full px-3 py-2 text-sm border border-[hsl(var(--border))] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                    />
                  </div>
                </div>
              </div>
            </template>

            <!-- Date & Time -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium mb-1">{{ $t('appointments.date') }}</label>
                <input
                  v-model="newAppt.date"
                  type="date"
                  required
                  class="w-full px-3 py-2 text-sm border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                />
              </div>
              <div>
                <label class="block text-xs font-medium mb-1">{{ $t('appointments.time') }}</label>
                <input
                  v-model="newAppt.time"
                  type="time"
                  class="w-full px-3 py-2 text-sm border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                />
              </div>
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
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { ClipboardList, Plus, UserCheck, UserPlus, X } from 'lucide-vue-next'
import { apiFetch } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth'
import type { DoctorProfile } from '@/stores/auth'
import type { Patient } from '@/domains/patient/types'

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
const qc = useQueryClient()
const doctorProfile = computed(() => auth.profile as DoctorProfile | null)
const doctorId = computed(() => doctorProfile.value?.id)
const clinicId = computed(() => doctorProfile.value?.default_clinic_id ?? undefined)

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

// ── Create appointment ──────────────────────────────────────────────────────

const showCreate = ref(false)
const foundPatient = ref<Patient | null>(null)
const lookedUp = ref(false)
const showNewPatient = ref(false)
const saving = ref(false)

const newAppt = reactive({
  patient_phone: '',
  patient_id: undefined as string | undefined,
  date: new Date().toISOString().split('T')[0],
  time: '',
})

const newPatientForm = reactive({
  name: '',
  birth_date: '',
  age: undefined as number | undefined,
})

watch(() => newPatientForm.birth_date, (d) => {
  if (!d) return
  const birth = new Date(d)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  newPatientForm.age = age >= 0 ? age : undefined
})

function openCreate() {
  showCreate.value = true
}

function closeCreate() {
  showCreate.value = false
  foundPatient.value = null
  lookedUp.value = false
  showNewPatient.value = false
  Object.assign(newAppt, { patient_phone: '', patient_id: undefined, time: '', date: new Date().toISOString().split('T')[0] })
  Object.assign(newPatientForm, { name: '', birth_date: '', age: undefined })
}

async function lookupPatient() {
  if (!newAppt.patient_phone) return
  newAppt.patient_id = undefined
  lookedUp.value = false
  foundPatient.value = null
  showNewPatient.value = false
  const params = new URLSearchParams({ phone: newAppt.patient_phone })
  if (clinicId.value) params.set('clinic_id', clinicId.value)
  const res = await apiFetch<Patient>(`/patients/lookup?${params.toString()}`).catch(() => null)
  foundPatient.value = res
  if (res) newAppt.patient_id = res.id
  lookedUp.value = true
}

async function createAppointment() {
  saving.value = true
  try {
    let patientId = newAppt.patient_id

    if (!foundPatient.value && showNewPatient.value && newPatientForm.name) {
      const created = await apiFetch<Patient>('/patients', {
        method: 'POST',
        body: JSON.stringify({
          name: newPatientForm.name,
          phone: newAppt.patient_phone,
          birth_date: newPatientForm.birth_date || undefined,
          age: newPatientForm.age,
          ...(clinicId.value ? { clinic_id: clinicId.value } : {}),
        }),
      })
      patientId = created.id
      qc.invalidateQueries({ queryKey: ['patients'] })
    }

    await apiFetch('/appointments', {
      method: 'POST',
      body: JSON.stringify({
        doctor_id: doctorId.value,
        ...(clinicId.value ? { clinic_id: clinicId.value } : {}),
        patient_phone: newAppt.patient_phone,
        patient_id: patientId,
        date: newAppt.date,
        time: newAppt.time || undefined,
      }),
    })
    qc.invalidateQueries({ queryKey: ['my-reservations'] })
    closeCreate()
  } finally {
    saving.value = false
  }
}
</script>
