<template>
  <div
    class="min-h-screen flex items-center justify-center p-4 relative"
    style="background: hsl(var(--gray-0))"
    :dir="locale === 'ar' ? 'rtl' : 'ltr'"
  >
    <!-- Language dropdown — top right corner (always LTR position) -->
    <div class="fixed top-4 end-4 z-50">
      <LanguageDropdown />
    </div>

    <div class="w-full max-w-md">
      <!-- Header / Logo -->
      <div class="text-center mb-6">
        <div class="flex items-center justify-center text-[hsl(var(--primary))] mb-3">
          <AppLogo :height="52" />
        </div>
        <p class="text-[hsl(var(--muted-foreground))] text-sm mt-1">{{ $t('app.tagline') }}</p>
        <a
          href="/3elagi/"
          class="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-[hsl(var(--primary))] hover:underline"
        >
          {{ $t('patientPortal.portalCta') }} →
        </a>
      </div>

      <!-- Card -->
      <div class="bg-white rounded-2xl shadow-lg overflow-hidden border border-[hsl(var(--border))]">
        <!-- Type tabs: Clinic / Doctor -->
        <div class="grid grid-cols-2 border-b border-[hsl(var(--border))]">
          <button
            v-for="tab in typeTabs"
            :key="tab.type"
            @click="userType = tab.type"
            class="flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-colors"
            :class="userType === tab.type
              ? 'text-[hsl(var(--primary))] border-b-2 border-[hsl(var(--primary))] -mb-px bg-blue-50/50'
              : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'"
          >
            <component :is="tab.icon" :size="16" />
            {{ tab.type === 'clinic' ? $t('auth.clinicTab') : $t('auth.doctorTab') }}
          </button>
        </div>

        <!-- Mode tabs: Login / Register -->
        <div class="grid grid-cols-2 bg-[hsl(var(--muted))] p-1 gap-1 mx-4 mt-4 rounded-xl">
          <button
            v-for="mode in ['login', 'register']"
            :key="mode"
            @click="authMode = mode as 'login' | 'register'"
            class="py-2 text-xs font-semibold transition-all rounded-lg"
            :class="authMode === mode
              ? 'bg-white text-[hsl(var(--primary))] shadow-sm'
              : 'text-[hsl(var(--muted-foreground))]'"
          >
            {{ mode === 'login' ? $t('auth.loginTab') : $t('auth.registerTab') }}
          </button>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
          <div v-if="error" class="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg">{{ error }}</div>

          <!-- Email -->
          <div>
            <label class="block text-xs font-medium text-[hsl(var(--foreground))] mb-1.5">{{ $t('auth.email') }}</label>
            <input
              v-model="form.email"
              type="text"
              required
              autocomplete="username"
              class="w-full px-3 py-2.5 text-sm border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-shadow"
            />
          </div>

          <!-- Password -->
          <div>
            <label class="block text-xs font-medium text-[hsl(var(--foreground))] mb-1.5">{{ $t('auth.password') }}</label>
            <input
              v-model="form.password"
              type="password"
              required
              autocomplete="current-password"
              class="w-full px-3 py-2.5 text-sm border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-shadow"
            />
          </div>

          <!-- Register fields -->
          <template v-if="authMode === 'register'">

            <!-- ── Doctor fields ── -->
            <template v-if="userType === 'doctor'">
              <div>
                <label class="block text-xs font-medium mb-1.5">{{ $t('auth.name') }}</label>
                <input
                  v-model="form.name"
                  type="text"
                  required
                  class="w-full px-3 py-2.5 text-sm border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-medium mb-1.5">{{ $t('auth.phone') }}</label>
                  <input
                    v-model="form.phone"
                    type="tel"
                    class="w-full px-3 py-2.5 text-sm border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium mb-1.5">{{ $t('auth.age') }}</label>
                  <input
                    v-model.number="form.age"
                    type="number"
                    min="20"
                    max="90"
                    class="w-full px-3 py-2.5 text-sm border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                  />
                </div>
              </div>

              <!-- Doctor credentials section -->
              <div class="space-y-3 pt-1">
                <div class="flex items-center justify-between">
                  <p class="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
                    {{ $t('auth.credentials') }}
                  </p>
                </div>
                <div class="space-y-2">
                  <div
                    v-for="(cred, idx) in credentialList"
                    :key="idx"
                    class="border border-[hsl(var(--border))] rounded-xl p-3 space-y-2"
                  >
                    <div class="flex items-center justify-between gap-2">
                      <select
                        v-model="cred.type"
                        class="flex-1 px-2 py-1.5 text-xs border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] bg-white"
                      >
                        <option value="photo">{{ $t('auth.photo') }}</option>
                        <option value="graduation_cert">{{ $t('auth.graduationCert') }}</option>
                        <option value="work_permit">{{ $t('auth.workPermit') }}</option>
                      </select>
                      <button
                        type="button"
                        @click="removeCredential(idx)"
                        class="flex-shrink-0 text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                      >
                        {{ $t('auth.removeCredential') }}
                      </button>
                    </div>
                    <FileUploadField
                      :label="''"
                      :hint="credHint(cred.type)"
                      accept=".pdf,image/*"
                      :url="cred.url"
                      :uploading="cred.uploading"
                      :error="cred.error"
                      @change="(f) => handleCredentialFile(idx, f)"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  @click="addCredential"
                  class="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-[hsl(var(--primary))] text-[hsl(var(--primary))] text-xs font-semibold rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Plus :size="14" />
                  {{ $t('auth.addCredential') }}
                </button>
              </div>
            </template>

            <!-- ── Clinic fields ── -->
            <template v-if="userType === 'clinic'">
              <div>
                <label class="block text-xs font-medium mb-1.5">{{ $t('auth.clinicName') }}</label>
                <input
                  v-model="form.clinic_name"
                  type="text"
                  required
                  class="w-full px-3 py-2.5 text-sm border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                />
              </div>
              <div>
                <label class="block text-xs font-medium mb-1.5">{{ $t('auth.phone') }}</label>
                <input
                  v-model="form.clinic_phone"
                  type="tel"
                  required
                  class="w-full px-3 py-2.5 text-sm border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                />
              </div>
              <div>
                <label class="block text-xs font-medium mb-1.5">{{ $t('auth.location') }}</label>
                <input
                  v-model="form.clinic_location"
                  type="text"
                  required
                  class="w-full px-3 py-2.5 text-sm border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                />
              </div>
              <FileUploadField
                :label="$t('auth.permissionDoc')"
                :hint="$t('auth.permissionDocHint')"
                accept=".pdf,image/*"
                :url="permissionDocUrl"
                :uploading="uploadingPermissionDoc"
                :error="permissionDocError"
                @change="handlePermissionDocFile"
              />
            </template>
          </template>

          <button
            type="submit"
            :disabled="loading || anyUploading"
            class="w-full py-2.5 bg-[hsl(var(--primary))] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
          >
            <span v-if="anyUploading">{{ $t('auth.uploading') }}</span>
            <span v-else-if="loading">{{ $t('auth.loading') }}</span>
            <span v-else>{{ authMode === 'login' ? $t('auth.login') : $t('auth.register') }}</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Plus, Building2, Stethoscope } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { uploadFile } from '@/lib/api'
import FileUploadField from './FileUploadField.vue'
import AppLogo from '@/components/AppLogo.vue'
import LanguageDropdown from '@/components/LanguageDropdown.vue'

const { locale, t } = useI18n()
const router = useRouter()
const auth = useAuthStore()

const userType = ref<'clinic' | 'doctor'>('clinic')
const authMode = ref<'login' | 'register'>('login')
const loading = ref(false)
const error = ref('')

const typeTabs = [
  { type: 'clinic' as const, icon: Building2 },
  { type: 'doctor' as const, icon: Stethoscope },
]

const form = reactive({
  email: '',
  password: '',
  name: '',
  phone: '',
  age: undefined as number | undefined,
  clinic_name: '',
  clinic_phone: '',
  clinic_location: '',
})

type CredType = 'photo' | 'graduation_cert' | 'work_permit'

interface CredentialEntry {
  type: CredType
  url: string
  uploading: boolean
  error: string
}

const credentialList = ref<CredentialEntry[]>([
  { type: 'photo', url: '', uploading: false, error: '' },
  { type: 'graduation_cert', url: '', uploading: false, error: '' },
  { type: 'work_permit', url: '', uploading: false, error: '' },
])

function addCredential() {
  credentialList.value.push({ type: 'graduation_cert', url: '', uploading: false, error: '' })
}

function removeCredential(idx: number) {
  credentialList.value.splice(idx, 1)
}

function credHint(type: CredType): string {
  const map: Record<CredType, string> = {
    photo: t('auth.photoHint'),
    graduation_cert: t('auth.graduationCertHint'),
    work_permit: t('auth.workPermitHint'),
  }
  return map[type] ?? ''
}

async function handleCredentialFile(idx: number, file: File | null) {
  if (!file) return
  const cred = credentialList.value[idx]
  cred.uploading = true
  cred.error = ''
  try {
    const res = await uploadFile(file)
    cred.url = res.url
  } catch {
    cred.error = t('auth.uploadFailed')
  } finally {
    cred.uploading = false
  }
}

const permissionDocUrl = ref('')
const uploadingPermissionDoc = ref(false)
const permissionDocError = ref('')

async function handlePermissionDocFile(file: File | null) {
  if (!file) return
  uploadingPermissionDoc.value = true
  permissionDocError.value = ''
  try {
    const res = await uploadFile(file)
    permissionDocUrl.value = res.url
  } catch {
    permissionDocError.value = t('auth.uploadFailed')
  } finally {
    uploadingPermissionDoc.value = false
  }
}

const anyUploading = computed(
  () => uploadingPermissionDoc.value || credentialList.value.some(c => c.uploading)
)

function getCredUrl(type: CredType): string {
  const entries = credentialList.value.filter(c => c.type === type && c.url)
  return entries[entries.length - 1]?.url ?? ''
}

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    if (authMode.value === 'login') {
      await auth.login(form.email, form.password)
    } else if (userType.value === 'clinic') {
      await auth.registerClinic({
        email: form.email,
        password: form.password,
        clinic_name: form.clinic_name,
        clinic_phone: form.clinic_phone,
        clinic_location: form.clinic_location,
        permission_doc_url: permissionDocUrl.value || undefined,
      })
    } else {
      await auth.registerDoctor({
        email: form.email,
        password: form.password,
        name: form.name,
        phone: form.phone || undefined,
        age: form.age,
        photo_url: getCredUrl('photo') || undefined,
        graduation_cert_url: getCredUrl('graduation_cert') || undefined,
        work_permit_url: getCredUrl('work_permit') || undefined,
      })
    }
    if (auth.role === 'admin') {
      router.push('/admin')
    } else if (auth.role === 'clinic_admin') {
      router.push('/clinic/dashboard')
    } else {
      router.push('/doctor/queue')
    }
  } catch (e) {
    error.value = (e instanceof Error ? e.message : null) || t('auth.genericError')
  } finally {
    loading.value = false
  }
}
</script>
