<template>
  <div class="p-6 max-w-3xl mx-auto space-y-6" :dir="locale === 'ar' ? 'rtl' : 'ltr'">
    <h1 class="text-2xl font-bold">{{ $t('settings.doctorTitle') }}</h1>

    <form @submit.prevent="save" class="space-y-6">
      <!-- Profile photo card -->
      <section class="bg-white rounded-xl border border-[hsl(var(--border))] p-5 space-y-4" style="box-shadow: 0 2px 10px 0 rgb(0 0 0 / .06)">
        <h2 class="text-base font-bold flex items-center gap-2">
          <Camera :size="18" class="text-[hsl(var(--primary))]" /> {{ $t('settings.profilePhoto') }}
        </h2>

        <div class="flex items-center gap-5">
          <div class="relative">
            <div
              class="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-4 border-white ring-2 ring-[hsl(var(--border))] bg-blue-50 flex items-center justify-center flex-shrink-0"
            >
              <img
                v-if="form.photo_url"
                :src="form.photo_url"
                :alt="form.name"
                class="w-full h-full object-cover"
              />
              <User v-else :size="44" class="text-[hsl(var(--primary))]/50" />
            </div>
            <label
              class="absolute -bottom-1 -end-1 w-9 h-9 rounded-full bg-[hsl(var(--primary))] text-white flex items-center justify-center cursor-pointer shadow-md hover:opacity-90 transition"
              :title="$t('settings.changePhoto')"
            >
              <Camera :size="16" />
              <input
                type="file"
                accept="image/*"
                class="sr-only"
                :disabled="uploadingPhoto"
                @change="onPickPhoto"
              />
            </label>
          </div>

          <div class="min-w-0 flex-1">
            <p class="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
              {{ $t('settings.profilePhotoHint') }}
            </p>
            <div class="flex flex-wrap gap-2 mt-3">
              <label
                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-[hsl(var(--border))] rounded-lg cursor-pointer hover:bg-[hsl(var(--muted))]"
              >
                <Upload :size="13" />
                {{ uploadingPhoto ? $t('common.loading') : (form.photo_url ? $t('settings.changePhoto') : $t('settings.uploadPhoto')) }}
                <input
                  type="file"
                  accept="image/*"
                  class="sr-only"
                  :disabled="uploadingPhoto"
                  @change="onPickPhoto"
                />
              </label>
              <button
                v-if="form.photo_url"
                type="button"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-[hsl(var(--border))] rounded-lg text-rose-600 hover:bg-rose-50"
                @click="form.photo_url = ''"
              >
                <Trash2 :size="13" /> {{ $t('settings.removePhoto') }}
              </button>
            </div>
            <p v-if="photoError" class="text-xs text-rose-600 mt-2">{{ photoError }}</p>
          </div>
        </div>
      </section>

      <!-- Personal info card -->
      <section class="bg-white rounded-xl border border-[hsl(var(--border))] p-5 space-y-4" style="box-shadow: 0 2px 10px 0 rgb(0 0 0 / .06)">
        <h2 class="text-base font-bold flex items-center gap-2">
          <UserCircle :size="18" class="text-[hsl(var(--primary))]" /> {{ $t('settings.personalInfo') }}
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field :label="$t('auth.name')"><input v-model="form.name" class="input" /></Field>
          <Field :label="$t('auth.email')"><input v-model="form.email" type="email" class="input" /></Field>
          <Field :label="$t('auth.phone')"><input v-model="form.phone" class="input" /></Field>
          <Field :label="$t('auth.age')"><input v-model.number="form.age" type="number" class="input" /></Field>
        </div>

        <Field :label="$t('settings.personalClinicLocation')">
          <input v-model="form.personal_clinic_location" :placeholder="$t('auth.location')" class="input" />
        </Field>
      </section>

      <!-- Public profile card -->
      <section class="bg-white rounded-xl border border-[hsl(var(--border))] p-5 space-y-4" style="box-shadow: 0 2px 10px 0 rgb(0 0 0 / .06)">
        <h2 class="text-base font-bold flex items-center gap-2">
          <Stethoscope :size="18" class="text-[hsl(var(--primary))]" /> {{ $t('settings.publicProfile') }}
        </h2>
        <p class="text-xs text-[hsl(var(--muted-foreground))]">{{ $t('settings.publicProfileHint') }}</p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field :label="$t('settings.professionalTitle')">
            <input v-model="form.professional_title" :placeholder="$t('settings.professionalTitlePh')" class="input" />
          </Field>
          <Field :label="$t('settings.experienceYears')">
            <input v-model.number="form.experience_years" type="number" min="0" class="input" />
          </Field>
        </div>

        <Field :label="$t('settings.consultationFee')">
          <div class="flex items-center gap-2">
            <input v-model.number="form.consultation_fee_egp" type="number" min="0" class="input" />
            <span class="text-xs text-[hsl(var(--muted-foreground))]">EGP</span>
          </div>
        </Field>

        <Field :label="$t('settings.description')">
          <textarea v-model="form.description" rows="4" :placeholder="$t('settings.descriptionPh')" class="input" />
        </Field>
      </section>

      <!-- FAQ editor card -->
      <section class="bg-white rounded-xl border border-[hsl(var(--border))] p-5 space-y-4" style="box-shadow: 0 2px 10px 0 rgb(0 0 0 / .06)">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h2 class="text-base font-bold flex items-center gap-2">
              <HelpCircle :size="18" class="text-[hsl(var(--primary))]" /> {{ $t('settings.faqTitle') }}
            </h2>
            <p class="text-xs text-[hsl(var(--muted-foreground))] mt-1">{{ $t('settings.faqHint') }}</p>
          </div>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[hsl(var(--primary))] text-white hover:opacity-90"
            @click="addFaq"
          >
            <Plus :size="13" /> {{ $t('settings.faqAdd') }}
          </button>
        </div>

        <div v-if="!form.faqs.length" class="text-xs text-[hsl(var(--muted-foreground))] italic">
          {{ $t('settings.faqEmpty') }}
        </div>

        <div v-for="(faq, idx) in form.faqs" :key="faq.id" class="rounded-lg border border-[hsl(var(--border))] p-3 space-y-2 bg-slate-50/40">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold text-[hsl(var(--primary))]">{{ $t('settings.faqItem', { n: idx + 1 }) }}</span>
            <button
              type="button"
              class="text-rose-600 hover:bg-rose-50 rounded p-1"
              :aria-label="$t('common.delete')"
              @click="removeFaq(idx)"
            >
              <Trash2 :size="14" />
            </button>
          </div>
          <input
            v-model="faq.q"
            :placeholder="$t('settings.faqQPh')"
            class="input"
            maxlength="300"
          />
          <textarea
            v-model="faq.a"
            rows="3"
            :placeholder="$t('settings.faqAPh')"
            class="input"
            maxlength="2000"
          />
        </div>
      </section>

      <!-- Tags card -->
      <section class="bg-white rounded-xl border border-[hsl(var(--border))] p-5 space-y-3" style="box-shadow: 0 2px 10px 0 rgb(0 0 0 / .06)">
        <div>
          <h2 class="text-base font-bold flex items-center gap-2">
            <Tag :size="18" class="text-[hsl(var(--primary))]" /> {{ $t('settings.tagsTitle') }}
          </h2>
          <p class="text-xs text-[hsl(var(--muted-foreground))] mt-1">{{ $t('settings.tagsHint') }}</p>
        </div>

        <div class="flex flex-wrap gap-1.5 min-h-[1.75rem]">
          <span
            v-for="(tag, idx) in form.tags"
            :key="`${tag}-${idx}`"
            class="inline-flex items-center gap-1 h-7 ps-3 pe-1 rounded-full text-[11px] font-semibold bg-blue-50 text-[hsl(var(--primary))] border border-blue-100"
          >
            {{ tag }}
            <button
              type="button"
              class="w-5 h-5 inline-flex items-center justify-center rounded-full hover:bg-blue-100"
              :aria-label="$t('common.delete')"
              @click="removeTag(idx)"
            >
              <X :size="12" />
            </button>
          </span>
          <span v-if="!form.tags.length" class="text-xs text-[hsl(var(--muted-foreground))] italic">
            {{ $t('settings.tagsEmpty') }}
          </span>
        </div>

        <div class="flex gap-2">
          <input
            v-model="tagDraft"
            :placeholder="$t('settings.tagsPh')"
            class="input flex-1"
            maxlength="40"
            :disabled="form.tags.length >= 20"
            @keydown.enter.prevent="addTag"
            @keydown="onTagKeydown"
          />
          <button
            type="button"
            class="px-3 py-2 text-xs font-semibold rounded-lg bg-[hsl(var(--primary))] text-white hover:opacity-90 disabled:opacity-50"
            :disabled="!tagDraft.trim() || form.tags.length >= 20"
            @click="addTag"
          >
            {{ $t('settings.tagsAdd') }}
          </button>
        </div>
        <p class="text-[10px] text-[hsl(var(--muted-foreground))]">{{ $t('settings.tagsLimit', { n: form.tags.length, max: 20 }) }}</p>
      </section>

      <!-- Documents card -->
      <section class="bg-white rounded-xl border border-[hsl(var(--border))] p-5 space-y-4" style="box-shadow: 0 2px 10px 0 rgb(0 0 0 / .06)">
        <h2 class="text-base font-bold flex items-center gap-2">
          <FileText :size="18" class="text-[hsl(var(--primary))]" /> {{ $t('settings.documents') }}
        </h2>

        <FileField :label="$t('auth.graduationCert')" v-model="form.graduation_cert_url" />
        <FileField :label="$t('auth.workPermit')" v-model="form.work_permit_url" />
      </section>

      <!-- Signature card -->
      <section class="bg-white rounded-xl border border-[hsl(var(--border))] p-5 space-y-3" style="box-shadow: 0 2px 10px 0 rgb(0 0 0 / .06)">
        <h2 class="text-base font-bold flex items-center gap-2">
          <PenLine :size="18" class="text-[hsl(var(--primary))]" /> {{ $t('settings.digitalSignature') }}
        </h2>
        <p class="text-xs text-[hsl(var(--muted-foreground))]">{{ $t('settings.signatureHint') }}</p>
        <FileField :label="''" v-model="form.digital_signature_url" image-only />
        <div v-if="form.digital_signature_url" class="bg-[hsl(var(--muted))] rounded-lg p-3 inline-block">
          <img :src="form.digital_signature_url" class="h-16" />
        </div>
      </section>

      <div class="flex justify-end gap-3">
        <button
          type="submit"
          :disabled="saving"
          class="px-6 py-2.5 bg-[hsl(var(--primary))] text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          {{ saving ? $t('common.loading') : $t('common.save') }}
        </button>
      </div>
      <div v-if="savedAt" class="text-xs text-emerald-600 text-end">{{ $t('common.success') }}</div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { UserCircle, FileText, PenLine, Camera, User, Upload, Trash2, Stethoscope, HelpCircle, Plus, Tag, X } from 'lucide-vue-next'
import { apiFetch } from '@/lib/utils'
import { uploadFile } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import Field from '@/components/settings/Field.vue'
import FileField from '@/components/settings/FileField.vue'
import type { Doctor } from '@/domains/doctor/types'

const { locale, t } = useI18n()
const auth = useAuthStore()
const saving = ref(false)
const savedAt = ref<number | null>(null)
const uploadingPhoto = ref(false)
const photoError = ref('')

const form = reactive({
  name: '', email: '', phone: '', age: undefined as number | undefined,
  personal_clinic_location: '',
  photo_url: '',
  graduation_cert_url: '', work_permit_url: '', digital_signature_url: '',
  professional_title: '',
  description: '',
  experience_years: undefined as number | undefined,
  consultation_fee_egp: undefined as number | undefined,
  faqs: [] as { id: string; q: string; a: string }[],
  tags: [] as string[],
})
const tagDraft = ref('')

function addFaq() {
  form.faqs.push({ id: `faq_${Math.random().toString(36).slice(2, 10)}`, q: '', a: '' })
}
function removeFaq(idx: number) {
  form.faqs.splice(idx, 1)
}
function addTag() {
  const v = tagDraft.value.trim().slice(0, 40)
  if (!v) return
  if (form.tags.length >= 20) return
  if (form.tags.some((t) => t.toLowerCase() === v.toLowerCase())) {
    tagDraft.value = ''
    return
  }
  form.tags.push(v)
  tagDraft.value = ''
}
function removeTag(idx: number) {
  form.tags.splice(idx, 1)
}
function onTagKeydown(e: KeyboardEvent) {
  if (e.key === ',') {
    e.preventDefault()
    addTag()
  } else if (e.key === 'Backspace' && !tagDraft.value && form.tags.length) {
    form.tags.pop()
  }
}

onMounted(async () => {
  const me = await apiFetch<Doctor>(`/doctors/me`)
  Object.assign(form, {
    name: me.name ?? '',
    email: me.email ?? '',
    phone: me.phone ?? '',
    age: me.age ?? undefined,
    personal_clinic_location: me.personal_clinic_location ?? '',
    photo_url: me.photo_url ?? '',
    graduation_cert_url: me.graduation_cert_url ?? '',
    work_permit_url: me.work_permit_url ?? '',
    digital_signature_url: me.digital_signature_url ?? '',
    professional_title: me.professional_title ?? '',
    description: me.description ?? '',
    experience_years: me.experience_years ?? undefined,
    consultation_fee_egp: me.consultation_fee_egp ?? undefined,
    faqs: Array.isArray((me as Doctor & { faqs?: { id: string; q: string; a: string }[] }).faqs)
      ? ((me as Doctor & { faqs?: { id: string; q: string; a: string }[] }).faqs as { id: string; q: string; a: string }[]).map((f) => ({
          id: f.id || `faq_${Math.random().toString(36).slice(2, 10)}`,
          q: f.q || '',
          a: f.a || '',
        }))
      : [],
    tags: Array.isArray((me as Doctor & { tags?: string[] }).tags)
      ? ((me as Doctor & { tags?: string[] }).tags as string[]).filter((t) => typeof t === 'string')
      : [],
  })
})

async function onPickPhoto(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  photoError.value = ''
  uploadingPhoto.value = true
  try {
    const r = await uploadFile(file)
    form.photo_url = r.url
  } catch {
    photoError.value = t('auth.uploadFailed')
  } finally {
    uploadingPhoto.value = false
    input.value = ''
  }
}

async function save() {
  saving.value = true
  try {
    const cleanedFaqs = form.faqs
      .map((f) => ({ id: f.id, q: (f.q || '').trim(), a: (f.a || '').trim() }))
      .filter((f) => f.q && f.a)
    const cleanedTags = form.tags.map((t) => t.trim()).filter((t) => t)
    const updated = await apiFetch<Doctor>(`/doctors/me`, {
      method: 'PATCH',
      body: JSON.stringify({ ...form, faqs: cleanedFaqs, tags: cleanedTags }),
    })
    auth.profile = { ...(auth.profile ?? {}), ...updated } as typeof auth.profile
    localStorage.setItem('profile', JSON.stringify(auth.profile))
    savedAt.value = Date.now()
    setTimeout(() => (savedAt.value = null), 3000)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
@reference "tailwindcss";
.input {
  @apply w-full px-3 py-2 text-sm border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))];
}
</style>
