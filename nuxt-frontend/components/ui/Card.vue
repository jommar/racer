<script setup lang="ts">
const props = defineProps<{ class?: string }>()

const base =
  'relative z-0 overflow-hidden rounded-2xl border border-slate-800/70 bg-slate-900/80 backdrop-blur-sm p-4 sm:p-5 shadow-xl shadow-slate-950/60 before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:bg-gradient-to-br before:from-slate-50/5 before:via-slate-50/0 before:to-emerald-500/8'

const classes = computed(() => [base, props.class].filter(Boolean).join(' '))
</script>

<template>
  <div :class="classes">
    <slot />
  </div>
</template>
