<script setup lang="ts">
import Card from '~/components/ui/Card.vue'
import Button from '~/components/ui/Button.vue'

interface CarInRace {
  id: string
  name: string
  color: string
  acceleration?: number
  topSpeed?: number
  handling?: number
  ownerName?: string
}

const props = defineProps<{
  raceId: string
  raceStatus: 'idle' | 'ready' | 'running' | 'finished'
  durationSeconds: number
  countdown: number | null
  cars: CarInRace[]
  progressByCar: Record<string, number>
  replayLoading: boolean
  raceError: string | null
  /** Whether the current viewer is allowed to remove cars. */
  canRemoveCars?: boolean
}>()

const emit = defineEmits<{
  (e: 'replay-current-race'): void
  (e: 'remove-car', carId: string): void
}>()
</script>

<template>
  <Card>
    <div
      v-if="props.raceError"
      class="mb-4 rounded-lg border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-xs text-rose-100"
    >
      <span v-if="props.raceId">
        Race with ID <span class="font-mono break-all">{{ props.raceId }}</span> was not found.
      </span>
      <span v-else>Race not found.</span>
    </div>

    <div class="flex items-center justify-between mb-3 text-xs text-slate-300">
      <div class="flex items-center gap-3">
        <span>Status: <span class="capitalize">{{ props.raceStatus }}</span></span>
        <span v-if="props.durationSeconds">Duration: {{ props.durationSeconds }}s</span>
        <span v-if="props.countdown !== null">Remaining: {{ props.countdown }}s</span>
      </div>
      <div class="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          class="text-[0.7rem]"
          :disabled="props.replayLoading || !props.raceId"
          @click="emit('replay-current-race')"
        >
          Replay this race
        </Button>
      </div>
    </div>

    <div v-if="props.cars.length === 0" class="text-[0.8rem] text-slate-400">
      Waiting for cars to be added to this race.
    </div>
    <ul v-else class="space-y-2">
      <li
        v-for="car in props.cars"
        :key="car.id"
        class="rounded-lg border border-slate-800/60 bg-slate-900/80 px-3 py-2 text-xs flex flex-col gap-1"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span
              class="w-2 h-5 rounded-full"
              :style="{ backgroundColor: car.color }"
            />
            <span class="text-slate-100">{{ car.name }}</span>
            <span v-if="car.ownerName" class="text-[0.65rem] text-slate-500">({{ car.ownerName }})</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[0.65rem] text-slate-400">
              {{ Math.round((props.progressByCar[car.id] || 0) * 100) }}%
            </span>
            <Button
              v-if="props.canRemoveCars && (props.raceStatus === 'idle' || props.raceStatus === 'ready')"
              type="button"
              size="sm"
              variant="secondary"
              class="text-[0.6rem] px-2 py-0.5 text-rose-300 hover:text-rose-200 hover:bg-rose-900/40"
              @click="emit('remove-car', car.id)"
            >
              Remove
            </Button>
          </div>
        </div>
        <div class="h-2 rounded-full bg-slate-800/80 overflow-hidden">
          <div
            class="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all duration-150"
            :style="{
              width: `${Math.min(100, Math.max(0, Math.round((props.progressByCar[car.id] || 0) * 100)))}%`,
            }"
          />
        </div>
      </li>
    </ul>
  </Card>
</template>
