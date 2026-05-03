<template>
  <div class="flex flex-col h-screen overflow-hidden bg-[hsl(var(--gray-0))]" :dir="locale === 'ar' ? 'rtl' : 'ltr'">
    <!-- Top bar -->
    <div class="h-14 bg-white border-b border-[hsl(var(--border))] flex items-center justify-between px-4 flex-shrink-0">
      <button
        @click="$router.back()"
        class="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
      >
        <ArrowRight v-if="locale === 'ar'" :size="16" />
        <ArrowLeft v-else :size="16" />
        {{ $t('common.cancel') }}
      </button>
      <div class="text-sm font-bold text-[hsl(var(--primary))] flex items-center gap-2">
        <Pill :size="16" />
        {{ $t('prescription.newTitle') }}
        <span v-if="patient" class="text-[hsl(var(--muted-foreground))] font-normal">— {{ patient.name }}</span>
      </div>
      <div class="flex items-center gap-2">
        <button
          @click="saveOnly"
          :disabled="saving || !canSave"
          class="px-4 py-2 text-xs font-semibold text-[hsl(var(--primary))] border border-[hsl(var(--primary))] rounded-lg hover:bg-blue-50 disabled:opacity-50"
        >
          {{ saving ? $t('common.loading') : $t('common.save') }}
        </button>
        <button
          @click="saveAndWhatsapp"
          :disabled="saving || !canSave"
          class="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#25D366] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          <Send :size="13" />
          {{ $t('prescription.sendWhatsapp') }}
        </button>
      </div>
    </div>

    <!-- Save-as-template modal -->
    <div
      v-if="showSaveTemplateModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      @click.self="showSaveTemplateModal = false"
    >
      <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-5">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2 text-[hsl(var(--primary))] font-semibold">
            <Bookmark :size="16" />
            {{ $t('prescription.saveAsTemplateTitle') }}
          </div>
          <button @click="showSaveTemplateModal = false" class="text-[hsl(var(--muted-foreground))]">
            <XIcon :size="18" />
          </button>
        </div>
        <label class="block text-xs font-semibold mb-1.5">{{ $t('templates.nameLabel') }}</label>
        <input
          v-model="newTemplateName"
          type="text"
          :placeholder="$t('templates.namePh')"
          class="w-full px-3 py-2.5 text-sm border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
          @keydown.enter="confirmSaveTemplate"
        />
        <div class="flex justify-end gap-2 mt-4">
          <button
            type="button"
            @click="showSaveTemplateModal = false"
            class="px-3 py-1.5 text-xs font-semibold border border-[hsl(var(--border))] rounded-md"
          >
            {{ $t('common.cancel') }}
          </button>
          <button
            type="button"
            :disabled="!newTemplateName.trim() || savingTemplate"
            @click="confirmSaveTemplate"
            class="px-3 py-1.5 text-xs font-semibold text-white bg-[hsl(var(--primary))] rounded-md disabled:opacity-50"
          >
            {{ savingTemplate ? $t('common.loading') : $t('templates.save') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Saved toast -->
    <div
      v-if="templateSavedMsg"
      class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[hsl(var(--primary))] text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
    >
      <Bookmark :size="14" />
      {{ $t('prescription.templateSaved') }}
    </div>

    <!-- Split body -->
    <div class="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
      <!-- Left: Form -->
      <div class="overflow-y-auto p-6 border-e border-[hsl(var(--border))] space-y-5">
        <!-- Template picker -->
        <div v-if="templates.length" class="bg-blue-50/60 border border-blue-100 rounded-xl p-3">
          <label class="block text-xs font-semibold mb-1.5 text-[hsl(var(--primary))]">{{ $t('prescription.useTemplate') }}</label>
          <select
            v-model="selectedTemplateId"
            @change="applyTemplate"
            class="w-full px-3 py-2 text-sm bg-white border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
          >
            <option value="">{{ $t('prescription.pickTemplate') }}</option>
            <option v-for="tpl in templates" :key="tpl.id" :value="tpl.id">{{ tpl.name }}</option>
          </select>
        </div>

        <!-- Title with auto-fill -->
        <div>
          <label class="block text-xs font-semibold mb-1.5">
            {{ $t('prescription.title') }} <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <input
              v-model="form.title"
              @input="onTitleInput"
              @focus="onTitleFocus"
              @blur="onTitleBlur"
              type="text"
              autocomplete="off"
              :placeholder="$t('prescription.titlePh')"
              class="w-full px-3 py-2.5 text-sm border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
            />
            <ul
              v-if="showSuggestions && suggestions.length"
              class="absolute z-10 mt-1 w-full bg-white border border-[hsl(var(--border))] rounded-lg shadow-lg max-h-60 overflow-y-auto"
            >
              <li
                v-for="s in suggestions"
                :key="s"
                @mousedown.prevent="pickSuggestion(s)"
                class="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 flex items-center gap-2"
              >
                <Sparkles :size="12" class="text-[hsl(var(--primary))]" />
                {{ s }}
              </li>
            </ul>
          </div>
          <div v-if="templateLoaded" class="mt-1.5 text-xs text-[hsl(var(--primary))] flex items-center gap-1">
            <Sparkles :size="12" />
            {{ $t('prescription.autofilledHint') }}
          </div>
        </div>

        <!-- Symptoms (optional) -->
        <div>
          <label class="block text-xs font-semibold mb-1.5">
            {{ $t('prescription.symptoms') }}
            <span class="text-[hsl(var(--muted-foreground))] font-normal">({{ $t('prescription.optional') }})</span>
          </label>
          <textarea
            v-model="form.symptoms"
            rows="2"
            :placeholder="$t('prescription.symptomsPh')"
            class="w-full px-3 py-2 text-sm border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
          />
        </div>

        <!-- Medications -->
        <div>
          <div class="flex items-center justify-between mb-2 gap-2 flex-wrap">
            <label class="text-xs font-semibold">{{ $t('prescription.medications') }}</label>
            <div class="flex items-center gap-2">
              <button
                type="button"
                v-if="form.items.some((i) => i.name?.trim())"
                @click="openSaveTemplateModal"
                class="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[hsl(var(--primary))] border border-[hsl(var(--primary))] rounded-md hover:bg-blue-50"
              >
                <Bookmark :size="12" /> {{ $t('prescription.saveAsTemplate') }}
              </button>
              <button
                type="button"
                @click="addItem"
                class="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[hsl(var(--primary))] bg-blue-50 rounded-md hover:bg-blue-100"
              >
                <Plus :size="12" /> {{ $t('prescription.addMedication') }}
              </button>
            </div>
          </div>

          <div class="space-y-3">
            <div
              v-for="(item, idx) in form.items"
              :key="idx"
              class="border border-[hsl(var(--border))] rounded-xl p-3 bg-white"
            >
              <div class="flex items-start justify-between gap-2 mb-2">
                <div class="flex items-center gap-2 text-xs font-bold text-[hsl(var(--primary))]">
                  <span class="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center">{{ idx + 1 }}</span>
                  {{ $t('prescription.medication') }}
                </div>
                <button
                  type="button"
                  @click="removeItem(idx)"
                  class="text-red-400 hover:text-red-600"
                >
                  <Trash2 :size="14" />
                </button>
              </div>

              <input
                v-model="item.name"
                type="text"
                :placeholder="$t('prescription.medName')"
                class="w-full px-2.5 py-2 text-sm font-medium border border-[hsl(var(--border))] rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
              />

              <div class="grid grid-cols-3 gap-2">
                <input
                  v-model="item.dose"
                  type="text"
                  :placeholder="$t('prescription.dose')"
                  class="px-2.5 py-1.5 text-xs border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                />
                <input
                  v-model="item.frequency"
                  type="text"
                  :placeholder="$t('prescription.frequency')"
                  class="px-2.5 py-1.5 text-xs border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                />
                <input
                  v-model="item.duration"
                  type="text"
                  :placeholder="$t('prescription.duration')"
                  class="px-2.5 py-1.5 text-xs border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                />
              </div>
              <input
                v-model="item.notes"
                type="text"
                :placeholder="$t('prescription.medNotes')"
                class="w-full mt-2 px-2.5 py-1.5 text-xs border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
              />
            </div>

            <button
              v-if="!form.items.length"
              type="button"
              @click="addItem"
              class="w-full py-6 text-sm text-[hsl(var(--primary))] border-2 border-dashed border-[hsl(var(--primary))] rounded-xl hover:bg-blue-50"
            >
              + {{ $t('prescription.addFirstMedication') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Right: live preview -->
      <div class="overflow-y-auto bg-[hsl(var(--muted))] p-6">
        <div
          :dir="locale === 'ar' ? 'rtl' : 'ltr'"
          class="mx-auto bg-white shadow-2xl"
          style="max-width: 595px; aspect-ratio: 595/842; padding: 40px; border-radius: 6px"
        >
          <!-- Header band -->
          <div class="-mx-10 -mt-10 mb-5 px-10 py-5" style="background: hsl(var(--primary)); color: white">
            <div class="flex items-center justify-between gap-3">
              <div class="min-w-0">
                <div class="text-2xl font-bold truncate">{{ drPrefix }} {{ doctorName }}</div>
                <div class="text-xs opacity-90">{{ $t('prescription.digitalRx') }}</div>
              </div>
              <div class="text-xs flex items-center gap-2" :class="locale === 'ar' ? 'text-left' : 'text-right'">
                <div v-if="clinicLogoUrl" class="w-12 h-12 rounded-full bg-white p-0.5 flex-shrink-0 overflow-hidden">
                  <img :src="clinicLogoUrl" alt="logo" class="w-full h-full object-contain" />
                </div>
                <div>
                  <div class="font-semibold">{{ clinicName }}</div>
                  <div class="opacity-90">{{ clinicLocation }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Doctor + Patient -->
          <div class="flex items-start justify-between mb-4 text-xs gap-4">
            <div>
              <div class="font-bold text-base">{{ drPrefix }} {{ doctorName }}</div>
              <div class="text-[hsl(var(--muted-foreground))]">{{ profile?.phone || '' }}</div>
            </div>
            <div :class="locale === 'ar' ? 'text-left' : 'text-right'">
              <div>{{ $t('prescription.patientLabel') }}: <span class="font-semibold">{{ patient?.name || '—' }}</span></div>
              <div class="text-[hsl(var(--muted-foreground))]">{{ patient?.phone || '' }}</div>
              <div v-if="patient?.age" class="text-[hsl(var(--muted-foreground))]">{{ $t('prescription.ageLabel') }}: {{ patient.age }}</div>
            </div>
          </div>

          <hr class="border-[hsl(var(--border))] mb-4" />

          <!-- Title -->
          <div class="text-lg font-bold text-[hsl(var(--primary))] mb-1">
            {{ form.title || $t('prescription.titlePh') }}
          </div>
          <div class="text-xs text-[hsl(var(--muted-foreground))] mb-4">
            {{ todayStr }}
          </div>

          <!-- Symptoms -->
          <div v-if="form.symptoms" class="mb-4">
            <div class="text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-1">{{ $t('prescription.symptoms') }}</div>
            <div class="text-sm whitespace-pre-wrap">{{ form.symptoms }}</div>
          </div>

          <!-- Medications header -->
          <div class="text-lg font-bold text-[hsl(var(--primary))] mb-2">{{ $t('prescription.medications') }}</div>

          <div v-if="!form.items.length" class="text-xs text-[hsl(var(--muted-foreground))] italic">
            {{ $t('prescription.noMedsYet') }}
          </div>
          <div v-else class="space-y-3">
            <div v-for="(it, i) in form.items" :key="i" class="text-sm">
              <div class="font-semibold text-[hsl(var(--primary))]">{{ i + 1 }}. {{ it.name || '...' }}</div>
              <div v-if="it.dose || it.frequency || it.duration" class="text-xs text-[hsl(var(--muted-foreground))] ms-4 mt-0.5">
                <span v-if="it.dose">{{ $t('prescription.dose') }}: {{ it.dose }}</span>
                <span v-if="it.dose && (it.frequency || it.duration)"> • </span>
                <span v-if="it.frequency">{{ $t('prescription.frequency') }}: {{ it.frequency }}</span>
                <span v-if="it.frequency && it.duration"> • </span>
                <span v-if="it.duration">{{ $t('prescription.duration') }}: {{ it.duration }}</span>
              </div>
              <div v-if="it.notes" class="text-xs text-[hsl(var(--muted-foreground))] ms-4 italic mt-0.5">{{ it.notes }}</div>
            </div>
          </div>

          <!-- Signature -->
          <div class="mt-12 pt-3 border-t border-[hsl(var(--border))]">
            <div class="flex items-end justify-end">
              <div class="text-right">
                <img v-if="profile?.digital_signature_url" :src="profile.digital_signature_url" class="h-12 ml-auto mb-1" />
                <div class="text-xs text-[hsl(var(--muted-foreground))]">{{ $t('prescription.signature') }}</div>
                <div class="text-sm font-semibold">{{ drPrefix }} {{ doctorName }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { ArrowLeft, ArrowRight, Pill, Plus, Trash2, Send, Sparkles, Bookmark, X as XIcon } from 'lucide-vue-next'
import { apiFetch } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth'
import type { Patient } from '@/domains/patient/types'
import type { Prescription, PrescriptionItem, PrescriptionTemplate } from '@/domains/prescription/types'

const { locale, t } = useI18n()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const patientId = computed(() => route.params.id as string)

const profile = computed(() => auth.profile as { id: string; name: string; phone?: string; digital_signature_url?: string; personal_clinic_location?: string; default_clinic_id?: string } | null)
const doctorName = computed(() => profile.value?.name || '')
const drPrefix = computed(() => (locale.value === 'ar' ? 'د.' : 'Dr.'))

const { data: patient } = useQuery({
  queryKey: computed(() => ['patient', patientId.value]),
  queryFn: () => apiFetch<Patient>(`/patients/${patientId.value}`),
})

const { data: defaultClinic } = useQuery({
  queryKey: computed(() => ['clinic', profile.value?.default_clinic_id]),
  queryFn: () => apiFetch<{ name: string; location?: string; logo_url?: string }>(`/clinics/${profile.value?.default_clinic_id}`),
  enabled: computed(() => !!profile.value?.default_clinic_id),
})

const clinicName = computed(() => defaultClinic.value?.name || '')
const clinicLocation = computed(() => defaultClinic.value?.location || profile.value?.personal_clinic_location || '')
const clinicLogoUrl = computed(() => defaultClinic.value?.logo_url || '')

const form = reactive<{ title: string; symptoms: string; items: PrescriptionItem[] }>({
  title: '',
  symptoms: '',
  items: [],
})

const templateLoaded = ref(false)
const saving = ref(false)

interface SavedTemplate {
  id: string; name: string; title?: string | null; symptoms?: string | null; items: PrescriptionItem[]
}
const templatesData = ref<SavedTemplate[]>([])
const templates = computed(() => templatesData.value)
const selectedTemplateId = ref('')
;(async () => {
  try {
    templatesData.value = await apiFetch<SavedTemplate[]>('/prescription-templates')
  } catch {
    templatesData.value = []
  }
})()
function applyTemplate() {
  const tpl = templatesData.value.find((t) => t.id === selectedTemplateId.value)
  if (!tpl) return
  if (tpl.title && !form.title.trim()) form.title = tpl.title
  if (tpl.symptoms && !form.symptoms.trim()) form.symptoms = tpl.symptoms
  form.items = (tpl.items || []).map((i) => ({ ...i }))
  templateLoaded.value = true
  setTimeout(() => (templateLoaded.value = false), 4000)
  selectedTemplateId.value = ''
}
const suggestions = ref<string[]>([])
const showSuggestions = ref(false)
let searchTimer: ReturnType<typeof setTimeout> | null = null

async function fetchSuggestions(q: string) {
  try {
    suggestions.value = await apiFetch<string[]>(
      `/prescriptions/diseases?q=${encodeURIComponent(q)}`,
    )
  } catch {
    suggestions.value = []
  }
}

function onTitleInput() {
  showSuggestions.value = true
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => fetchSuggestions(form.title), 200)
}

function onTitleFocus() {
  showSuggestions.value = true
  fetchSuggestions(form.title)
}

function onTitleBlur() {
  setTimeout(() => (showSuggestions.value = false), 150)
}

async function pickSuggestion(s: string) {
  form.title = s
  showSuggestions.value = false
  await loadTemplate(true)
}

const todayStr = new Date().toLocaleDateString('en-GB')

const canSave = computed(() =>
  form.title.trim().length > 0 && form.items.some((i) => i.name?.trim())
)

function addItem() {
  form.items.push({ name: '', dose: '', frequency: '', duration: '', notes: '' })
}
function removeItem(i: number) {
  form.items.splice(i, 1)
}

async function loadTemplate(force = false) {
  const title = form.title.trim()
  if (!title) return
  try {
    const tpl = await apiFetch<PrescriptionTemplate | null>(
      `/prescriptions/template?title=${encodeURIComponent(title)}`,
    )
    if (tpl && tpl.items?.length) {
      // fill if user hasn't entered any items yet, or when explicitly picked
      if (force || form.items.every((i) => !i.name?.trim())) {
        form.items = tpl.items.map((i) => ({ ...i }))
        if ((force || !form.symptoms) && tpl.symptoms) form.symptoms = tpl.symptoms
        templateLoaded.value = true
        setTimeout(() => (templateLoaded.value = false), 4000)
      }
    }
  } catch {
    // silently ignore template misses
  }
}

async function save(): Promise<Prescription | null> {
  if (!canSave.value) return null
  saving.value = true
  try {
    const created = await apiFetch<Prescription>(`/prescriptions`, {
      method: 'POST',
      body: JSON.stringify({
        patient_id: patientId.value,
        title: form.title.trim(),
        symptoms: form.symptoms.trim() || undefined,
        items: form.items.filter((i) => i.name?.trim()),
        lang: locale.value === 'ar' ? 'ar' : 'en',
      }),
    })
    return created
  } finally {
    saving.value = false
  }
}

async function saveOnly() {
  const created = await save()
  if (created) router.back()
}

function normalizePhone(phone: string): string {
  // Egypt: strip non-digits, prepend 20 for local 0... or 10-digit 1...
  const d = (phone || '').replace(/\D/g, '')
  if (!d) return ''
  if (d.startsWith('20')) return d
  if (d.startsWith('0')) return '20' + d.slice(1)
  if (d.length === 10 && d.startsWith('1')) return '20' + d
  return d
}

// --- Save current draft as a reusable template ---
const showSaveTemplateModal = ref(false)
const newTemplateName = ref('')
const savingTemplate = ref(false)
const templateSavedMsg = ref(false)

function openSaveTemplateModal() {
  newTemplateName.value = form.title.trim()
  showSaveTemplateModal.value = true
}

async function confirmSaveTemplate() {
  const name = newTemplateName.value.trim()
  if (!name) return
  savingTemplate.value = true
  try {
    const created = await apiFetch<SavedTemplate>('/prescription-templates', {
      method: 'POST',
      body: JSON.stringify({
        name,
        title: form.title.trim() || null,
        symptoms: form.symptoms.trim() || null,
        items: form.items.filter((i) => i.name?.trim()),
      }),
    })
    templatesData.value = [created, ...templatesData.value]
    showSaveTemplateModal.value = false
    newTemplateName.value = ''
    templateSavedMsg.value = true
    setTimeout(() => (templateSavedMsg.value = false), 3000)
  } finally {
    savingTemplate.value = false
  }
}

async function saveAndWhatsapp() {
  const created = await save()
  if (!created) return
  const phone = normalizePhone(patient.value?.phone || '')
  const lines: string[] = [t('prescription.waGreeting', { name: patient.value?.name || '' })]
  lines.push('')
  lines.push(`*${created.title}*`)
  if (created.pdf_url) {
    lines.push('')
    lines.push(t('prescription.waPdfLink') + ' ' + created.pdf_url)
  }
  const msg = encodeURIComponent(lines.join('\n'))
  const url = phone ? `https://wa.me/${phone}?text=${msg}` : `https://wa.me/?text=${msg}`
  window.open(url, '_blank')
  router.back()
}
</script>
