<template>
  <div class="p-4 md:p-6 max-w-5xl mx-auto" :dir="locale === 'ar' ? 'rtl' : 'ltr'">
    <!-- Header -->
    <div class="flex items-center justify-between mb-2 gap-3 flex-wrap">
      <div>
        <h1 class="text-xl md:text-2xl font-bold">{{ $t('intakeTests.title') }}</h1>
        <p class="text-xs md:text-sm text-[hsl(var(--muted-foreground))] mt-1 max-w-2xl">{{ $t('intakeTests.subtitle') }}</p>
      </div>
      <RouterLink
        to="/doctor/intake-tests/new"
        class="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold bg-[hsl(var(--primary))] text-white rounded-lg hover:opacity-90"
      >
        <Plus :size="16" /> {{ $t('intakeTests.add') }}
      </RouterLink>
    </div>

    <div v-if="isLoading" class="text-sm text-[hsl(var(--muted-foreground))] mt-6">{{ $t('common.loading') }}</div>

    <div
      v-else-if="!tests.length"
      class="mt-8 p-8 text-center bg-white border border-dashed border-[hsl(var(--border))] rounded-xl text-sm text-[hsl(var(--muted-foreground))]"
    >
      {{ $t('intakeTests.empty') }}
    </div>

    <div v-else class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
      <div
        v-for="test in tests"
        :key="test.id"
        class="bg-white border border-[hsl(var(--border))] rounded-xl p-4 flex flex-col"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <div class="font-semibold truncate">{{ test.name }}</div>
              <span
                v-if="!test.is_active"
                class="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 uppercase tracking-wide"
              >{{ $t('intakeTests.inactive') }}</span>
            </div>
            <div v-if="test.description" class="text-xs text-[hsl(var(--muted-foreground))] mt-1 line-clamp-2">
              {{ test.description }}
            </div>
          </div>
          <div class="flex gap-1 flex-shrink-0">
            <RouterLink :to="`/doctor/intake-tests/${test.id}/edit`" class="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
              <Pencil :size="14" />
            </RouterLink>
            <button @click="remove(test)" class="p-1.5 rounded-lg hover:bg-red-50 text-red-500">
              <Trash2 :size="14" />
            </button>
          </div>
        </div>
        <div class="mt-3 flex items-center gap-3 text-xs text-[hsl(var(--muted-foreground))]">
          <span class="inline-flex items-center gap-1">
            <ClipboardList :size="13" />
            {{ tt('intakeTests.questionsCount', { count: test.questions?.length ?? 0 }, test.questions?.length ?? 0) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { Plus, Pencil, Trash2, ClipboardList } from 'lucide-vue-next'
import { apiFetch } from '@/lib/utils'

interface IntakeTest {
  id: string
  name: string
  description?: string | null
  is_active: boolean
  questions: { id: string }[]
  created_at: string
  updated_at: string
}

const { locale, t: tt } = useI18n()
const qc = useQueryClient()

const { data, isLoading } = useQuery({
  queryKey: ['intake-tests'],
  queryFn: () => apiFetch<IntakeTest[]>('/intake-tests'),
})
const tests = computed(() => data.value ?? [])

async function remove(t: IntakeTest) {
  // eslint-disable-next-line no-alert
  if (!window.confirm(tt('intakeTests.deleteConfirm'))) return
  await apiFetch(`/intake-tests/${t.id}`, { method: 'DELETE' })
  qc.invalidateQueries({ queryKey: ['intake-tests'] })
}
</script>
