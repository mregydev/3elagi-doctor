<template>
  <div class="p-4 md:p-6 space-y-5 md:space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-xl md:text-2xl font-bold">{{ $t('joinRequests.title') }}</h1>
    </div>

    <!-- Filter tabs -->
    <div class="flex gap-2 flex-wrap">
      <button
        v-for="s in statuses"
        :key="s"
        @click="filter = s"
        class="px-4 py-2 text-xs font-semibold rounded-lg transition-colors"
        :class="filter === s
          ? 'bg-[hsl(var(--primary))] text-white'
          : 'bg-white border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]'"
      >
        {{ $t(`joinRequests.${s}`) }}
      </button>
    </div>

    <div v-if="isLoading" class="flex justify-center py-12">
      <Loader2 class="animate-spin text-[hsl(var(--primary))]" :size="32" />
    </div>

    <div v-else-if="!filteredRequests.length" class="text-center py-12 text-[hsl(var(--muted-foreground))]">
      {{ $t('joinRequests.noRequests') }}
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="req in filteredRequests"
        :key="req.id"
        class="bg-white border border-[hsl(var(--border))] rounded-xl p-4 space-y-4"
      >
        <!-- Doctor header row -->
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <div v-if="req.doctor?.photo_url" class="w-11 h-11 rounded-full overflow-hidden bg-blue-100 flex-shrink-0">
              <img :src="req.doctor.photo_url" :alt="req.doctor.name" class="w-full h-full object-cover" />
            </div>
            <div v-else class="w-11 h-11 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold flex-shrink-0">
              {{ req.doctor?.name?.charAt(0) || 'D' }}
            </div>
            <div class="min-w-0">
              <div class="font-semibold text-sm truncate">{{ req.doctor?.name }}</div>
              <div class="text-xs text-[hsl(var(--muted-foreground))] truncate">{{ req.doctor?.email }}</div>
              <div v-if="req.doctor?.phone" class="text-xs text-[hsl(var(--muted-foreground))]">{{ req.doctor.phone }}</div>
            </div>
          </div>

          <span
            :class="{
              'bg-yellow-100 text-yellow-700': req.status === 'pending',
              'bg-green-100 text-green-700': req.status === 'approved',
              'bg-red-100 text-red-700': req.status === 'rejected',
            }"
            class="px-2.5 py-1 text-xs font-semibold rounded-full flex-shrink-0"
          >
            {{ $t(`joinRequests.${req.status}`) }}
          </span>
        </div>

        <!-- Credentials section -->
        <div class="border-t border-[hsl(var(--border))] pt-3">
          <p class="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-2">
            {{ $t('joinRequests.credentials') }}
          </p>
          <div v-if="hasCredentials(req)" class="flex flex-wrap gap-2">
            <a
              v-if="req.doctor?.photo_url"
              :href="req.doctor.photo_url"
              target="_blank"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <ImageIcon :size="12" />
              {{ $t('joinRequests.photo') }}
            </a>
            <a
              v-if="req.doctor?.graduation_cert_url"
              :href="req.doctor.graduation_cert_url"
              target="_blank"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <FileText :size="12" />
              {{ $t('joinRequests.graduationCert') }}
            </a>
            <a
              v-if="req.doctor?.work_permit_url"
              :href="req.doctor.work_permit_url"
              target="_blank"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
            >
              <FileText :size="12" />
              {{ $t('joinRequests.workPermit') }}
            </a>
          </div>
          <p v-else class="text-xs text-[hsl(var(--muted-foreground))] italic">
            {{ $t('joinRequests.noCredentials') }}
          </p>
        </div>

        <!-- Action buttons (pending only) -->
        <template v-if="req.status === 'pending'">
          <div class="flex gap-2 justify-end border-t border-[hsl(var(--border))] pt-3">
            <button
              @click="handleAction({ id: req.id, action: 'reject' })"
              :disabled="isPending"
              class="flex-1 sm:flex-none px-4 py-2 text-xs font-medium border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              {{ $t('joinRequests.reject') }}
            </button>
            <button
              @click="handleAction({ id: req.id, action: 'approve' })"
              :disabled="isPending"
              class="flex-1 sm:flex-none px-4 py-2 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {{ isPending ? $t('common.loading') : $t('joinRequests.approve') }}
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { Loader2, FileText, ImageIcon } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { apiFetch } from '@/lib/utils'
import type { JoinRequest } from '@/domains/clinic/types'

const auth = useAuthStore()
const qc = useQueryClient()
const clinicId = computed(() => (auth.profile as { id?: string } | null)?.id)
const filter = ref('pending')
const statuses = ['pending', 'approved', 'rejected']

const queryKey = computed(() => ['join-requests', clinicId.value])

const { data: requests, isLoading } = useQuery({
  queryKey,
  queryFn: () => apiFetch<JoinRequest[]>(`/join-requests/clinic/${clinicId.value}`),
  enabled: computed(() => !!clinicId.value),
})

const filteredRequests = computed(() =>
  (requests.value ?? []).filter(r => r.status === filter.value)
)

function hasCredentials(req: JoinRequest): boolean {
  return !!(req.doctor?.photo_url || req.doctor?.graduation_cert_url || req.doctor?.work_permit_url)
}

const { mutate: handleAction, isPending } = useMutation({
  mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) =>
    apiFetch(`/join-requests/${id}/${action}`, { method: 'PATCH' }),

  onMutate: async ({ id, action }) => {
    await qc.cancelQueries({ queryKey: queryKey.value })
    const previous = qc.getQueryData<JoinRequest[]>(queryKey.value)

    qc.setQueryData<JoinRequest[]>(queryKey.value, old =>
      (old ?? []).map(r =>
        r.id === id
          ? { ...r, status: action === 'approve' ? 'approved' : 'rejected' }
          : r
      )
    )

    return { previous }
  },

  onError: (_err, _vars, ctx) => {
    if (ctx?.previous) {
      qc.setQueryData(queryKey.value, ctx.previous)
    }
  },

  onSettled: () => {
    qc.invalidateQueries({ queryKey: queryKey.value })
    qc.invalidateQueries({ queryKey: ['clinic-dashboard'] })
    qc.invalidateQueries({ queryKey: ['doctors'] })
  },
})
</script>
