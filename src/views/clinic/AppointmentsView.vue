<template>
  <div class="p-4 md:p-6 space-y-5 md:space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <h1 class="text-xl md:text-2xl font-bold">{{ $t('appointments.title') }}</h1>
      <button
        @click="openCreate"
        class="flex items-center justify-center gap-2 px-4 py-2.5 bg-[hsl(var(--primary))] text-white text-sm font-semibold rounded-lg hover:opacity-90 w-full sm:w-auto"
      >
        <Plus :size="16" />
        {{ $t('appointments.add') }}
      </button>
    </div>

    <!-- Date filter -->
    <div class="flex items-center gap-3 flex-wrap">
      <label class="text-sm font-medium text-[hsl(var(--foreground))]">{{ $t('appointments.date') }}</label>
      <input
        v-model="selectedDate"
        type="date"
        class="px-3 py-2 text-sm border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
      />
    </div>

    <div v-if="isLoading" class="flex justify-center py-12">
      <Loader2 class="animate-spin text-[hsl(var(--primary))]" :size="32" />
    </div>

    <div v-else-if="!data?.length" class="text-center py-12 text-[hsl(var(--muted-foreground))]">
      {{ $t('appointments.noAppointments') }}
    </div>

    <div v-else class="space-y-5">
      <div
        v-for="group in data"
        :key="group.doctor?.id"
        class="bg-white border border-[hsl(var(--border))] rounded-xl overflow-hidden"
      >
        <div class="bg-[hsl(var(--muted))] px-4 md:px-5 py-3 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
              {{ group.doctor?.name?.charAt(0) }}
            </div>
            <span class="font-semibold text-sm truncate">{{ $t('tv.doctor') }} {{ group.doctor?.name }}</span>
          </div>
          <span class="text-xs text-[hsl(var(--muted-foreground))] flex-shrink-0">
            {{ group.appointments?.length }} {{ $t('appointments.count') }}
          </span>
        </div>
        <div class="divide-y divide-[hsl(var(--border))]">
          <div
            v-for="appt in group.appointments"
            :key="appt.id"
            class="px-4 md:px-5 py-3 flex items-center justify-between gap-3"
          >
            <div class="flex items-center gap-3 min-w-0">
              <span class="w-6 h-6 bg-[hsl(var(--muted))] rounded-full text-xs font-bold flex items-center justify-center text-[hsl(var(--muted-foreground))] flex-shrink-0">
                {{ appt.queue_position }}
              </span>
              <div class="min-w-0">
                <div class="font-bold text-sm truncate">{{ appt.patient?.name || appt.patient_name || appt.patient_phone }}</div>
                <div class="text-xs text-[hsl(var(--muted-foreground))]">{{ appt.patient_phone }}</div>
              </div>
            </div>
            <span
              :class="{
                'bg-yellow-100 text-yellow-700': appt.status === 'waiting',
                'bg-blue-100 text-blue-700': appt.status === 'active',
                'bg-green-100 text-green-700': appt.status === 'done',
                'bg-gray-100 text-gray-500': appt.status === 'cancelled',
              }"
              class="px-2.5 py-1 text-xs font-semibold rounded-full flex-shrink-0"
            >
              {{ $t(`appointments.status.${appt.status}`) }}
            </span>
          </div>
        </div>
      </div>
    </div>

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

            <!-- Doctor selector -->
            <div>
              <label class="block text-xs font-medium mb-1">{{ $t('appointments.doctor') }}</label>
              <select
                v-model="newAppt.doctor_id"
                required
                class="w-full px-3 py-2 text-sm border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] bg-white"
              >
                <option v-for="doc in doctors" :key="doc.id" :value="doc.id">
                  {{ $t('tv.doctor') }} {{ doc.name }}
                </option>
              </select>
            </div>

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
import { ref, computed, reactive, watch } from 'vue'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { Loader2, Plus, UserCheck, UserPlus, X } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { apiFetch } from '@/lib/utils'
import type { Doctor } from '@/domains/doctor/types'
import type { Patient } from '@/domains/patient/types'

interface Appointment {
  id: string
  clinic_id: string
  doctor_id: string | null
  patient_id: string | null
  patient_name: string | null
  patient_phone: string
  date: string
  time: string | null
  status: 'waiting' | 'active' | 'done' | 'cancelled'
  queue_position: number
  created_at: string
  updated_at: string
  patient?: { name: string; phone: string } | null
  doctor?: Doctor | null
}

interface DoctorGroup {
  doctor: Doctor | null
  appointments: Appointment[]
}

const auth = useAuthStore()
const qc = useQueryClient()
const clinicId = computed(() => (auth.profile as { id?: string } | null)?.id)
const selectedDate = ref(new Date().toISOString().split('T')[0])
const showCreate = ref(false)
const foundPatient = ref<Patient | null>(null)
const lookedUp = ref(false)
const showNewPatient = ref(false)
const saving = ref(false)

const newAppt = reactive({
  doctor_id: '',
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

const { data, isLoading } = useQuery({
  queryKey: ['appointments', clinicId, selectedDate],
  queryFn: () => apiFetch<DoctorGroup[]>(`/appointments/clinic/${clinicId.value}?date=${selectedDate.value}`),
  enabled: computed(() => !!clinicId.value),
})

const { data: doctors } = useQuery({
  queryKey: ['doctors', clinicId],
  queryFn: () => apiFetch<Doctor[]>(`/doctors/clinic/${clinicId.value}`),
  enabled: computed(() => !!clinicId.value),
})

function openCreate() {
  showCreate.value = true
}

function closeCreate() {
  showCreate.value = false
  foundPatient.value = null
  lookedUp.value = false
  showNewPatient.value = false
  Object.assign(newAppt, { doctor_id: '', patient_phone: '', patient_id: undefined, time: '', date: new Date().toISOString().split('T')[0] })
  Object.assign(newPatientForm, { name: '', birth_date: '', age: undefined })
}

async function lookupPatient() {
  if (!newAppt.patient_phone || !clinicId.value) return
  newAppt.patient_id = undefined
  lookedUp.value = false
  foundPatient.value = null
  showNewPatient.value = false
  const res = await apiFetch<Patient>(`/patients/lookup?phone=${encodeURIComponent(newAppt.patient_phone)}&clinic_id=${clinicId.value}`)
    .catch(() => null)
  foundPatient.value = res
  if (res) newAppt.patient_id = res.id
  lookedUp.value = true
}

async function createAppointment() {
  saving.value = true
  try {
    let patientId = newAppt.patient_id

    if (!foundPatient.value && showNewPatient.value && newPatientForm.name && clinicId.value) {
      const created = await apiFetch<Patient>('/patients', {
        method: 'POST',
        body: JSON.stringify({
          name: newPatientForm.name,
          phone: newAppt.patient_phone,
          birth_date: newPatientForm.birth_date || undefined,
          age: newPatientForm.age,
          clinic_id: clinicId.value,
        }),
      })
      patientId = created.id
      qc.invalidateQueries({ queryKey: ['patients'] })
    }

    await apiFetch('/appointments', {
      method: 'POST',
      body: JSON.stringify({
        clinic_id: clinicId.value,
        doctor_id: newAppt.doctor_id,
        patient_phone: newAppt.patient_phone,
        patient_id: patientId,
        date: newAppt.date,
        time: newAppt.time || undefined,
      }),
    })
    qc.invalidateQueries({ queryKey: ['appointments'] })
    closeCreate()
  } finally {
    saving.value = false
  }
}
</script>
