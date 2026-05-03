<template>
  <div class="p-4 md:p-6 max-w-3xl mx-auto" :dir="locale === 'ar' ? 'rtl' : 'ltr'">
    <div class="mb-3">
      <h1 class="text-xl md:text-2xl font-bold">{{ $t('admin.defaultIntakeTitle') }}</h1>
      <p class="text-xs text-[hsl(var(--muted-foreground))] mt-1">{{ $t('admin.defaultIntakeSubtitle') }}</p>
    </div>
    <IntakeBuilder
      back-to="/admin"
      :title="$t('admin.defaultIntakeTitle')"
      :loading="loading"
      :saving="saving"
      :form="form"
      :form-error="formError"
      @save="save"
      @update:form-error="formError = $event"
    />
    <div v-if="savedAt" class="mt-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
      {{ $t('admin.savedAt', { time: savedAt }) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { apiFetch } from '@/lib/utils'
import IntakeBuilder, { type IntakeForm, type IntakeQuestion, type AnyOldQuestion } from '@/components/IntakeBuilder.vue'

const { locale } = useI18n()

const loading = ref(false)
const saving = ref(false)
const formError = ref('')
const savedAt = ref('')

const form = reactive<IntakeForm>({
  id: null,
  name: '',
  description: '',
  is_active: true,
  questions: [],
})

interface DefaultIntakeRow {
  id: string
  name: string
  description?: string | null
  is_active: boolean
  questions: AnyOldQuestion[]
}

function uid() {
  return 'q_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8)
}

function normalizeQuestion(q: AnyOldQuestion): IntakeQuestion {
  let type: IntakeQuestion['type'] = 'text'
  switch (q.type) {
    case 'text':
    case 'single_choice':
    case 'multi_choice':
    case 'guidance':
      type = q.type
      break
    case 'radio':
      type = 'single_choice'
      break
    case 'checkbox':
    case 'select':
      type = 'multi_choice'
      break
    default:
      type = 'text'
  }
  const text = (q.text ?? q.text_ar ?? q.text_en ?? '').toString()
  const options = (q.options || []).map((o) => ({
    id: o.id || uid(),
    text: (o.text ?? o.text_ar ?? o.text_en ?? '').toString(),
  }))
  return {
    id: q.id || uid(),
    text,
    type,
    required: type === 'guidance' ? false : !!q.required,
    options: type === 'single_choice' || type === 'multi_choice' ? options : [],
  }
}

async function save(payload: { name: string; description?: string; is_active: boolean; questions: IntakeQuestion[] }) {
  saving.value = true
  formError.value = ''
  try {
    await apiFetch('/admin/default-intake-test', {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
    savedAt.value = new Date().toLocaleTimeString()
  } catch (e) {
    formError.value = (e as Error).message
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  loading.value = true
  try {
    const t = await apiFetch<DefaultIntakeRow | null>('/admin/default-intake-test')
    if (t) {
      form.id = t.id
      form.name = t.name
      form.description = t.description || ''
      form.is_active = t.is_active
      form.questions = (t.questions || []).map(normalizeQuestion)
    }
  } finally {
    loading.value = false
  }
})
</script>
