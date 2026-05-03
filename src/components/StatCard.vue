<template>
  <div class="bg-white border border-[hsl(var(--border))] rounded-xl p-5">
    <div class="flex items-center justify-between mb-3">
      <div :class="`w-10 h-10 rounded-lg flex items-center justify-center ${bgClasses}`">
        <CalendarDays v-if="icon === 'calendar'" :class="iconClasses" :size="20" />
        <Stethoscope v-else-if="icon === 'stethoscope'" :class="iconClasses" :size="20" />
        <Bell v-else-if="icon === 'bell'" :class="iconClasses" :size="20" />
      </div>
    </div>
    <div class="text-2xl font-bold text-[hsl(var(--foreground))]">{{ value }}</div>
    <div class="text-xs text-[hsl(var(--muted-foreground))] mt-1">{{ title }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CalendarDays, Stethoscope, Bell } from 'lucide-vue-next'

const props = defineProps<{
  title: string
  value: string | number
  color: 'blue' | 'green' | 'orange'
  icon: 'calendar' | 'stethoscope' | 'bell'
}>()

const bgClasses = computed(() => ({
  blue: 'bg-blue-100',
  green: 'bg-green-100',
  orange: 'bg-orange-100',
}[props.color]))

const iconClasses = computed(() => ({
  blue: 'text-blue-600',
  green: 'text-green-600',
  orange: 'text-orange-600',
}[props.color]))
</script>
