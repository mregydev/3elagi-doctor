<template>
  <div class="p-6 space-y-6" :dir="locale === 'ar' ? 'rtl' : 'ltr'">
    <button @click="$router.back()" class="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
      <ArrowRight v-if="locale === 'ar'" :size="16" />
      <ArrowLeft v-else :size="16" />
      {{ $t('patients.title') }}
    </button>

    <div v-if="isLoading" class="flex justify-center py-12">
      <Loader2 class="animate-spin text-[hsl(var(--primary))]" :size="32" />
    </div>

    <template v-else-if="patient">
      <!-- Patient info card -->
      <div class="bg-white border border-[hsl(var(--border))] rounded-xl p-5" style="box-shadow: 0 2px 10px 0 rgb(0 0 0 / .08)">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl flex-shrink-0">
            {{ patient.name?.charAt(0) }}
          </div>
          <div>
            <h1 class="text-xl font-bold">{{ patient.name }}</h1>
            <div class="text-sm text-[hsl(var(--muted-foreground))]">{{ patient.phone }}</div>
            <div v-if="patient.age" class="text-sm text-[hsl(var(--muted-foreground))]">
              {{ patient.age }} {{ $t('patients.years') }}
            </div>
            <div v-if="patient.birth_date" class="text-xs text-[hsl(var(--muted-foreground))]">
              {{ formatDate(patient.birth_date) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Document section — single connected white card -->
      <div
        class="bg-white rounded-xl overflow-hidden"
        style="border: 1px solid hsl(var(--border)); box-shadow: 0 2px 10px 0 rgb(0 0 0 / .08)"
      >
        <!-- Tab header row -->
        <div
          class="flex flex-col md:flex-row md:items-center md:gap-4 p-3 md:px-5 md:py-4 gap-3"
        >
          <!-- Segmented tab pill bar (horizontally scrollable on narrow screens) -->
          <div class="flex-1 min-w-0 overflow-x-auto overflow-y-hidden tabs-scroll">
            <div
              class="inline-flex items-center min-w-max w-full md:w-auto isolate"
              role="tablist"
            >
              <button
                v-for="(tab, idx) in docTabs"
                :key="tab.type"
                @click="activeTab = tab.type"
                role="tab"
                :aria-selected="activeTab === tab.type"
                class="group relative inline-flex items-center justify-center gap-2 px-4 sm:px-5 h-11 text-xs sm:text-[13px] font-semibold whitespace-nowrap border transition-all duration-200 flex-1 md:flex-initial focus:z-10"
                :class="[
                  idx === 0 ? 'rounded-s-xl' : '-ms-px',
                  idx === docTabs.length - 1 ? 'rounded-e-xl' : '',
                  activeTab === tab.type
                    ? 'z-10 bg-[hsl(225_100%_96%)] text-[hsl(var(--primary))] border-[hsl(var(--primary))] shadow-sm shadow-blue-500/15'
                    : 'bg-white text-slate-600 border-slate-200 hover:text-[hsl(var(--primary))] hover:border-[hsl(var(--primary))]/40 hover:bg-blue-50/40 hover:z-10'
                ]"
              >
                <span
                  class="inline-flex items-center justify-center w-6 h-6 rounded-md transition-colors"
                  :class="activeTab === tab.type
                    ? 'bg-[hsl(var(--primary))] text-white'
                    : 'bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-[hsl(var(--primary))]'"
                >
                  <component :is="tabIcons[tab.type]" :size="15" />
                </span>
                <span>{{ $t(`patients.documents.${tab.type}`) }}</span>
              </button>
            </div>
          </div>

          <!-- Action button: New Prescription on prescription tab, Add doc otherwise. Hidden for clinic_admin (read-only). -->
          <button
            v-if="activeTab === 'prescription' && isDoctor"
            @click="$router.push(`/prescriptions/new/${patientId}`)"
            class="inline-flex items-center justify-center gap-1.5 px-4 h-10 bg-gradient-to-br from-[hsl(var(--primary))] to-[#1e40af] text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all flex-shrink-0 w-full md:w-auto"
          >
            <Plus :size="14" />
            {{ $t('prescription.new') }}
          </button>
          <button
            v-else-if="isDoctor && activeTab !== 'intake_exams'"
            @click="openAddDoc"
            class="inline-flex items-center justify-center gap-1.5 px-4 h-10 bg-gradient-to-br from-[hsl(var(--primary))] to-[#1e40af] text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all flex-shrink-0 w-full md:w-auto"
          >
            <Plus :size="14" />
            {{ $t('patients.documents.addDoc') }}
          </button>
        </div>

        <!-- Intake exams tab body -->
        <div v-if="activeTab === 'intake_exams'" class="m-3 md:mx-5 md:mb-5 rounded-xl border border-slate-200 bg-slate-50/40 overflow-hidden divide-y divide-[hsl(var(--border))]">
          <div v-if="loadingIntake" class="flex justify-center py-12">
            <Loader2 class="animate-spin text-[hsl(var(--primary))]" :size="24" />
          </div>
          <div v-else-if="!intakeHistory?.length" class="text-center py-16 text-[hsl(var(--muted-foreground))] text-sm">
            {{ $t('patients.documents.noIntakeExams') }}
          </div>
          <div v-else v-for="exam in intakeHistory" :key="exam.appointment_id" class="p-4 space-y-2">
            <div class="flex items-start justify-between gap-3 flex-wrap">
              <div class="min-w-0">
                <div class="text-sm font-bold text-[hsl(var(--primary))]">{{ exam.intake_test?.name || $t('reservations.intakeDialog') }}</div>
                <div class="text-xs text-[hsl(var(--muted-foreground))]">
                  {{ exam.doctor?.name || '—' }} · {{ formatDate(exam.date) }}
                </div>
              </div>
            </div>
            <IntakeAnswersList
              :questions="exam.intake_test?.questions ?? null"
              :answers="exam.intake_answers ?? null"
            />
          </div>
        </div>

        <!-- Prescription tab body -->
        <div v-else-if="activeTab === 'prescription'" class="m-3 md:mx-5 md:mb-5 rounded-xl border border-slate-200 bg-slate-50/40 overflow-hidden divide-y divide-[hsl(var(--border))]">
          <div
            v-for="rx in (prescriptions ?? [])"
            :key="rx.id"
            class="p-4 flex items-start justify-between gap-3"
          >
            <div class="min-w-0 flex-1">
              <div class="text-sm font-bold text-[hsl(var(--primary))] mb-0.5">{{ rx.title }}</div>
              <div v-if="rx.symptoms" class="text-xs text-[hsl(var(--muted-foreground))] mb-1.5 truncate">{{ rx.symptoms }}</div>
              <div class="flex flex-wrap gap-1.5 mb-1.5">
                <span
                  v-for="(it, i) in rx.items.slice(0, 4)"
                  :key="i"
                  class="text-[11px] px-2 py-0.5 bg-blue-50 text-[hsl(var(--primary))] rounded-full"
                >
                  {{ it.name }}{{ it.dose ? ` · ${it.dose}` : '' }}
                </span>
                <span v-if="rx.items.length > 4" class="text-[11px] text-[hsl(var(--muted-foreground))]">+{{ rx.items.length - 4 }}</span>
              </div>
              <div class="text-xs text-[hsl(var(--muted-foreground))]">{{ formatDate(rx.created_at) }}</div>
            </div>
            <div class="flex flex-col gap-2 items-stretch flex-shrink-0 w-32">
              <a
                v-if="rx.pdf_url"
                :href="rx.pdf_url"
                target="_blank"
                class="group inline-flex items-center justify-center gap-1.5 h-9 w-full text-xs font-semibold text-white bg-gradient-to-br from-[hsl(var(--primary))] to-[#1e40af] rounded-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all"
              >
                <Printer :size="14" class="group-hover:scale-110 transition-transform" />
                {{ $t('prescription.print') }}
              </a>
              <button
                v-if="rx.pdf_url && patient?.phone"
                type="button"
                @click="sendOnWhatsApp(rx)"
                class="group inline-flex items-center justify-center gap-1.5 h-9 w-full text-xs font-semibold text-white bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all"
              >
                <MessageSquare :size="14" class="group-hover:scale-110 transition-transform" />
                WhatsApp
              </button>
            </div>
          </div>
          <div v-if="!prescriptions?.length" class="text-center py-16 text-[hsl(var(--muted-foreground))] text-sm">
            {{ $t('prescription.listEmpty') }}
          </div>
        </div>

        <!-- Other tabs body -->
        <div v-else class="m-3 md:mx-5 md:mb-5 rounded-xl border border-slate-200 bg-slate-50/40 overflow-hidden divide-y divide-[hsl(var(--border))]">
          <div
            v-for="doc in filteredDocs"
            :key="doc.id"
            class="p-4"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 flex-1">
                <div class="text-xs font-semibold text-[hsl(var(--primary))] mb-1">{{ $t(`patients.documents.${doc.type}`) }}</div>
                <div
                  v-if="doc.notes && doc.type === 'diagnosis'"
                  class="prose prose-sm max-w-none mb-2 text-[hsl(var(--foreground))]"
                  v-html="doc.notes"
                />
                <div v-else-if="doc.notes" class="text-sm text-[hsl(var(--foreground))] whitespace-pre-wrap mb-2">{{ doc.notes }}</div>
                <div class="text-xs text-[hsl(var(--muted-foreground))]">{{ formatDate(doc.created_at) }}</div>
              </div>
              <button v-if="isDoctor" @click="deleteDoc(doc.id)" class="text-red-400 hover:text-red-600 transition-colors flex-shrink-0 mt-0.5">
                <Trash2 :size="14" />
              </button>
            </div>

            <template v-if="doc.file_url">
              <div class="mt-3">
                <template v-if="isImage(doc.file_url)">
                  <!-- Small thumbnail — click to open lightbox -->
                  <button
                    @click="lightboxUrl = doc.file_url"
                    class="relative group block rounded-lg overflow-hidden border border-[hsl(var(--border))] bg-[hsl(var(--muted))] hover:opacity-90 transition-opacity"
                    style="width: 72px; height: 72px"
                  >
                    <img
                      :src="doc.file_url"
                      :alt="doc.file_name || $t('patients.documents.file')"
                      class="w-full h-full object-cover"
                    />
                    <div class="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                      <Maximize2 :size="16" class="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                    </div>
                  </button>
                </template>
                <template v-else>
                  <a
                    :href="doc.file_url"
                    target="_blank"
                    class="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <FileText :size="14" />
                    {{ doc.file_name || $t('patients.documents.file') }}
                    <ExternalLink :size="12" />
                  </a>
                </template>
              </div>
            </template>
          </div>

          <div v-if="!filteredDocs.length" class="text-center py-16 text-[hsl(var(--muted-foreground))] text-sm">
            {{ $t('common.noData') }}
          </div>
        </div>
      </div>
    </template>

    <!-- Add document modal -->
    <Teleport to="body">
      <div v-if="showAddDoc" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" @click.self="showAddDoc = false">
        <div class="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
          <h2 class="font-bold text-lg">{{ $t('patients.documents.addDoc') }}</h2>
          <form @submit.prevent="addDoc" class="space-y-3">

            <!-- Type selector (pre-set to active tab) -->
            <div>
              <label class="block text-xs font-medium mb-1">{{ $t('patients.documents.type') }}</label>
              <select
                v-model="newDoc.type"
                class="w-full px-3 py-2 text-sm border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] bg-white"
              >
                <option v-for="tab in docTabs" :key="tab.type" :value="tab.type">
                  {{ $t(`patients.documents.${tab.type}`) }}
                </option>
              </select>
            </div>

            <!-- Rich text for diagnosis / plain textarea for others -->
            <div>
              <label class="block text-xs font-medium mb-1">{{ $t('patients.documents.notes') }}</label>
              <RichTextEditor
                v-if="newDoc.type === 'diagnosis'"
                v-model="newDoc.notes"
                :placeholder="$t('patients.documents.diagnosisPlaceholder')"
              />
              <textarea
                v-else
                v-model="newDoc.notes"
                rows="3"
                class="w-full px-3 py-2 text-sm border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
              />
            </div>

            <!-- File upload only for non-diagnosis types -->
            <div v-if="newDoc.type !== 'diagnosis'">
              <label class="block text-xs font-medium mb-1">{{ $t('patients.documents.file') }}</label>
              <label
                class="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[hsl(var(--border))] rounded-xl p-5 cursor-pointer hover:border-[hsl(var(--primary))] transition-colors"
                :class="{ 'border-[hsl(var(--primary))] bg-blue-50': pickedFile }"
              >
                <input type="file" accept="image/*,.pdf" class="sr-only" @change="onFilePick" />
                <template v-if="pickedFile">
                  <img
                    v-if="pickedFile.type.startsWith('image/')"
                    :src="pickedFilePreview"
                    class="max-h-32 rounded-lg object-contain"
                  />
                  <div v-else class="flex items-center gap-2 text-sm text-[hsl(var(--primary))] font-semibold">
                    <FileText :size="18" />
                    {{ pickedFile.name }}
                  </div>
                  <span class="text-xs text-[hsl(var(--muted-foreground))]">{{ $t('common.edit') }}</span>
                </template>
                <template v-else>
                  <Upload :size="22" class="text-[hsl(var(--muted-foreground))]" />
                  <span class="text-xs text-[hsl(var(--muted-foreground))]">PNG / JPG / PDF</span>
                </template>
              </label>
              <div v-if="uploadProgress" class="mt-2 text-xs text-[hsl(var(--primary))] text-center">{{ $t('common.loading') }}</div>
            </div>

            <div class="flex gap-3 pt-2">
              <button
                type="button"
                @click="showAddDoc = false"
                class="flex-1 py-2 text-sm border border-[hsl(var(--border))] rounded-lg hover:bg-[hsl(var(--muted))]"
              >
                {{ $t('common.cancel') }}
              </button>
              <button
                type="submit"
                :disabled="docSaving"
                class="flex-1 py-2 text-sm bg-[hsl(var(--primary))] text-white rounded-lg disabled:opacity-50 hover:opacity-90"
              >
                {{ docSaving ? $t('common.loading') : $t('common.save') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Image lightbox dialog -->
    <Teleport to="body">
      <div
        v-if="lightboxUrl"
        class="fixed inset-0 z-50 flex items-center justify-center"
        style="background: rgba(0,0,0,0.5)"
        @click.self="lightboxUrl = null"
      >
        <!-- Dialog panel: 50vw × 50vh, white bg, rounded, shadow -->
        <div
          class="relative bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col"
          style="width: 50vw; height: 50vh"
        >
          <!-- Header bar -->
          <div class="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))] flex-shrink-0">
            <span class="text-sm font-semibold text-[hsl(var(--foreground))]">{{ $t('patients.documents.file') }}</span>
            <button
              @click="lightboxUrl = null"
              class="rounded-sm p-1 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors"
            >
              <X :size="18" />
            </button>
          </div>
          <!-- Image area -->
          <div class="flex-1 flex items-center justify-center p-4 bg-[hsl(var(--muted))]">
            <img
              :src="lightboxUrl"
              class="max-w-full max-h-full object-contain rounded"
            />
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { Loader2, ArrowLeft, ArrowRight, Plus, Trash2, FileText, ExternalLink, Upload, ScanLine, FlaskConical, MessageSquare, Pill, ClipboardList, Maximize2, X, Printer } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { apiFetch } from '@/lib/utils'
import { uploadFile } from '@/lib/api'
import type { PatientWithDocuments, MedicalDocument, DocumentType } from '@/domains/patient/types'
import type { Prescription } from '@/domains/prescription/types'
import RichTextEditor from '@/components/RichTextEditor.vue'
import IntakeAnswersList from '@/components/IntakeAnswersList.vue'
import { useAuthStore } from '@/stores/auth'

const { locale, t } = useI18n()
const route = useRoute()
const qc = useQueryClient()
const auth = useAuthStore()
const isDoctor = computed(() => auth.role === 'doctor')
const patientId = computed(() => route.params.id as string)
type TabType = DocumentType | 'intake_exams'
const initialTab = (route.query.tab as TabType) || 'xray'
const activeTab = ref<TabType>(initialTab)

interface IntakeExamQuestion {
  id: string
  text?: string
  text_ar?: string
  text_en?: string
  type: string
  required?: boolean
  options?: { id: string; text?: string; text_ar?: string; text_en?: string }[]
}
interface IntakeExam {
  appointment_id: string
  date: string
  time: string
  doctor: { id: string; name: string; photo_url?: string | null } | null
  intake_test: { id: string; name: string; description?: string | null; questions: IntakeExamQuestion[] } | null
  intake_answers: Record<string, string[]> | null
}

const tabIcons: Record<TabType, unknown> = {
  xray: ScanLine,
  lab: FlaskConical,
  symptom: MessageSquare,
  prescription: Pill,
  diagnosis: ClipboardList,
  intake_exams: ClipboardList,
}
const lightboxUrl = ref<string | null>(null)
const showAddDoc = ref(false)
const docSaving = ref(false)
const uploadProgress = ref(false)
const pickedFile = ref<File | null>(null)
const pickedFilePreview = ref<string>('')

const newDoc = reactive<{ type: DocumentType; notes: string; file_url: string; file_name: string }>({
  type: 'xray',
  notes: '',
  file_url: '',
  file_name: '',
})

const docTabs: { type: TabType }[] = [
  { type: 'xray' },
  { type: 'lab' },
  { type: 'symptom' },
  { type: 'prescription' },
  { type: 'intake_exams' },
]

const { data: patient, isLoading } = useQuery({
  queryKey: computed(() => ['patient', patientId.value]),
  queryFn: () => apiFetch<PatientWithDocuments>(`/patients/${patientId.value}`),
  enabled: computed(() => !!patientId.value),
})

const { data: prescriptions } = useQuery({
  queryKey: computed(() => ['prescriptions', patientId.value]),
  queryFn: () => apiFetch<Prescription[]>(`/prescriptions/patient/${patientId.value}`),
  enabled: computed(() => !!patientId.value),
})

const { data: intakeHistory, isLoading: loadingIntake } = useQuery({
  queryKey: computed(() => ['intake-history', patientId.value]),
  queryFn: () => apiFetch<IntakeExam[]>(`/patients/${patientId.value}/intake-history`),
  enabled: computed(() => !!patientId.value && activeTab.value === 'intake_exams'),
})

function normalizePhone(phone: string): string {
  const d = (phone || '').replace(/\D/g, '')
  if (!d) return ''
  if (d.startsWith('20')) return d
  if (d.startsWith('0')) return '20' + d.slice(1)
  if (d.length === 10 && d.startsWith('1')) return '20' + d
  return d
}

function sendOnWhatsApp(rx: Prescription) {
  const phone = normalizePhone(patient.value?.phone || '')
  const lines = [t('prescription.waGreeting', { name: patient.value?.name || '' }), '', `*${rx.title}*`]
  if (rx.pdf_url) { lines.push(''); lines.push(t('prescription.waPdfLink') + ' ' + rx.pdf_url) }
  const msg = encodeURIComponent(lines.join('\n'))
  const url = phone ? `https://wa.me/${phone}?text=${msg}` : `https://wa.me/?text=${msg}`
  window.open(url, '_blank')
}

const filteredDocs = computed(() =>
  (patient.value?.documents ?? []).filter((d: MedicalDocument) => d.type === activeTab.value)
)

function formatDate(d: string) {
  const localeStr = locale.value === 'ar' ? 'ar-EG' : 'en-GB'
  return new Date(d).toLocaleDateString(localeStr, { year: 'numeric', month: 'short', day: 'numeric' })
}

function isImage(url: string) {
  return /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(url)
}

function onFilePick(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  pickedFile.value = file
  if (file.type.startsWith('image/')) {
    const reader = new FileReader()
    reader.onload = (ev) => { pickedFilePreview.value = ev.target?.result as string }
    reader.readAsDataURL(file)
  } else {
    pickedFilePreview.value = ''
  }
}

function openAddDoc() {
  newDoc.type = activeTab.value === 'intake_exams' ? 'symptom' : activeTab.value
  newDoc.notes = ''
  newDoc.file_url = ''
  newDoc.file_name = ''
  pickedFile.value = null
  pickedFilePreview.value = ''
  showAddDoc.value = true
}

async function addDoc() {
  docSaving.value = true
  try {
    // Upload file first if one was picked
    if (pickedFile.value) {
      uploadProgress.value = true
      const result = await uploadFile(pickedFile.value)
      newDoc.file_url = result.url
      newDoc.file_name = pickedFile.value.name
      uploadProgress.value = false
    }

    await apiFetch('/medical-documents', {
      method: 'POST',
      body: JSON.stringify({
        type: newDoc.type,
        notes: newDoc.notes || undefined,
        file_url: newDoc.file_url || undefined,
        file_name: newDoc.file_name || undefined,
        patient_id: patientId.value,
      }),
    })
    qc.invalidateQueries({ queryKey: ['patient', patientId.value] })
    showAddDoc.value = false
  } finally {
    docSaving.value = false
    uploadProgress.value = false
  }
}

async function deleteDoc(id: string) {
  await apiFetch(`/medical-documents/${id}`, { method: 'DELETE' })
  qc.invalidateQueries({ queryKey: ['patient', patientId.value] })
}
</script>

<style scoped>
.tabs-scroll {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.tabs-scroll::-webkit-scrollbar {
  display: none;
}
</style>
