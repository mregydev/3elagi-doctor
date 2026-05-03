<template>
  <div class="min-h-screen flex flex-col p-4 md:p-6 gap-4 md:gap-6" style="background: hsl(var(--gray-0))">

    <!-- Header -->
    <div class="flex items-center justify-between flex-shrink-0">
      <div style="color: hsl(var(--primary))">
        <AppLogo :height="logoSize" />
      </div>
      <div class="tabular-nums font-semibold" :style="{ fontSize: clockFontSize, color: 'hsl(var(--muted-foreground))' }">
        {{ currentTime }}
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex-1 flex items-center justify-center">
      <Loader2 class="animate-spin" style="color: hsl(var(--primary))" :size="64" />
    </div>

    <!-- Empty (no active doctors) -->
    <div v-else-if="!visibleScreen.length" class="flex-1 flex items-center justify-center">
      <div class="text-2xl md:text-3xl font-semibold" style="color: hsl(var(--muted-foreground))">
        {{ $t('queue.noQueue') }}
      </div>
    </div>

    <!-- Single-doctor full list view -->
    <div
      v-else-if="visibleCount === 1 && (visibleScreen[0].waiting_list?.length ?? 0) > 0"
      class="flex-1 flex flex-col gap-4 min-h-0"
    >
      <div
        class="bg-white rounded-2xl border flex items-center gap-4 px-6 py-4 flex-shrink-0"
        style="border-color: hsl(var(--border)); box-shadow: 0 2px 10px 0 rgb(0 0 0 / .07)"
      >
        <div
          class="rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
          :style="{ width: '4rem', height: '4rem', fontSize: '1.75rem', background: 'hsl(var(--primary))' }"
        >
          {{ visibleScreen[0].doctor?.name?.charAt(0) }}
        </div>
        <span class="font-extrabold" :style="{ fontSize: 'clamp(1.6rem, 3vw, 2.6rem)', color: 'hsl(var(--foreground))' }">
          {{ $t('tv.doctor') }} {{ visibleScreen[0].doctor?.name }}
        </span>
      </div>
      <!-- Current patient banner -->
      <div
        v-if="visibleScreen[0].current_patient"
        class="rounded-2xl px-6 py-5 text-white flex flex-col gap-2 flex-shrink-0"
        style="background: hsl(var(--primary))"
      >
        <div class="font-semibold uppercase tracking-widest opacity-70" :style="{ fontSize: 'clamp(0.8rem, 1.4vw, 1.1rem)' }">
          {{ $t('tv.currentPatient') }}
        </div>
        <div class="font-extrabold leading-tight break-words" :style="{ fontSize: 'clamp(2rem, 5vh, 4rem)' }">
          {{ visibleScreen[0].current_patient }}
        </div>
      </div>
      <!-- Waiting list -->
      <div
        class="bg-white rounded-2xl border flex-1 min-h-0 flex flex-col overflow-hidden"
        style="border-color: hsl(var(--border)); box-shadow: 0 2px 10px 0 rgb(0 0 0 / .07)"
      >
        <div class="px-6 py-3 flex-shrink-0 font-semibold uppercase tracking-widest" style="border-bottom: 1px solid hsl(var(--border)); color: hsl(var(--muted-foreground)); font-size: clamp(0.85rem, 1.4vw, 1.1rem)">
          {{ $t('tv.waitingList') }} ({{ visibleScreen[0].waiting_list?.length }})
        </div>
        <div class="flex-1 overflow-y-auto divide-y" style="border-color: hsl(var(--border))">
          <div
            v-for="(entry, idx) in visibleScreen[0].waiting_list"
            :key="entry.id"
            class="px-6 py-3 flex items-center gap-4"
            :style="{ background: idx === 0 ? 'hsl(210 80% 96%)' : 'transparent' }"
          >
            <div
              class="rounded-full flex items-center justify-center font-bold flex-shrink-0"
              :style="{
                width: '3rem', height: '3rem',
                fontSize: '1.4rem',
                background: idx === 0 ? 'hsl(210 80% 55%)' : 'hsl(var(--muted))',
                color: idx === 0 ? 'white' : 'hsl(var(--muted-foreground))'
              }"
            >
              {{ idx + 1 }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-bold truncate" :style="{ fontSize: 'clamp(1.4rem, 2.4vw, 2rem)', color: 'hsl(var(--foreground))' }">
                {{ entry.label }}
              </div>
              <div v-if="entry.time" class="text-sm opacity-60" :style="{ fontSize: 'clamp(0.85rem, 1.2vw, 1rem)' }">
                {{ entry.time.slice(0, 5) }}
              </div>
            </div>
            <span
              v-if="idx === 0"
              class="px-3 py-1 rounded-full text-white font-bold flex-shrink-0"
              :style="{ background: 'hsl(210 80% 55%)', fontSize: 'clamp(0.7rem, 1vw, 0.9rem)' }"
            >
              {{ $t('tv.nextPatient') }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Doctor cards grid -->
    <div
      v-else
      class="flex-1 grid gap-4 md:gap-5 content-start"
      :class="visibleCount > 3 ? 'grid-cols-2' : 'grid-cols-1'"
    >
      <div
        v-for="item in visibleScreen"
        :key="item.doctor?.id"
        class="bg-white rounded-2xl border flex flex-col overflow-hidden"
        style="border-color: hsl(var(--border)); box-shadow: 0 2px 10px 0 rgb(0 0 0 / .07)"
      >
        <!-- Doctor name row -->
        <div
          class="flex items-center gap-3 px-5 py-3 flex-shrink-0"
          style="border-bottom: 1px solid hsl(var(--border))"
        >
          <div
            class="rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
            :style="{ width: avatarSize, height: avatarSize, fontSize: avatarFontSize, background: 'hsl(var(--primary))' }"
          >
            {{ item.doctor?.name?.charAt(0) }}
          </div>
          <span class="font-extrabold truncate" :style="{ fontSize: doctorFontSize, color: 'hsl(var(--foreground))' }">
            {{ $t('tv.doctor') }} {{ item.doctor?.name }}
          </span>
        </div>

        <!-- Patient cards row -->
        <div class="flex flex-1 min-h-0 gap-3 md:gap-4 p-3 md:p-4">
          <!-- Current patient -->
          <div
            class="rounded-xl flex flex-col gap-2 md:gap-3 p-4 md:p-5 text-white overflow-hidden"
            style="background: hsl(var(--primary)); flex: 1; max-width: 50%"
          >
            <div class="font-semibold uppercase tracking-widest opacity-70 flex-shrink-0" :style="{ fontSize: labelFontSize }">
              {{ $t('tv.currentPatient') }}
            </div>
            <div v-if="displayCurrent(item)" class="font-extrabold leading-tight break-words" :style="{ fontSize: patientFontSize }">
              {{ displayCurrent(item) }}
            </div>
            <div v-else class="opacity-30 font-semibold italic" :style="{ fontSize: patientFontSize }">
              {{ $t('tv.waiting') }}
            </div>
          </div>

          <!-- Next patient (only when exists) -->
          <div
            v-if="displayNext(item)"
            class="rounded-xl flex flex-col gap-2 md:gap-3 p-4 md:p-5 text-white overflow-hidden"
            style="background: hsl(210 80% 55%); flex: 1; max-width: 50%"
          >
            <div class="font-semibold uppercase tracking-widest opacity-70 flex-shrink-0" :style="{ fontSize: labelFontSize }">
              {{ $t('tv.nextPatient') }}
            </div>
            <div class="font-extrabold leading-tight break-words" :style="{ fontSize: patientFontSize }">
              {{ displayNext(item) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { Loader2 } from 'lucide-vue-next'
import { apiFetch } from '@/lib/utils'
import AppLogo from '@/components/AppLogo.vue'

interface WaitingEntry {
  id: string
  position: number
  label: string
  time: string | null
  hide_name: boolean
}
interface TVScreenEntry {
  doctor: { id: string; name: string }
  current_patient: string | null
  next_patient: string | null
  waiting_list?: WaitingEntry[]
}

const route = useRoute()
const clinicId = route.params.clinicId as string
const currentTime = ref('')

const { data: screen, isLoading } = useQuery({
  queryKey: ['tv-screen', clinicId],
  queryFn: () => apiFetch<TVScreenEntry[]>(`/appointments/clinic/${clinicId}/screen`),
  refetchInterval: 10000,
})

function displayCurrent(item: TVScreenEntry): string | null {
  return item.current_patient ?? item.next_patient
}

function displayNext(item: TVScreenEntry): string | null {
  return item.current_patient ? item.next_patient : null
}

/** Only doctors who have at least one patient (current, next, or in waiting list) */
const visibleScreen = computed<TVScreenEntry[]>(() =>
  (screen.value ?? []).filter(item =>
    item.current_patient || item.next_patient || (item.waiting_list?.length ?? 0) > 0
  )
)

const visibleCount = computed(() => visibleScreen.value.length)

/** Font / size helpers — scale down when >3 doctors and 2-per-row grid is active */
const patientFontSize = computed(() => {
  const n = visibleCount.value
  if (n === 1) return 'clamp(2.2rem, 6vh, 5rem)'
  if (n === 2) return 'clamp(1.8rem, 5vh, 4rem)'
  if (n === 3) return 'clamp(1.5rem, 4vh, 3.2rem)'
  return 'clamp(1.2rem, 3vh, 2.4rem)'
})

const doctorFontSize = computed(() => {
  const n = visibleCount.value
  if (n === 1) return 'clamp(1.8rem, 3.5vw, 3.5rem)'
  if (n === 2) return 'clamp(1.4rem, 2.8vw, 2.8rem)'
  if (n === 3) return 'clamp(1.2rem, 2.2vw, 2.2rem)'
  return 'clamp(1rem, 1.8vw, 1.8rem)'
})

const labelFontSize = computed(() => {
  const n = visibleCount.value
  if (n <= 2) return 'clamp(0.75rem, 1.4vw, 1rem)'
  return 'clamp(0.65rem, 1.1vw, 0.85rem)'
})

const clockFontSize = computed(() => {
  const n = visibleCount.value
  return n <= 2 ? 'clamp(1.4rem, 2.5vw, 2.4rem)' : 'clamp(1rem, 1.8vw, 1.8rem)'
})

const logoSize = computed(() => (visibleCount.value <= 2 ? 64 : 48))

const avatarSize = computed(() => {
  const n = visibleCount.value
  if (n === 1) return '4rem'
  if (n === 2) return '3.5rem'
  return '2.8rem'
})

const avatarFontSize = computed(() => {
  const n = visibleCount.value
  if (n === 1) return '1.75rem'
  if (n === 2) return '1.5rem'
  return '1.2rem'
})

let timer: ReturnType<typeof setInterval>
onMounted(() => {
  const update = () => {
    currentTime.value = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
  }
  update()
  timer = setInterval(update, 1000)
})
onUnmounted(() => clearInterval(timer))
</script>
