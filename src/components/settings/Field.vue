<template>
  <div>
    <label class="block text-xs font-semibold mb-1.5 text-[hsl(var(--muted-foreground))]">{{ label }}</label>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string }>()
</script>
