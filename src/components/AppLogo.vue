<script setup lang="ts">
interface Props {
  height?: number
  dark?: boolean
}

withDefaults(defineProps<Props>(), {
  height: 44,
  dark: false,
})
</script>

<template>
  <svg
    dir="ltr"
    :height="height"
    viewBox="0 0 360 90"
    fill="none"
    style="display: block; overflow: visible; flex-shrink: 0; direction: ltr; unicode-bidi: isolate"
    aria-label="3elagi"
  >
    <circle
      cx="45" cy="45" r="42"
      :fill="dark ? 'rgba(255,255,255,0.12)' : 'rgba(48,87,242,0.08)'"
      :stroke="dark ? '#ffffff' : '#3057F2'"
      stroke-width="3"
    />
    <path
      d="M 28,38 C 20,38 17,30 22,24 C 26,19 34,20 34,27"
      :stroke="dark ? '#ffffff' : '#3057F2'"
      stroke-width="5.5" stroke-linecap="round" fill="none"
    />
    <path
      d="M 62,38 C 70,38 73,30 68,24 C 64,19 56,20 56,27"
      :stroke="dark ? '#ffffff' : '#3057F2'"
      stroke-width="5.5" stroke-linecap="round" fill="none"
    />
    <path
      d="M 28,38 C 28,48 45,50 45,58"
      :stroke="dark ? '#ffffff' : '#3057F2'"
      stroke-width="5.5" stroke-linecap="round" fill="none"
    />
    <path
      d="M 62,38 C 62,48 45,50 45,58"
      :stroke="dark ? '#ffffff' : '#3057F2'"
      stroke-width="5.5" stroke-linecap="round" fill="none"
    />
    <circle
      cx="45" cy="65" r="7"
      :stroke="dark ? '#ffffff' : '#3057F2'"
      stroke-width="4" fill="none"
    />
    <circle cx="45" cy="65" r="2.5" :fill="dark ? '#ffffff' : '#3057F2'" />
    <text
      x="98" y="62"
      font-family="'Nunito', sans-serif"
      font-weight="800"
      font-size="58"
      :fill="dark ? '#ffffff' : '#3057F2'"
      letter-spacing="-1"
    >3elagi</text>
  </svg>
</template>
