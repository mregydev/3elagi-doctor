<template>
  <div class="p-4 md:p-6 space-y-5 md:space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-xl md:text-2xl font-bold text-[hsl(var(--foreground))]">{{ $t('dashboard.title') }}</h1>
      <p class="text-sm text-[hsl(var(--muted-foreground))] mt-1">
        {{ profile?.name }}
      </p>
    </div>

    <!-- Stats cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
      <StatCard
        :title="$t('dashboard.appointmentsToday')"
        :value="data?.appointmentsToday ?? '–'"
        color="blue"
        icon="calendar"
      />
      <StatCard
        :title="$t('dashboard.doctorCount')"
        :value="data?.doctorCount ?? '–'"
        color="green"
        icon="stethoscope"
      />
      <StatCard
        :title="$t('dashboard.pendingRequests')"
        :value="data?.pendingRequests ?? '–'"
        color="orange"
        icon="bell"
      />
    </div>

    <!-- Quick actions -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
      <RouterLink
        to="/clinic/appointments"
        class="bg-white border border-[hsl(var(--border))] rounded-xl p-4 md:p-5 hover:shadow-md transition-shadow flex items-center gap-4"
      >
        <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <CalendarDays class="text-blue-600" :size="20" />
        </div>
        <div>
          <div class="font-bold text-sm">{{ $t('nav.appointments') }}</div>
          <div class="text-xs text-[hsl(var(--muted-foreground))]">{{ $t('appointments.title') }}</div>
        </div>
      </RouterLink>

      <RouterLink
        to="/clinic/join-requests"
        class="bg-white border border-[hsl(var(--border))] rounded-xl p-4 md:p-5 hover:shadow-md transition-shadow flex items-center gap-4"
      >
        <div class="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <UserPlus class="text-orange-600" :size="20" />
        </div>
        <div>
          <div class="font-bold text-sm">{{ $t('nav.joinRequests') }}</div>
          <div class="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
            <span v-if="data?.pendingRequests" class="text-orange-600 font-semibold">{{ data.pendingRequests }}</span>
            {{ $t('joinRequests.pending') }}
          </div>
        </div>
      </RouterLink>

      <RouterLink
        to="/clinic/doctors"
        class="bg-white border border-[hsl(var(--border))] rounded-xl p-4 md:p-5 hover:shadow-md transition-shadow flex items-center gap-4"
      >
        <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Stethoscope class="text-green-600" :size="20" />
        </div>
        <div>
          <div class="font-bold text-sm">{{ $t('nav.doctors') }}</div>
          <div class="text-xs text-[hsl(var(--muted-foreground))]">{{ $t('doctors.title') }}</div>
        </div>
      </RouterLink>

      <RouterLink
        to="/clinic/patients"
        class="bg-white border border-[hsl(var(--border))] rounded-xl p-4 md:p-5 hover:shadow-md transition-shadow flex items-center gap-4"
      >
        <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Users class="text-purple-600" :size="20" />
        </div>
        <div>
          <div class="font-bold text-sm">{{ $t('nav.patients') }}</div>
          <div class="text-xs text-[hsl(var(--muted-foreground))]">{{ $t('patients.title') }}</div>
        </div>
      </RouterLink>
    </div>

    <!-- TV Screen link -->
    <div v-if="clinicId" class="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-4 md:p-5 text-white flex items-center justify-between gap-4">
      <div>
        <div class="font-bold">{{ $t('tv.title') }}</div>
        <div class="text-blue-200 text-sm mt-1">{{ $t('dashboard.tvScreen') }}</div>
      </div>
      <a
        :href="`/3eyadahub/tv/${clinicId}`"
        target="_blank"
        class="bg-white text-blue-600 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2 flex-shrink-0"
      >
        <Monitor :size="16" />
        <span class="hidden sm:inline">{{ $t('dashboard.openScreen') }}</span>
        <span class="sm:hidden">TV</span>
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { CalendarDays, UserPlus, Monitor, Stethoscope, Users } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { apiFetch } from '@/lib/utils'
import StatCard from '@/components/StatCard.vue'

const auth = useAuthStore()
const profile = computed(() => auth.profile)
const clinicId = computed(() => (auth.profile as { id?: string } | null)?.id)

interface DashboardData {
  appointmentsToday: number
  doctorCount: number
  pendingRequests: number
}

const { data } = useQuery({
  queryKey: ['clinic-dashboard', clinicId],
  queryFn: () => clinicId.value
    ? apiFetch<DashboardData>(`/clinics/${clinicId.value}/dashboard`)
    : null,
  enabled: computed(() => !!clinicId.value),
})
</script>
