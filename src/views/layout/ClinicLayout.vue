<template>
  <div class="flex h-screen overflow-hidden" style="background: hsl(var(--gray-0))" :dir="locale === 'ar' ? 'rtl' : 'ltr'">

    <!-- Mobile overlay -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 bg-black/40 z-40 md:hidden"
      @click="sidebarOpen = false"
    />

    <!-- Sidebar -->
    <aside
      :class="sidebarOpen
        ? 'translate-x-0'
        : locale === 'ar' ? 'translate-x-full md:translate-x-0' : '-translate-x-full md:translate-x-0'"
      class="fixed md:static inset-y-0 start-0 z-50 w-64 md:w-60 flex-shrink-0 bg-white border-e border-[hsl(var(--border))] flex flex-col transition-transform duration-200 md:transition-none"
    >
      <!-- Logo -->
      <div class="h-16 flex items-center px-5 border-b border-[hsl(var(--border))]">
        <AppLogo :height="34" />
      </div>

      <!-- Clinic name under logo -->
      <div class="px-5 py-3 border-b border-[hsl(var(--border))]">
        <div class="text-xs text-[hsl(var(--muted-foreground))]">{{ $t('auth.clinicTab') }}</div>
        <div class="text-sm font-semibold text-[hsl(var(--foreground))] truncate">{{ profile?.name || '—' }}</div>
      </div>

      <!-- Nav Links -->
      <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          @click="sidebarOpen = false"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
          :class="isActive(item.to)
            ? 'bg-[hsl(var(--primary))] text-white'
            : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]'"
        >
          <component :is="item.icon" :size="18" />
          {{ $t(item.label) }}
        </RouterLink>
      </nav>

      <!-- Bottom: Logout only -->
      <div class="p-3 border-t border-[hsl(var(--border))]">
        <button
          @click="handleLogout"
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut :size="18" />
          {{ $t('nav.logout') }}
        </button>
      </div>
    </aside>

    <!-- Right side: header + content -->
    <div class="flex-1 flex flex-col overflow-hidden min-w-0">
      <!-- Top header bar -->
      <header class="h-14 bg-white border-b border-[hsl(var(--border))] flex items-center justify-between px-4 flex-shrink-0">
        <div class="flex items-center gap-3">
          <button
            class="md:hidden p-1.5 rounded-lg hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]"
            @click="sidebarOpen = true"
            :aria-label="$t('nav.menu')"
          >
            <Menu :size="22" />
          </button>
          <div class="md:hidden">
            <AppLogo :height="28" />
          </div>
        </div>
        <LanguageDropdown />
      </header>

      <!-- Main content -->
      <main class="flex-1 overflow-y-auto">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import {
  LayoutDashboard, Users, UserPlus, CalendarDays, LogOut, Stethoscope, Menu, Settings,
} from 'lucide-vue-next'
import AppLogo from '@/components/AppLogo.vue'
import LanguageDropdown from '@/components/LanguageDropdown.vue'

const { locale } = useI18n()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const profile = computed(() => auth.profile)
const sidebarOpen = ref(false)

const navItems = [
  { to: '/clinic/dashboard', label: 'nav.dashboard', icon: LayoutDashboard },
  { to: '/clinic/appointments', label: 'nav.appointments', icon: CalendarDays },
  { to: '/clinic/doctors', label: 'nav.doctors', icon: Stethoscope },
  { to: '/clinic/join-requests', label: 'nav.joinRequests', icon: UserPlus },
  { to: '/clinic/patients', label: 'nav.patients', icon: Users },
  { to: '/clinic/settings', label: 'nav.settings', icon: Settings },
]

function isActive(path: string) {
  return route.path === path || route.path.startsWith(path + '/')
}

function handleLogout() {
  auth.logout()
  router.push('/auth')
}
</script>
