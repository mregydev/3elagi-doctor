<template>
  <RouterView />
  <Toaster />
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import Toaster from '@/components/Toaster.vue'

const { locale } = useI18n()
const authStore = useAuthStore()

watch(locale, (val) => {
  document.documentElement.dir = val === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.lang = val
}, { immediate: true })

authStore.restoreSession()
</script>
