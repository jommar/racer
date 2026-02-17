<script setup lang="ts">
import Button from '~/components/ui/Button.vue'

interface RaceSummary {
  raceId: string
  status: string
  durationMs: number
  cars: number
}

const props = defineProps<{
  races: RaceSummary[]
  selectedRaceId: string | null
}>()

const emit = defineEmits<{
  (e: 'select-race', raceId: string): void
  (e: 'view-race', raceId: string, status: string): void
  (e: 'close-race', raceId: string): void
  (e: 'start-race', raceId: string): void
}>()
</script>

<template>
  <div>
    <h3 class="text-xs font-semibold text-slate-300 uppercase tracking-widest mb-2">Active races (/admin/race)</h3>
    <p v-if="props.races.length === 0" class="text-[0.8rem] text-slate-500">No active races right now.</p>
    <ul v-else class="space-y-1 text-[0.8rem] max-h-40 overflow-auto pr-1">
      <li
        v-for="r in props.races"
        :key="r.raceId"
        class="flex items-center justify-between rounded-lg border border-slate-800/40 bg-slate-900/80 px-2 py-1.5 cursor-pointer hover:border-sky-500/60 hover:bg-slate-900/90 transition-colors"
        @click="emit('select-race', r.raceId)"
      >
        <div class="flex flex-col">
          <span class="font-mono text-[0.7rem] text-slate-300 truncate max-w-[14rem]">{{ r.raceId }}</span>
          <span class="text-[0.65rem] text-slate-500">
            Cars: {{ r.cars }} · Duration: {{ Math.round((r.durationMs || 0) / 1000) }}s
          </span>
        </div>
        <div class="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            class="text-[0.65rem] px-2 py-0.5 rounded-full"
            @click.stop="emit('view-race', r.raceId, r.status)"
          >
            View
          </Button>
          <Button
            type="button"
            size="sm"
            variant="danger"
            class="text-[0.65rem] px-2 py-0.5 rounded-full"
            @click.stop="emit('close-race', r.raceId)"
          >
            Close
          </Button>
          <Button
            type="button"
            size="sm"
            class="text-[0.65rem] px-2 py-0.5 rounded-full"
            @click.stop="emit('start-race', r.raceId)"
          >
            Start
          </Button>
          <span class="text-[0.65rem] px-2 py-0.5 rounded-full border border-slate-700 bg-slate-950/60 text-slate-300 capitalize">
            {{ r.status }}
          </span>
        </div>
      </li>
    </ul>
  </div>
</template>
