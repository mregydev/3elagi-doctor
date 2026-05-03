<template>
  <div class="p-4 md:p-6 max-w-5xl mx-auto" :dir="locale === 'ar' ? 'rtl' : 'ltr'">
    <div class="mb-4">
      <h1 class="text-xl md:text-2xl font-bold">{{ $t('schedule.titleAvailability') }}</h1>
      <p class="text-xs md:text-sm text-[hsl(var(--muted-foreground))] mt-1 max-w-2xl">{{ $t('schedule.subtitleAvailability') }}</p>
    </div>

    <!-- Tabs -->
    <div class="inline-flex p-1 rounded-xl bg-[hsl(225_100%_96%)] mb-4 gap-1">
      <button
        type="button"
        class="px-4 py-2 text-sm font-semibold rounded-lg transition"
        :class="activeTab === 'weekly' ? 'bg-white text-[hsl(var(--primary))] shadow-sm' : 'text-[hsl(var(--muted-foreground))]'"
        @click="activeTab = 'weekly'"
      >
        <CalendarRange class="inline-block me-1.5" :size="14" />
        {{ $t('schedule.tabWeekly') }}
      </button>
      <button
        type="button"
        class="px-4 py-2 text-sm font-semibold rounded-lg transition"
        :class="activeTab === 'overrides' ? 'bg-white text-[hsl(var(--primary))] shadow-sm' : 'text-[hsl(var(--muted-foreground))]'"
        @click="activeTab = 'overrides'"
      >
        <CalendarDays class="inline-block me-1.5" :size="14" />
        {{ $t('schedule.tabOverrides') }}
        <span
          v-if="overrideRows.length"
          class="ms-1.5 inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-[10px] font-bold rounded-full bg-[hsl(var(--primary))] text-white"
        >{{ overrideRows.length }}</span>
      </button>
    </div>

    <!-- ── Weekly tab ──────────────────────────────────────── -->
    <section v-show="activeTab === 'weekly'">
      <div v-if="isLoading" class="text-sm text-[hsl(var(--muted-foreground))]">{{ $t('common.loading') }}</div>

      <div v-else class="bg-white rounded-xl border border-[hsl(var(--border))] overflow-hidden">
        <div v-if="!rows.length" class="p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
          {{ $t('schedule.noSlots') }}
        </div>

        <div v-else class="divide-y divide-[hsl(var(--border))]">
          <div
            v-for="(row, idx) in rows"
            :key="idx"
            class="grid grid-cols-12 gap-2 items-center px-3 md:px-5 py-3"
          >
            <div class="col-span-12 sm:col-span-3">
              <select
                v-model.number="row.day_of_week"
                class="w-full px-2.5 py-2 text-sm border border-[hsl(var(--border))] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
              >
                <option v-for="d in 7" :key="d" :value="d - 1">
                  {{ tt(`schedule.days.${d - 1}`) }}
                </option>
              </select>
            </div>
            <div class="col-span-4 sm:col-span-2">
              <input v-model="row.start_time" type="time" class="w-full px-2.5 py-2 text-sm border border-[hsl(var(--border))] rounded-lg" />
            </div>
            <div class="col-span-4 sm:col-span-2">
              <input v-model="row.end_time" type="time" class="w-full px-2.5 py-2 text-sm border border-[hsl(var(--border))] rounded-lg" />
            </div>
            <div class="col-span-4 sm:col-span-2">
              <input v-model.number="row.slot_minutes" type="number" min="5" max="240" class="w-full px-2.5 py-2 text-sm border border-[hsl(var(--border))] rounded-lg" />
            </div>
            <div class="col-span-8 sm:col-span-2 flex items-center justify-between gap-2">
              <label class="inline-flex items-center gap-1.5 text-xs">
                <input v-model="row.is_active" type="checkbox" class="w-4 h-4 accent-[hsl(var(--primary))]" />
                {{ $t('schedule.enabled') }}
              </label>
              <button @click="rows.splice(idx, 1)" class="p-1.5 rounded-lg text-red-500 hover:bg-red-50">
                <Trash2 :size="14" />
              </button>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-2 p-3 md:p-4 border-t border-[hsl(var(--border))] bg-slate-50/50">
          <button @click="addRow" class="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-[hsl(var(--primary))] bg-blue-50 rounded-lg hover:bg-blue-100">
            <Plus :size="14" /> {{ $t('schedule.addRow') }}
          </button>
          <button
            @click="saveWeekly"
            :disabled="saving"
            class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-[hsl(var(--primary))] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {{ saving ? $t('common.loading') : $t('schedule.save') }}
          </button>
        </div>
      </div>
    </section>

    <!-- ── Overrides tab ─────────────────────────────────────── -->
    <section v-show="activeTab === 'overrides'">
      <div class="rounded-xl border border-blue-100 bg-blue-50/60 p-3 mb-3 text-xs text-[hsl(var(--primary))] flex items-start gap-2">
        <Info :size="14" class="flex-shrink-0 mt-0.5" />
        <span>{{ $t('schedule.overridesHint') }}</span>
      </div>

      <div v-if="isLoadingOverrides" class="text-sm text-[hsl(var(--muted-foreground))]">{{ $t('common.loading') }}</div>

      <div v-else class="bg-white rounded-xl border border-[hsl(var(--border))] overflow-hidden">
        <div v-if="!overrideRows.length" class="p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
          {{ $t('schedule.noOverrides') }}
        </div>

        <div v-else class="divide-y divide-[hsl(var(--border))]">
          <div
            v-for="(row, idx) in overrideRows"
            :key="idx"
            class="p-4 md:p-5 space-y-3"
          >
            <div class="grid grid-cols-12 gap-2">
              <!-- Scope -->
              <div class="col-span-12 sm:col-span-3">
                <label class="block text-[11px] font-semibold mb-1 text-[hsl(var(--muted-foreground))]">{{ $t('schedule.scope') }}</label>
                <select
                  v-model="row.scope"
                  class="w-full px-2.5 py-2 text-sm border border-[hsl(var(--border))] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                  @change="onScopeChange(row)"
                >
                  <option value="day">{{ $t('schedule.scopeDay') }}</option>
                  <option value="week">{{ $t('schedule.scopeWeek') }}</option>
                  <option value="month">{{ $t('schedule.scopeMonth') }}</option>
                </select>
              </div>

              <!-- Start date -->
              <div class="col-span-6 sm:col-span-3">
                <label class="block text-[11px] font-semibold mb-1 text-[hsl(var(--muted-foreground))]">{{ $t('schedule.startDate') }}</label>
                <input
                  v-model="row.start_date"
                  type="date"
                  class="w-full px-2.5 py-2 text-sm border border-[hsl(var(--border))] rounded-lg"
                  @change="onStartDateChange(row)"
                />
              </div>

              <!-- End date -->
              <div class="col-span-6 sm:col-span-3">
                <label class="block text-[11px] font-semibold mb-1 text-[hsl(var(--muted-foreground))]">{{ $t('schedule.endDate') }}</label>
                <input
                  v-model="row.end_date"
                  type="date"
                  :disabled="row.scope !== 'day' && row.scope !== 'week' ? false : false"
                  class="w-full px-2.5 py-2 text-sm border border-[hsl(var(--border))] rounded-lg"
                />
              </div>

              <!-- Closed toggle + delete -->
              <div class="col-span-12 sm:col-span-3 flex items-end justify-between gap-2">
                <label class="inline-flex items-center gap-1.5 text-xs h-9">
                  <input v-model="row.is_closed" type="checkbox" class="w-4 h-4 accent-rose-500" />
                  <span class="font-semibold" :class="row.is_closed ? 'text-rose-600' : ''">
                    {{ $t('schedule.closedDay') }}
                  </span>
                </label>
                <button @click="overrideRows.splice(idx, 1)" class="p-1.5 rounded-lg text-red-500 hover:bg-red-50 h-9">
                  <Trash2 :size="14" />
                </button>
              </div>
            </div>

            <!-- Open hours (only when not closed) -->
            <div v-if="!row.is_closed" class="grid grid-cols-12 gap-2">
              <div class="col-span-4">
                <label class="block text-[11px] font-semibold mb-1 text-[hsl(var(--muted-foreground))]">{{ $t('schedule.startTime') }}</label>
                <input v-model="row.start_time" type="time" class="w-full px-2.5 py-2 text-sm border border-[hsl(var(--border))] rounded-lg" />
              </div>
              <div class="col-span-4">
                <label class="block text-[11px] font-semibold mb-1 text-[hsl(var(--muted-foreground))]">{{ $t('schedule.endTime') }}</label>
                <input v-model="row.end_time" type="time" class="w-full px-2.5 py-2 text-sm border border-[hsl(var(--border))] rounded-lg" />
              </div>
              <div class="col-span-4">
                <label class="block text-[11px] font-semibold mb-1 text-[hsl(var(--muted-foreground))]">{{ $t('schedule.slotMinutes') }}</label>
                <input v-model.number="row.slot_minutes" type="number" min="5" max="240" class="w-full px-2.5 py-2 text-sm border border-[hsl(var(--border))] rounded-lg" />
              </div>
            </div>

            <input
              v-model="row.note"
              type="text"
              maxlength="200"
              :placeholder="$t('schedule.notePh')"
              class="w-full px-2.5 py-2 text-xs border border-[hsl(var(--border))] rounded-lg"
            />
          </div>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-2 p-3 md:p-4 border-t border-[hsl(var(--border))] bg-slate-50/50">
          <div class="flex flex-wrap gap-2">
            <button @click="addOverride('day')" class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[hsl(var(--primary))] bg-blue-50 rounded-lg hover:bg-blue-100">
              <Plus :size="13" /> {{ $t('schedule.addDay') }}
            </button>
            <button @click="addOverride('week')" class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[hsl(var(--primary))] bg-blue-50 rounded-lg hover:bg-blue-100">
              <Plus :size="13" /> {{ $t('schedule.addWeek') }}
            </button>
            <button @click="addOverride('month')" class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[hsl(var(--primary))] bg-blue-50 rounded-lg hover:bg-blue-100">
              <Plus :size="13" /> {{ $t('schedule.addMonth') }}
            </button>
          </div>
          <button
            @click="saveOverrides"
            :disabled="savingOverrides"
            class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-[hsl(var(--primary))] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {{ savingOverrides ? $t('common.loading') : $t('schedule.save') }}
          </button>
        </div>
      </div>
    </section>

    <p v-if="message" class="mt-3 text-xs text-emerald-600">{{ message }}</p>
    <p v-if="error" class="mt-3 text-xs text-red-600">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { Trash2, Plus, CalendarRange, CalendarDays, Info } from 'lucide-vue-next'
import { apiFetch } from '@/lib/utils'

interface ScheduleRow {
  day_of_week: number
  start_time: string
  end_time: string
  slot_minutes: number
  is_active: boolean
}

type ScopeType = 'day' | 'week' | 'month'

interface OverrideRow {
  id?: string
  scope: ScopeType
  start_date: string
  end_date: string
  is_closed: boolean
  start_time: string
  end_time: string
  slot_minutes: number
  note: string
}

const { locale, t: tt } = useI18n()
const qc = useQueryClient()

const activeTab = ref<'weekly' | 'overrides'>('weekly')

// ── Weekly ──────────────────────────────────────────────────────────
const rows = ref<ScheduleRow[]>([])
const saving = ref(false)
const message = ref('')
const error = ref('')

const { data, isLoading } = useQuery({
  queryKey: ['my-schedules'],
  queryFn: () => apiFetch<ScheduleRow[]>('/schedules/me'),
})

function defaultWeek(): ScheduleRow[] {
  return Array.from({ length: 7 }, (_, i) => ({
    day_of_week: i,
    start_time: '12:00',
    end_time: '23:59',
    slot_minutes: 15,
    is_active: true,
  }))
}

watch(data, (v) => {
  if (v) {
    rows.value = v.length
      ? v.map((r) => ({
          day_of_week: Number(r.day_of_week),
          start_time: (r.start_time || '').slice(0, 5),
          end_time: (r.end_time || '').slice(0, 5),
          slot_minutes: Number(r.slot_minutes) || 15,
          is_active: r.is_active !== false,
        }))
      : defaultWeek()
  }
}, { immediate: true })

function addRow() {
  const used = new Set(rows.value.map((r) => r.day_of_week))
  let day = 0
  for (let i = 0; i < 7; i++) {
    if (!used.has(i)) { day = i; break }
    if (i === 6) day = -1
  }
  if (day === -1) {
    error.value = tt('schedule.duplicateDay', { day: tt('schedule.days.0') })
    return
  }
  rows.value.push({
    day_of_week: day,
    start_time: '09:00',
    end_time: '17:00',
    slot_minutes: 15,
    is_active: true,
  })
}

async function saveWeekly() {
  error.value = ''
  message.value = ''
  for (const r of rows.value) {
    if (r.end_time <= r.start_time) {
      error.value = tt('schedule.invalidRange')
      return
    }
  }
  // Block duplicate days entirely.
  const seen = new Set<number>()
  for (const r of rows.value) {
    if (seen.has(r.day_of_week)) {
      error.value = tt('schedule.duplicateDay', { day: tt(`schedule.days.${r.day_of_week}`) })
      return
    }
    seen.add(r.day_of_week)
  }
  saving.value = true
  try {
    await apiFetch('/schedules/me', {
      method: 'PUT',
      body: JSON.stringify({ items: rows.value }),
    })
    message.value = tt('schedule.saved')
    qc.invalidateQueries({ queryKey: ['my-schedules'] })
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    saving.value = false
  }
}

// ── Overrides ───────────────────────────────────────────────────────
const overrideRows = ref<OverrideRow[]>([])
const savingOverrides = ref(false)

const { data: overridesData, isLoading: isLoadingOverrides } = useQuery({
  queryKey: ['my-schedule-overrides'],
  queryFn: () => apiFetch<OverrideRow[]>('/schedules/me/overrides'),
})

watch(overridesData, (v) => {
  if (v) {
    overrideRows.value = v.map((r) => ({
      id: r.id,
      scope: r.scope,
      start_date: String(r.start_date).slice(0, 10),
      end_date: String(r.end_date).slice(0, 10),
      is_closed: !!r.is_closed,
      start_time: r.start_time ? String(r.start_time).slice(0, 5) : '09:00',
      end_time: r.end_time ? String(r.end_time).slice(0, 5) : '17:00',
      slot_minutes: Number(r.slot_minutes) || 15,
      note: r.note ?? '',
    }))
  }
}, { immediate: true })

function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function endOfMonth(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0))
  return last.toISOString().slice(0, 10)
}

function computeEndDate(scope: ScopeType, start: string): string {
  if (scope === 'day') return start
  if (scope === 'week') return addDays(start, 6)
  return endOfMonth(start)
}

function addOverride(scope: ScopeType) {
  const start = todayISO()
  overrideRows.value.push({
    scope,
    start_date: start,
    end_date: computeEndDate(scope, start),
    is_closed: false,
    start_time: '09:00',
    end_time: '17:00',
    slot_minutes: 15,
    note: '',
  })
}

function onScopeChange(row: OverrideRow) {
  row.end_date = computeEndDate(row.scope, row.start_date)
}

function onStartDateChange(row: OverrideRow) {
  if (row.scope !== 'day' || row.end_date < row.start_date) {
    row.end_date = computeEndDate(row.scope, row.start_date)
  }
}

async function saveOverrides() {
  error.value = ''
  message.value = ''
  for (const r of overrideRows.value) {
    if (r.end_date < r.start_date) {
      error.value = tt('schedule.invalidDateRange')
      return
    }
    if (!r.is_closed && r.end_time <= r.start_time) {
      error.value = tt('schedule.invalidRange')
      return
    }
  }
  savingOverrides.value = true
  try {
    const payload = overrideRows.value.map((r) => ({
      scope: r.scope,
      start_date: r.start_date,
      end_date: r.end_date,
      is_closed: r.is_closed,
      start_time: r.is_closed ? null : r.start_time,
      end_time: r.is_closed ? null : r.end_time,
      slot_minutes: r.is_closed ? null : r.slot_minutes,
      note: r.note || null,
    }))
    await apiFetch('/schedules/me/overrides', {
      method: 'PUT',
      body: JSON.stringify({ items: payload }),
    })
    message.value = tt('schedule.saved')
    qc.invalidateQueries({ queryKey: ['my-schedule-overrides'] })
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    savingOverrides.value = false
  }
}
</script>
