<template>
  <Teleport to="body">
    <div
      class="fixed top-4 inset-x-0 z-[9999] flex flex-col items-center gap-2 pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      <TransitionGroup name="toast">
        <div
          v-for="t in toasts.items"
          :key="t.id"
          class="pointer-events-auto max-w-sm px-4 py-2.5 rounded-lg shadow-lg text-xs font-semibold flex items-center gap-2 border"
          :class="t.kind === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'"
          role="status"
        >
          <CheckCircle v-if="t.kind === 'success'" :size="14" class="flex-shrink-0" />
          <AlertCircle v-else :size="14" class="flex-shrink-0" />
          <span>{{ t.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { CheckCircle, AlertCircle } from 'lucide-vue-next'
import { useToasts } from '@/stores/toast'

const toasts = useToasts()
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: opacity 200ms ease, transform 200ms ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
