<template>
  <div class="relative" ref="wrapRef">
    <!-- Trigger button -->
    <button
      @click="open = !open"
      class="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold border border-[hsl(var(--border))] rounded-lg bg-white hover:bg-[hsl(var(--muted))] transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
    >
      <FlagEG v-if="locale === 'ar'" />
      <FlagGB v-else />
      <span class="text-[hsl(var(--foreground))]">{{ locale === 'ar' ? 'AR' : 'EN' }}</span>
      <ChevronDown
        :size="14"
        class="text-[hsl(var(--muted-foreground))] transition-transform duration-150"
        :class="open ? 'rotate-180' : ''"
      />
    </button>

    <!-- Dropdown panel -->
    <Teleport to="body">
      <div
        v-if="open"
        :style="dropdownStyle"
        class="fixed z-[9999] bg-white border border-[hsl(var(--border))] rounded-xl shadow-lg py-1 min-w-[120px]"
        @mousedown.stop
      >
        <button
          v-for="lang in langs"
          :key="lang.code"
          @click="select(lang.code)"
          class="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-[hsl(var(--muted))] transition-colors text-sm"
        >
          <Check
            :size="13"
            class="flex-shrink-0 text-[hsl(var(--primary))]"
            :class="locale === lang.code ? 'opacity-100' : 'opacity-0'"
          />
          <FlagEG v-if="lang.code === 'ar'" />
          <FlagGB v-else />
          <span class="font-semibold text-[hsl(var(--foreground))]">{{ lang.label }}</span>
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, onBeforeUnmount, defineComponent, h } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronDown, Check } from 'lucide-vue-next'

/* ── Inline SVG flag components ──────────────────────────────────────── */

/** Egypt — red / white / black horizontal tricolor (20×14 px) */
const FlagEG = defineComponent({
  name: 'FlagEG',
  setup() {
    return () =>
      h('svg', { width: 20, height: 14, viewBox: '0 0 20 14', style: 'display:block;flex-shrink:0' }, [
        h('rect', { width: 20, height: 14, fill: '#000' }),
        h('rect', { y: 0, width: 20, height: '4.67', fill: '#CE1126' }),
        h('rect', { y: '4.67', width: 20, height: '4.66', fill: '#fff' }),
        h('rect', { y: '9.33', width: 20, height: '4.67', fill: '#000' }),
      ])
  },
})

/** UK — simplified Union Jack (20×14 px) */
const FlagGB = defineComponent({
  name: 'FlagGB',
  setup() {
    return () =>
      h('svg', { width: 20, height: 14, viewBox: '0 0 20 14', style: 'display:block;flex-shrink:0' }, [
        h('rect', { width: 20, height: 14, fill: '#012169' }),
        /* diagonals white */
        h('line', { x1: 0, y1: 0, x2: 20, y2: 14, stroke: '#fff', 'stroke-width': 3 }),
        h('line', { x1: 20, y1: 0, x2: 0, y2: 14, stroke: '#fff', 'stroke-width': 3 }),
        /* diagonals red */
        h('line', { x1: 0, y1: 0, x2: 20, y2: 14, stroke: '#C8102E', 'stroke-width': 1.6 }),
        h('line', { x1: 20, y1: 0, x2: 0, y2: 14, stroke: '#C8102E', 'stroke-width': 1.6 }),
        /* cross white */
        h('rect', { x: 8, y: 0, width: 4, height: 14, fill: '#fff' }),
        h('rect', { x: 0, y: 5, width: 20, height: 4, fill: '#fff' }),
        /* cross red */
        h('rect', { x: 8.8, y: 0, width: 2.4, height: 14, fill: '#C8102E' }),
        h('rect', { x: 0, y: 5.8, width: 20, height: 2.4, fill: '#C8102E' }),
      ])
  },
})

/* ── Component logic ─────────────────────────────────────────────────── */

const { locale } = useI18n({ useScope: 'global' })
const open = ref(false)
const wrapRef = ref<HTMLElement | null>(null)
const dropdownStyle = reactive({ top: '0px', left: '0px' })

const langs = [
  { code: 'ar', label: 'AR' },
  { code: 'en', label: 'EN' },
]

function select(code: string) {
  locale.value = code
  localStorage.setItem('lang', code)
  open.value = false
}

function updatePosition() {
  if (!wrapRef.value) return
  const rect = wrapRef.value.getBoundingClientRect()
  dropdownStyle.top = `${rect.bottom + 6}px`
  dropdownStyle.left = `${rect.left}px`
}

function onClickOutside(e: MouseEvent) {
  if (wrapRef.value && !wrapRef.value.contains(e.target as Node)) {
    open.value = false
  }
}

watch(open, (val) => { if (val) updatePosition() })
onMounted(() => document.addEventListener('mousedown', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('mousedown', onClickOutside))
</script>
