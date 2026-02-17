<script setup lang="ts">
import Card from '~/components/ui/Card.vue'

interface CarInRace {
  id: string
  name: string
  color: string
}

interface RaceResult {
  carId: string
  rank: number
  name: string
  finalSpeed: number
  finishTimeMs?: number
}

const props = defineProps<{
  raceStatus: 'idle' | 'ready' | 'running' | 'finished'
  results: RaceResult[]
  cars: CarInRace[]
}>()
</script>

<template>
  <Card class="mt-4">
    <div class="flex items-center justify-between mb-3">
      <div>
        <h2 class="text-sm font-semibold">Results</h2>
        <p class="text-[0.7rem] text-slate-400">Final standings</p>
      </div>
    </div>

    <p v-if="props.raceStatus !== 'finished'" class="text-sm text-slate-500">
      Once the race finishes, results will appear here.
    </p>
    <template v-else>
      <div
        v-if="props.results && props.results.length"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm"
      >
        <div
          v-for="r in props.results"
          :key="r.carId"
          class="flex flex-col gap-2 rounded-xl border border-slate-800/40 bg-slate-900/80 px-3 py-2"
        >
          <div class="flex items-center gap-3">
            <span class="w-6 text-center text-xs font-semibold text-amber-300">
              #{{ r.rank }}
            </span>
            <div
              class="w-2 h-8 rounded-full"
              :style="{ backgroundColor: (props.cars.find((c) => c.id === r.carId)?.color) || '#64748b' }"
            />
            <div>
              <div class="font-semibold text-slate-100 text-sm truncate max-w-[8rem]">{{ r.name }}</div>
              <div class="text-[0.7rem] text-slate-400">
                Final speed: {{ r.finalSpeed.toFixed(1) }}
              </div>
              <div
                v-if="typeof r.finishTimeMs === 'number'"
                class="text-[0.7rem] text-slate-400"
              >
                Time: {{ (r.finishTimeMs / 1000).toFixed(5) }}s
              </div>
            </div>
          </div>
        </div>
      </div>
      <p v-else class="text-sm text-slate-500">No results available.</p>
    </template>
  </Card>
</template>
