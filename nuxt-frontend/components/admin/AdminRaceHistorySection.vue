<script setup lang="ts">
interface RaceHistoryItem {
  id: string
  status: string
  durationMs: number
  createdAt?: string
  finishedAt?: string
  createdByName?: string
}

const props = defineProps<{
  raceHistory: RaceHistoryItem[]
}>()
</script>

<template>
  <div>
    <h3 class="text-xs font-semibold text-slate-300 uppercase tracking-widest mb-2">Recent races (DB history)</h3>
    <p v-if="!props.raceHistory || props.raceHistory.length === 0" class="text-[0.8rem] text-slate-500">
      No races have been recorded yet.
    </p>
    <ul v-else class="space-y-1 text-[0.8rem] max-h-40 overflow-auto pr-1">
      <li
        v-for="r in props.raceHistory"
        :key="r.id"
        class="flex items-center justify-between rounded-lg border border-slate-800/40 bg-slate-900/80 px-2 py-1.5"
      >
        <div class="flex flex-col">
          <span class="font-mono text-[0.7rem] text-slate-300 truncate max-w-[14rem]">{{ r.id }}</span>
          <span class="text-[0.65rem] text-slate-500">
            Duration: {{ Math.round((r.durationMs || 0) / 1000) }}s · Created:
            {{ r.createdAt ? new Date(r.createdAt).toLocaleString() : '—' }}
            <template v-if="r.finishedAt">
              · Finished: {{ new Date(r.finishedAt).toLocaleString() }}
            </template>
          </span>
          <span v-if="r.createdByName" class="text-[0.65rem] text-slate-500">Admin: {{ r.createdByName }}</span>
        </div>
        <span class="text-[0.65rem] px-2 py-0.5 rounded-full border border-slate-700 bg-slate-950/60 text-slate-300 capitalize">
          {{ r.status }}
        </span>
      </li>
    </ul>
  </div>
</template>
