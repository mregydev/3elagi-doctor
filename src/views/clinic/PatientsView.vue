<template>
  <div class="p-4 md:p-6 space-y-5 md:space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <h1 class="text-xl md:text-2xl font-bold">{{ $t('patients.title') }}</h1>
      <button
        @click="showCreate = true"
        class="flex items-center justify-center gap-2 px-4 py-2.5 bg-[hsl(var(--primary))] text-white text-sm font-semibold rounded-lg hover:opacity-90 w-full sm:w-auto"
      >
        <UserPlus :size="16" />
        {{ $t('patients.add') }}
      </button>
    </div>

    <!-- Search -->
    <div class="relative">
      <Search class="absolute start-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" :size="16" />
      <input
        v-model="search"
        type="search"
        :placeholder="$t('patients.search')"
        class="w-full ps-9 pe-4 py-2.5 text-sm border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
      />
    </div>

    <div v-if="isLoading" class="flex justify-center py-12">
      <Loader2 class="animate-spin text-[hsl(var(--primary))]" :size="32" />
    </div>
    <div v-else-if="!filtered.length" class="text-center py-12 text-[hsl(var(--muted-foreground))]">
      {{ $t('patients.notFound') }}
    </div>
    <div v-else class="space-y-2.5">
      <RouterLink
        v-for="p in filtered"
        :key="p.id"
        :to="`/clinic/patients/${p.id}`"
        class="bg-white border border-[hsl(var(--border))] rounded-xl p-4 flex items-center justify-between hover:shadow-sm transition-shadow block"
      >
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold flex-shrink-0">
            {{ p.name?.charAt(0) }}
          </div>
          <div class="min-w-0">
            <div class="font-bold text-sm truncate">{{ p.name }}</div>
            <div class="text-xs text-[hsl(var(--muted-foreground))]">{{ p.phone }}</div>
          </div>
        </div>
        <ChevronLeft v-if="locale === 'ar'" :size="16" class="text-[hsl(var(--muted-foreground))] flex-shrink-0" />
        <ChevronRight v-else :size="16" class="text-[hsl(var(--muted-foreground))] flex-shrink-0" />
      </RouterLink>
    </div>

    <!-- Create patient modal -->
    <Teleport to="body">
      <div v-if="showCreate" class="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
        <div class="bg-white rounded-t-2xl sm:rounded-2xl p-5 md:p-6 w-full sm:max-w-md space-y-4 max-h-[92vh] overflow-y-auto">
          <div class="flex items-center justify-between">
            <h2 class="font-bold text-lg">{{ $t('patients.create') }}</h2>
            <button @click="showCreate = false" class="p-1 rounded-lg hover:bg-[hsl(var(--muted))]">
              <X :size="18" />
            </button>
          </div>
          <form @submit.prevent="createPatient" class="space-y-3">
            <div>
              <label class="block text-xs font-medium mb-1">{{ $t('patients.name') }}</label>
              <input v-model="newP.name" required class="w-full px-3 py-2.5 text-sm border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]" />
            </div>
            <div>
              <label class="block text-xs font-medium mb-1">{{ $t('patients.phone') }}</label>
              <input v-model="newP.phone" required class="w-full px-3 py-2.5 text-sm border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium mb-1">{{ $t('patients.birthDate') }}</label>
                <input v-model="newP.birth_date" type="date" class="w-full px-3 py-2.5 text-sm border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]" />
              </div>
              <div>
                <label class="block text-xs font-medium mb-1">{{ $t('patients.age') }}</label>
                <input v-model.number="newP.age" type="number" class="w-full px-3 py-2.5 text-sm border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]" />
              </div>
            </div>
            <div class="flex gap-3 pt-1">
              <button type="button" @click="showCreate = false" class="flex-1 py-2.5 text-sm border border-[hsl(var(--border))] rounded-lg hover:bg-[hsl(var(--muted))]">
                {{ $t('common.cancel') }}
              </button>
              <button type="submit" class="flex-1 py-2.5 text-sm bg-[hsl(var(--primary))] text-white rounded-lg hover:opacity-90">
                {{ $t('common.save') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { Loader2, UserPlus, Search, ChevronLeft, ChevronRight, X } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { apiFetch } from '@/lib/utils'
import type { Patient } from '@/domains/patient/types'

const { locale } = useI18n()
const auth = useAuthStore()
const qc = useQueryClient()
const clinicId = computed(() => (auth.profile as { id?: string } | null)?.id)
const search = ref('')
const showCreate = ref(false)
const newP = reactive({ name: '', phone: '', birth_date: '', age: undefined as number | undefined })

const { data: patients, isLoading } = useQuery({
  queryKey: ['patients', clinicId],
  queryFn: () => apiFetch<Patient[]>(`/patients/clinic/${clinicId.value}`),
  enabled: computed(() => !!clinicId.value),
})

const filtered = computed(() =>
  (patients.value || []).filter(p =>
    !search.value || p.phone?.includes(search.value) || p.name?.toLowerCase().includes(search.value.toLowerCase())
  )
)

async function createPatient() {
  await apiFetch('/patients', {
    method: 'POST',
    body: JSON.stringify({ ...newP, clinic_id: clinicId.value }),
  })
  qc.invalidateQueries({ queryKey: ['patients'] })
  showCreate.value = false
  Object.assign(newP, { name: '', phone: '', birth_date: '', age: undefined })
}
</script>
