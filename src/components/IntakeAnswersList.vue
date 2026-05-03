<template>
  <div v-if="!normalized.length" class="text-xs text-[hsl(var(--muted-foreground))] italic">
    {{ $t('reservations.noIntake') }}
  </div>
  <div v-else class="space-y-3">
    <div v-for="q in normalized" :key="q.id" class="text-sm">
      <div class="font-semibold text-[hsl(var(--foreground))] mb-0.5">
        {{ q.text }}
        <span v-if="q.required" class="text-red-500">*</span>
      </div>
      <div v-if="q.type === 'guidance'" class="text-xs text-[hsl(var(--muted-foreground))] italic">
        ({{ $t('intakeTests.typeGuidance') }})
      </div>
      <div v-else-if="(answers?.[q.id] ?? []).length === 0" class="text-xs text-[hsl(var(--muted-foreground))] italic">
        —
      </div>
      <div v-else class="flex flex-wrap gap-1.5">
        <span
          v-for="(v, i) in displayValues(q, answers?.[q.id] ?? [])"
          :key="i"
          class="text-xs px-2 py-1 bg-blue-50 text-[hsl(var(--primary))] rounded-md"
        >{{ v }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface OldOption { id: string; text?: string; text_ar?: string; text_en?: string }
interface AnyQuestion {
  id: string
  text?: string
  text_ar?: string
  text_en?: string
  type: string
  required?: boolean
  options?: OldOption[]
}

const props = defineProps<{
  questions: AnyQuestion[] | null | undefined
  answers: Record<string, string[]> | null | undefined
}>()

function normType(t: string): 'text' | 'single_choice' | 'multi_choice' | 'guidance' {
  if (t === 'single_choice' || t === 'radio' || t === 'select') return 'single_choice'
  if (t === 'multi_choice' || t === 'checkbox') return 'multi_choice'
  if (t === 'guidance') return 'guidance'
  return 'text'
}

function questionText(q: AnyQuestion): string {
  return q.text || q.text_ar || q.text_en || ''
}

function optionText(o: OldOption): string {
  return o.text || o.text_ar || o.text_en || ''
}

const normalized = computed(() =>
  (props.questions ?? []).map(q => ({
    id: q.id,
    text: questionText(q),
    type: normType(q.type),
    required: !!q.required,
    options: q.options ?? [],
  })),
)

function displayValues(q: { id: string; type: string; options: OldOption[] }, vals: string[]): string[] {
  if (q.type === 'text') return vals
  return vals.map(v => {
    const o = q.options.find(o => o.id === v)
    return o ? optionText(o) : v
  })
}
</script>
