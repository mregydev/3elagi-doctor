<template>
  <div>
    <label class="block text-xs font-medium mb-1.5">{{ label }}</label>
    <div
      class="relative border border-dashed rounded-lg px-4 py-3 flex items-center justify-between gap-3 transition-colors cursor-pointer"
      :class="url
        ? 'border-green-400 bg-green-50'
        : error
          ? 'border-red-400 bg-red-50'
          : 'border-[hsl(var(--border))] hover:border-[hsl(var(--primary))] hover:bg-blue-50/40'"
      @click="triggerInput"
    >
      <div class="flex items-center gap-2 min-w-0">
        <span v-if="uploading" class="text-[hsl(var(--primary))]">
          <Loader2 :size="16" class="animate-spin" />
        </span>
        <span v-else-if="url" class="text-green-600">
          <CheckCircle2 :size="16" />
        </span>
        <span v-else-if="error" class="text-red-500">
          <AlertCircle :size="16" />
        </span>
        <span v-else class="text-[hsl(var(--muted-foreground))]">
          <Upload :size="16" />
        </span>
        <div class="min-w-0">
          <div
            v-if="url"
            class="text-xs font-medium text-green-700 truncate"
          >{{ $t('auth.fileUploaded') }}</div>
          <div v-else-if="error" class="text-xs text-red-600">{{ error }}</div>
          <div v-else-if="uploading" class="text-xs text-[hsl(var(--primary))]">{{ $t('auth.uploading') }}</div>
          <div v-else class="text-xs text-[hsl(var(--muted-foreground))] truncate">{{ hint }}</div>
        </div>
      </div>
      <span
        class="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-md border transition-colors"
        :class="url
          ? 'border-green-300 text-green-700 bg-green-50'
          : 'border-[hsl(var(--border))] text-[hsl(var(--foreground))] bg-white hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]'"
      >
        {{ url ? $t('auth.fileUploaded') : $t('auth.chooseFile') }}
      </span>
    </div>
    <input
      ref="inputRef"
      type="file"
      :accept="accept"
      class="hidden"
      @change="onFileChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-vue-next'

const props = defineProps<{
  label: string
  hint?: string
  accept?: string
  url?: string
  uploading?: boolean
  error?: string
}>()

const emit = defineEmits<{
  (e: 'change', file: File | null): void
}>()

const inputRef = ref<HTMLInputElement | null>(null)

function triggerInput() {
  inputRef.value?.click()
}

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0] ?? null
  emit('change', file)
  if (target) target.value = ''
}
</script>
