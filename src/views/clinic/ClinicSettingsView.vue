<template>
  <div class="p-6 max-w-3xl mx-auto space-y-6" :dir="locale === 'ar' ? 'rtl' : 'ltr'">
    <h1 class="text-2xl font-bold">{{ $t('settings.clinicTitle') }}</h1>

    <form @submit.prevent="save" class="space-y-6">
      <section class="bg-white rounded-xl border border-[hsl(var(--border))] p-5 space-y-4" style="box-shadow: 0 2px 10px 0 rgb(0 0 0 / .06)">
        <h2 class="text-base font-bold flex items-center gap-2">
          <Building2 :size="18" class="text-[hsl(var(--primary))]" /> {{ $t('settings.clinicInfo') }}
        </h2>

        <Field :label="$t('auth.clinicName')"><input v-model="form.name" class="input" /></Field>
        <Field :label="$t('auth.phone')"><input v-model="form.phone" class="input" /></Field>
        <Field :label="$t('auth.location')"><input v-model="form.location" class="input" /></Field>
      </section>

      <section class="bg-white rounded-xl border border-[hsl(var(--border))] p-5 space-y-4" style="box-shadow: 0 2px 10px 0 rgb(0 0 0 / .06)">
        <h2 class="text-base font-bold flex items-center gap-2">
          <FileText :size="18" class="text-[hsl(var(--primary))]" /> {{ $t('settings.documents') }}
        </h2>
        <FileField :label="$t('settings.clinicLogo')" v-model="form.logo_url" />
        <FileField :label="$t('auth.permissionDoc')" v-model="form.permission_doc_url" />
      </section>

      <div class="flex justify-end">
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
import { Building2, FileText } from 'lucide-vue-next'
import { apiFetch } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth'
import Field from '@/components/settings/Field.vue'
import FileField from '@/components/settings/FileField.vue'
import type { Clinic } from '@/domains/clinic/types'

const { locale } = useI18n()
const auth = useAuthStore()
const saving = ref(false)
const savedAt = ref<number | null>(null)
const clinicId = (auth.profile as { id: string } | null)?.id

const form = reactive({ name: '', phone: '', location: '', permission_doc_url: '', logo_url: '' })

onMounted(async () => {
  if (!clinicId) return
  const c = await apiFetch<Clinic>(`/clinics/${clinicId}`)
  Object.assign(form, {
    name: c.name ?? '',
    phone: c.phone ?? '',
    location: c.location ?? '',
    permission_doc_url: c.permission_doc_url ?? '',
    logo_url: c.logo_url ?? '',
  })
})

async function save() {
  if (!clinicId) return
  saving.value = true
  try {
    const updated = await apiFetch<Clinic>(`/clinics/${clinicId}`, {
      method: 'PUT',
      body: JSON.stringify(form),
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
.input { @apply w-full px-3 py-2 text-sm border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]; }
</style>
