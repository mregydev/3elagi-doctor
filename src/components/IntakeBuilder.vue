<template>
  <div :dir="locale === 'ar' ? 'rtl' : 'ltr'">
    <!-- Header -->
    <div class="flex items-center justify-between mb-5 gap-3 flex-wrap">
      <div class="flex items-center gap-2">
        <RouterLink
          :to="backTo"
          class="p-2 rounded-lg hover:bg-[hsl(var(--muted))] text-slate-500"
        >
          <ChevronLeft :size="18" class="rtl:rotate-180" />
        </RouterLink>
        <div>
          <h1 class="text-xl md:text-2xl font-bold">{{ title }}</h1>
          <p class="text-xs md:text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
            {{ $t('intakeTests.builderHint') }}
          </p>
        </div>
      </div>
      <div class="flex gap-2">
        <RouterLink
          :to="backTo"
          class="px-3.5 py-2 text-sm font-semibold border border-[hsl(var(--border))] rounded-lg hover:bg-[hsl(var(--muted))] bg-white"
        >
          {{ $t('common.cancel') }}
        </RouterLink>
        <button
          @click="trySave"
          :disabled="saving || !form.name.trim()"
          class="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold bg-[hsl(var(--primary))] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          <Save :size="16" /> {{ saving ? $t('common.loading') : $t('intakeTests.save') }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-sm text-[hsl(var(--muted-foreground))]">{{ $t('common.loading') }}</div>

    <div v-else class="space-y-5">
      <!-- Basics card -->
      <div class="bg-white border border-[hsl(var(--border))] rounded-xl p-5 space-y-4">
        <div>
          <label class="block text-xs font-semibold mb-1.5">
            {{ $t('intakeTests.nameLabel') }} <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.name"
            type="text"
            :placeholder="$t('intakeTests.namePh')"
            class="w-full px-3 py-2.5 text-sm border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
          />
        </div>
        <div>
          <label class="block text-xs font-semibold mb-1.5">{{ $t('intakeTests.descriptionLabel') }}</label>
          <textarea
            v-model="form.description"
            rows="2"
            :placeholder="$t('intakeTests.descriptionPh')"
            class="w-full px-3 py-2 text-sm border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
          />
        </div>
        <label class="flex items-center gap-2 text-sm">
          <input v-model="form.is_active" type="checkbox" class="w-4 h-4 accent-[hsl(var(--primary))]" />
          <span>{{ $t('intakeTests.activeLabel') }}</span>
        </label>
      </div>

      <!-- Questions -->
      <div class="bg-white border border-[hsl(var(--border))] rounded-xl p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-semibold">{{ $t('intakeTests.questions') }}</h2>
          <button
            type="button"
            @click="addQuestion"
            class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[hsl(var(--primary))] bg-blue-50 rounded-md hover:bg-blue-100"
          >
            <Plus :size="13" /> {{ $t('intakeTests.addQuestion') }}
          </button>
        </div>

        <div v-if="!form.questions.length">
          <button
            type="button"
            @click="addQuestion"
            class="w-full py-8 text-sm font-semibold text-[hsl(var(--primary))] border-2 border-dashed border-[hsl(var(--primary))] rounded-xl hover:bg-blue-50"
          >
            + {{ $t('intakeTests.addFirstQuestion') }}
          </button>
        </div>

        <div v-else class="space-y-5">
          <div
            v-for="(q, qIdx) in form.questions"
            :key="q.id"
            class="border border-[hsl(var(--border))] rounded-xl p-5 bg-slate-50/40 space-y-4"
          >
            <div class="flex items-center justify-between gap-3">
              <span class="text-xs font-bold text-[hsl(var(--primary))] bg-blue-50 rounded-md px-2 py-0.5">#{{ qIdx + 1 }}</span>
              <button type="button" @click="removeQuestion(qIdx)" class="text-red-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50">
                <Trash2 :size="15" />
              </button>
            </div>

            <!-- Question text -->
            <div>
              <label class="block text-xs font-semibold mb-1.5">
                {{ q.type === 'guidance' ? $t('intakeTests.guidanceLabel') : $t('intakeTests.questionLabel') }}
              </label>
              <textarea
                v-model="q.text"
                :rows="q.type === 'guidance' ? 3 : 2"
                :placeholder="q.type === 'guidance' ? $t('intakeTests.guidancePh') : $t('intakeTests.questionPh')"
                class="w-full px-3 py-2.5 text-sm border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] bg-white"
              />
            </div>

            <!-- Type + required -->
            <div class="flex flex-wrap items-center gap-3">
              <div>
                <label class="block text-[11px] font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))] mb-1.5">
                  {{ $t('intakeTests.type') }}
                </label>
                <select
                  v-model="q.type"
                  @change="onTypeChange(q)"
                  class="px-3 py-2 text-sm border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] bg-white min-w-[200px]"
                >
                  <option value="text">{{ $t('intakeTests.typeText') }}</option>
                  <option value="single_choice">{{ $t('intakeTests.typeSingleChoice') }}</option>
                  <option value="multi_choice">{{ $t('intakeTests.typeMultiChoice') }}</option>
                  <option value="guidance">{{ $t('intakeTests.typeGuidance') }}</option>
                </select>
              </div>
              <label v-if="q.type !== 'guidance'" class="inline-flex items-center gap-1.5 text-xs mt-5">
                <input v-model="q.required" type="checkbox" class="w-4 h-4 accent-[hsl(var(--primary))]" />
                {{ $t('intakeTests.required') }}
              </label>
            </div>

            <!-- Options -->
            <div v-if="isChoice(q.type)" class="pt-2 border-t border-[hsl(var(--border))] space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
                  {{ $t('intakeTests.options') }}
                </span>
                <button
                  type="button"
                  @click="addOption(q)"
                  class="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[hsl(var(--primary))] bg-blue-50 rounded-md hover:bg-blue-100"
                >
                  <Plus :size="11" /> {{ $t('intakeTests.addOption') }}
                </button>
              </div>
              <div class="space-y-2.5">
                <div v-for="(opt, optIdx) in q.options" :key="opt.id" class="flex items-center gap-2.5">
                  <component :is="q.type === 'multi_choice' ? CheckSquare : CircleDot" :size="16" class="text-slate-400 flex-shrink-0" />
                  <input
                    v-model="opt.text"
                    type="text"
                    :placeholder="$t('intakeTests.optionPh')"
                    class="flex-1 min-w-0 px-3 py-2 text-sm border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] bg-white"
                  />
                  <button type="button" @click="removeOption(q, optIdx)" class="text-red-300 hover:text-red-600 flex-shrink-0 p-1.5 rounded-md hover:bg-red-50">
                    <X :size="15" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Preview -->
            <div v-else class="pt-2 border-t border-[hsl(var(--border))]">
              <span class="text-[11px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
                {{ $t('intakeTests.preview') }}
              </span>
              <div class="mt-2">
                <textarea v-if="q.type === 'text'" rows="2" disabled :placeholder="$t('intakeTests.previewText')" class="w-full px-3 py-2 text-sm border border-[hsl(var(--border))] rounded-lg bg-slate-100" />
                <div v-else-if="q.type === 'guidance'" class="px-3 py-2.5 text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg whitespace-pre-line">
                  <Info :size="13" class="inline-block me-1" />
                  {{ q.text || $t('intakeTests.guidancePreviewEmpty') }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="formError" class="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
        {{ formError }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export type IntakeQuestionType = 'text' | 'single_choice' | 'multi_choice' | 'guidance'
export interface IntakeOption { id: string; text: string }
export interface IntakeQuestion {
  id: string
  text: string
  type: IntakeQuestionType
  required: boolean
  options: IntakeOption[]
}
export interface IntakeForm {
  id: string | null
  name: string
  description: string
  is_active: boolean
  questions: IntakeQuestion[]
}
export interface AnyOldQuestion {
  id?: string
  text?: string
  text_ar?: string
  text_en?: string
  type?: string
  required?: boolean
  options?: { id?: string; text?: string; text_ar?: string; text_en?: string }[]
}
</script>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import { ChevronLeft, Plus, Trash2, X, Save, CircleDot, CheckSquare, Info } from 'lucide-vue-next'

const props = defineProps<{
  backTo: string
  title: string
  loading: boolean
  saving: boolean
  form: IntakeForm
  formError: string
}>()
const emit = defineEmits<{
  save: [payload: { name: string; description?: string; is_active: boolean; questions: IntakeQuestion[] }]
  'update:formError': [msg: string]
}>()

const { locale, t } = useI18n()

function uid() {
  return 'q_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8)
}
function isChoice(t: IntakeQuestionType) {
  return t === 'single_choice' || t === 'multi_choice'
}

function addQuestion() {
  props.form.questions.push({
    id: uid(),
    text: '',
    type: 'text',
    required: false,
    options: [],
  })
}
function removeQuestion(idx: number) {
  props.form.questions.splice(idx, 1)
}
function onTypeChange(q: IntakeQuestion) {
  if (isChoice(q.type)) {
    while (q.options.length < 2) {
      q.options.push({ id: uid(), text: '' })
    }
  } else {
    q.options = []
  }
  if (q.type === 'guidance') {
    q.required = false
  }
}
function addOption(q: IntakeQuestion) {
  q.options.push({ id: uid(), text: '' })
}
function removeOption(q: IntakeQuestion, idx: number) {
  q.options.splice(idx, 1)
}

function validate(): string {
  const valid = props.form.questions.filter((q) => q.text.trim())
  if (!valid.length) return t('intakeTests.needAtLeastOneQuestion')
  for (const q of valid) {
    if (isChoice(q.type)) {
      const validOpts = q.options.filter((o) => o.text.trim())
      if (validOpts.length < 2) return t('intakeTests.needAtLeastTwoOptions')
    }
  }
  return ''
}

function trySave() {
  if (!props.form.name.trim()) return
  const err = validate()
  if (err) {
    emit('update:formError', err)
    return
  }
  emit('update:formError', '')
  const payload = {
    name: props.form.name.trim(),
    description: props.form.description.trim() || undefined,
    is_active: props.form.is_active,
    questions: props.form.questions
      .filter((q) => q.text.trim())
      .map((q) => ({
        id: q.id,
        text: q.text.trim(),
        type: q.type,
        required: q.type === 'guidance' ? false : !!q.required,
        options: isChoice(q.type)
          ? q.options
              .filter((o) => o.text.trim())
              .map((o) => ({ id: o.id, text: o.text.trim() }))
          : [],
      })),
  }
  emit('save', payload)
}
</script>
