<script setup lang="ts">
const props = defineProps<{
  raceId: string
  socketConnected: boolean
  socketError: string | null
}>()
</script>

<template>
  <header class="flex items-center justify-between">
    <div>
      <h1 class="text-xl font-semibold tracking-tight">Race</h1>
      <p class="text-xs text-slate-400 mt-1 font-mono break-all">
        {{ props.raceId }}
      </p>
    </div>
    <div class="flex flex-col items-end gap-1 text-xs">
      <span
        class="inline-flex items-center gap-2 rounded-full px-3 py-1 border text-xs font-medium"
        :class="props.socketConnected
          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
          : 'border-rose-500/40 bg-rose-500/10 text-rose-300'"
      >
        <span
          class="w-2 h-2 rounded-full"
          :class="props.socketConnected ? 'bg-emerald-400' : 'bg-rose-400'"
        />
        {{ props.socketConnected ? 'Connected' : 'Disconnected' }}
      </span>
      <span
        v-if="props.socketError && !props.socketConnected"
        class="text-[0.65rem] text-rose-300 max-w-[14rem] truncate"
      >
        {{ props.socketError }}
      </span>
    </div>
  </header>
</template>
