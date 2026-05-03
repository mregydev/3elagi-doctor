import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { createI18n } from 'vue-i18n'
import router from './router'
import App from './App.vue'
import './assets/index.css'
import ar from './locales/ar'
import en from './locales/en'

const savedLang = localStorage.getItem('lang') ?? 'ar'

const i18n = createI18n({
  legacy: false,
  locale: savedLang,
  fallbackLocale: 'en',
  messages: { ar, en },
})

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(VueQueryPlugin)
app.use(i18n)
app.mount('#app')
