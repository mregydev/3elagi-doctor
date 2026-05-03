<template>
  <div>
    <label v-if="label" class="block text-xs font-semibold mb-1.5 text-[hsl(var(--muted-foreground))]">{{ label }}</label>
    <div class="flex items-center gap-3">
      <label
        class="flex items-center gap-2 px-3 py-2 text-xs font-semibold border border-[hsl(var(--border))] rounded-lg cursor-pointer hover:bg-[hsl(var(--muted))]"
      >
        <Upload :size="14" />
        {{ uploading ? $t('common.loading') : ($t('auth.chooseFile')) }}
        <input
          type="file"
          :accept="imageOnly ? 'image/*' : 'image/*,.pdf'"
          class="sr-only"
          @change="onPick"
        />
      </label>
      <a v-if="modelValue && !isImg(modelValue)" :href="modelValue" target="_blank" class="text-xs text-blue-600 underline">
        {{ $t('patients.documents.file') }}
      </a>
      <img v-if="modelValue && isImg(modelValue)" :src="modelValue" class="h-10 rounded border border-[hsl(var(--border))]" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Upload } from 'lucide-vue-next'
import { uploadFile } from '@/lib/api'

const props = defineProps<{ label?: string; modelValue: string; imageOnly?: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()
const uploading = ref(false)

function isImg(u: string) { return /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(u) }

async function onPick(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (!f) return
  uploading.value = true
  try {
    const r = await uploadFile(f)
    emit('update:modelValue', r.url)
  } finally { uploading.value = false; (e.target as HTMLInputElement).value = '' }
}
</script>
