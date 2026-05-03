<template>
  <div class="p-4 md:p-6 max-w-md mx-auto" :dir="locale === 'ar' ? 'rtl' : 'ltr'">
    <h1 class="text-xl md:text-2xl font-bold mb-1">{{ $t('admin.settingsTitle') }}</h1>
    <p class="text-xs text-[hsl(var(--muted-foreground))] mb-4">{{ $t('admin.settingsSubtitle') }}</p>

    <form @submit.prevent="submit" class="bg-white border border-[hsl(var(--border))] rounded-xl p-5 space-y-3">
      <h2 class="font-semibold text-sm">{{ $t('admin.changePassword') }}</h2>
      <label class="block text-xs font-semibold">
        {{ $t('admin.currentPassword') }}
        <input v-model="currentPwd" type="password" required class="mt-1 w-full px-2.5 py-1.5 text-sm border rounded-lg" />
      </label>
      <label class="block text-xs font-semibold">
        {{ $t('admin.newPassword') }}
        <input v-model="newPwd" type="password" required minlength="4" class="mt-1 w-full px-2.5 py-1.5 text-sm border rounded-lg" />
      </label>
      <label class="block text-xs font-semibold">
        {{ $t('admin.confirmPassword') }}
        <input v-model="confirmPwd" type="password" required class="mt-1 w-full px-2.5 py-1.5 text-sm border rounded-lg" />
      </label>
      <div v-if="error" class="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md p-2">{{ error }}</div>
      <div v-if="success" class="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md p-2">{{ success }}</div>
      <button
        type="submit"
        :disabled="loading"
        class="w-full py-2 text-sm font-semibold bg-[hsl(var(--primary))] text-white rounded-lg disabled:opacity-50"
      >
        {{ loading ? $t('common.loading') : $t('admin.savePassword') }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { apiFetch } from '@/lib/utils'

const { locale, t } = useI18n()
const currentPwd = ref('')
const newPwd = ref('')
const confirmPwd = ref('')
const error = ref('')
const success = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  success.value = ''
  if (newPwd.value !== confirmPwd.value) {
    error.value = t('admin.passwordMismatch')
    return
  }
  loading.value = true
  try {
    await apiFetch('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ current_password: currentPwd.value, new_password: newPwd.value }),
    })
    success.value = t('admin.passwordChanged')
    currentPwd.value = ''
    newPwd.value = ''
    confirmPwd.value = ''
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}
</script>
