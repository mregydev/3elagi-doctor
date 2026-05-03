<template>
  <div class="p-4 md:p-6 space-y-5 md:space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-xl md:text-2xl font-bold">{{ $t('doctors.title') }}</h1>
    </div>

    <div v-if="isLoading" class="flex justify-center py-12">
      <Loader2 class="animate-spin text-[hsl(var(--primary))]" :size="32" />
    </div>

    <div v-else-if="!doctors?.length" class="text-center py-12 text-[hsl(var(--muted-foreground))]">
      {{ $t('doctors.noDoctor') }}
    </div>

    <div v-else class="grid gap-3">
      <div
        v-for="doc in doctors"
        :key="doc.id"
        class="bg-white border border-[hsl(var(--border))] rounded-xl p-4 flex items-center justify-between gap-3"
      >
        <div class="flex items-center gap-3 min-w-0">
          <div v-if="doc.photo_url" class="w-11 h-11 rounded-full overflow-hidden bg-blue-100 flex-shrink-0">
            <img :src="doc.photo_url" :alt="doc.name" class="w-full h-full object-cover" />
          </div>
          <div v-else class="w-11 h-11 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg flex-shrink-0">
            {{ doc.name?.charAt(0) || 'D' }}
          </div>
          <div class="min-w-0">
            <div class="font-semibold text-sm truncate">{{ doc.name }}</div>
            <div class="text-xs text-[hsl(var(--muted-foreground))] truncate">{{ doc.email }}</div>
            <div v-if="doc.phone" class="text-xs text-[hsl(var(--muted-foreground))]">{{ doc.phone }}</div>
          </div>
        </div>
        <button
          @click="confirmRemove(doc.id, doc.name)"
          class="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
        >
          {{ $t('doctors.remove') }}
        </button>
      </div>
    </div>

    <!-- Confirmation dialog -->
    <Teleport to="body">
      <div
        v-if="pendingRemove"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        @click.self="pendingRemove = null"
      >
        <div class="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle class="text-red-600" :size="20" />
            </div>
            <div>
              <div class="font-semibold text-sm">{{ $t('doctors.removeDoctor') }}</div>
              <div class="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{{ pendingRemove.name }}</div>
            </div>
          </div>
          <p class="text-sm text-[hsl(var(--foreground))]">{{ $t('doctors.removeConfirm') }}</p>
          <div class="flex gap-3 justify-end">
            <button
              @click="pendingRemove = null"
              class="px-4 py-2 text-sm border border-[hsl(var(--border))] rounded-lg hover:bg-[hsl(var(--muted))] transition-colors"
            >
              {{ $t('doctors.cancel') }}
            </button>
            <button
              @click="doRemove"
              :disabled="removing"
              class="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {{ removing ? $t('common.loading') : $t('doctors.remove') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { Loader2, AlertTriangle } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { apiFetch } from '@/lib/utils'
import type { Doctor } from '@/domains/doctor/types'

const auth = useAuthStore()
const qc = useQueryClient()
const clinicId = computed(() => (auth.profile as { id?: string } | null)?.id)

const pendingRemove = ref<{ id: string; name: string } | null>(null)
const removing = ref(false)

const { data: doctors, isLoading } = useQuery({
  queryKey: ['doctors', clinicId],
  queryFn: () => apiFetch<Doctor[]>(`/doctors/clinic/${clinicId.value}`),
  enabled: computed(() => !!clinicId.value),
})

function confirmRemove(id: string, name: string) {
  pendingRemove.value = { id, name }
}

async function doRemove() {
  if (!pendingRemove.value) return
  removing.value = true
  try {
    await apiFetch(`/doctors/clinic/${clinicId.value}/${pendingRemove.value.id}`, { method: 'DELETE' })
    qc.invalidateQueries({ queryKey: ['doctors'] })
    qc.invalidateQueries({ queryKey: ['clinic-dashboard'] })
    pendingRemove.value = null
  } finally {
    removing.value = false
  }
}
</script>
