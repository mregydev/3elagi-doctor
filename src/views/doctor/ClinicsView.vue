<template>
  <div class="p-6 space-y-6">
    <h1 class="text-2xl font-bold">{{ $t('nav.clinics') }}</h1>

    <div v-if="isLoading" class="flex justify-center py-12">
      <Loader2 class="animate-spin text-[hsl(var(--primary))]" :size="32" />
    </div>

    <div v-else-if="!clinics?.length" class="text-center py-12 text-[hsl(var(--muted-foreground))]">
      {{ $t('clinics.noClinics') }}
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="clinic in clinics"
        :key="clinic.id"
        class="bg-white border border-[hsl(var(--border))] rounded-xl p-4 flex items-center justify-between gap-4"
      >
        <div class="flex items-center gap-4 min-w-0">
          <div class="w-11 h-11 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-lg flex-shrink-0">
            {{ clinic.name?.charAt(0) }}
          </div>
          <div class="min-w-0">
            <div class="font-semibold text-sm truncate">{{ clinic.name }}</div>
            <div class="text-xs text-[hsl(var(--muted-foreground))] truncate">{{ clinic.location }}</div>
            <div v-if="clinic.phone" class="text-xs text-[hsl(var(--muted-foreground))]">{{ clinic.phone }}</div>
          </div>
        </div>

        <!-- Already a member badge -->
        <span
          v-if="isMember(clinic.id)"
          class="flex-shrink-0 px-3 py-1.5 text-xs font-semibold bg-green-100 text-green-700 rounded-lg"
        >
          {{ $t('clinics.alreadyMember') }}
        </span>

        <!-- Request sent badge -->
        <span
          v-else-if="requestedClinicIds.has(clinic.id) || hasPendingRequest(clinic.id)"
          class="flex-shrink-0 px-3 py-1.5 text-xs font-semibold bg-yellow-100 text-yellow-700 rounded-lg"
        >
          {{ $t('clinics.requestSent') }}
        </span>

        <!-- Join button -->
        <button
          v-else
          @click="requestJoin(clinic.id)"
          :disabled="joining === clinic.id"
          class="flex-shrink-0 px-3 py-1.5 text-xs font-medium bg-[hsl(var(--primary))] text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {{ joining === clinic.id ? $t('common.loading') : $t('clinics.requestJoin') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { Loader2 } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { apiFetch } from '@/lib/utils'
import type { Clinic, JoinRequest } from '@/domains/clinic/types'
import type { DoctorProfile } from '@/stores/auth'

const auth = useAuthStore()
const requestedClinicIds = ref(new Set<string>())
const joining = ref<string | null>(null)

const doctorId = computed(() => (auth.profile as { id?: string } | null)?.id)
const defaultClinicId = computed(() => (auth.profile as DoctorProfile | null)?.default_clinic_id)

const { data: clinics, isLoading } = useQuery({
  queryKey: ['clinics'],
  queryFn: () => apiFetch<Clinic[]>('/clinics'),
})

const { data: myRequests } = useQuery({
  queryKey: ['doctor-join-requests'],
  queryFn: () => apiFetch<JoinRequest[]>('/join-requests/doctor/my'),
})

function hasPendingRequest(clinicId: string): boolean {
  return (myRequests.value ?? []).some(
    r => r.clinic_id === clinicId && r.status === 'pending'
  )
}

function isMember(clinicId: string): boolean {
  if (clinicId === defaultClinicId.value) return true
  return (myRequests.value ?? []).some(
    r => r.clinic_id === clinicId && r.status === 'approved'
  )
}

async function requestJoin(clinicId: string) {
  joining.value = clinicId
  try {
    await apiFetch('/join-requests/request', {
      method: 'POST',
      body: JSON.stringify({ doctor_id: doctorId.value, clinic_id: clinicId }),
    })
    requestedClinicIds.value.add(clinicId)
  } finally {
    joining.value = null
  }
}
</script>
