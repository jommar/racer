<script setup lang="ts">
import Card from '~/components/ui/Card.vue'
import Button from '~/components/ui/Button.vue'
import TextField from '~/components/ui/TextField.vue'

interface Car {
  id: string
  name: string
  acceleration: number
  topSpeed: number
  handling: number
}

interface RaceSummary {
  raceId: string
  status: string
  durationMs: number
  cars: number
}

const props = defineProps<{
  joinableRaces: RaceSummary[]
  cars: Car[]
  selectedRaceId: string
  selectedCarId: string
  raceIdInput: string
  racesLoading: boolean
  racesError: string | null
  registering: boolean
  registerMessage: string | null
}>()

const emit = defineEmits<{
  (e: 'refresh-races'): void
  (e: 'update:selectedRaceId', value: string): void
  (e: 'update:selectedCarId', value: string): void
  (e: 'update:raceIdInput', value: string): void
  (e: 'submit'): void
}>()

function onSubmit(e: Event) {
  e.preventDefault()
  emit('submit')
}
</script>

<template>
  <Card>
    <div class="flex items-center justify-between mb-2">
      <h2 class="text-sm font-semibold">Join a live race</h2>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        class="text-[0.7rem] px-2 py-1"
        @click="emit('refresh-races')"
      >
        Refresh races
      </Button>
    </div>
    <p class="text-[0.7rem] text-slate-400 mb-3">
      Select a car above, then choose or paste a race ID to register it into a live race created by an admin.
    </p>
    <p v-if="props.racesLoading" class="text-[0.75rem] text-slate-400">Loading races…</p>
    <p v-else-if="props.racesError" class="text-[0.7rem] text-rose-300">{{ props.racesError }}</p>
    <p
      v-if="!props.selectedCarId"
      class="text-[0.7rem] text-slate-400 mb-2"
    >
      Tip: click "Use for live race" on one of your cars first.
    </p>
    <form
      class="space-y-3 text-[0.7rem]"
      @submit="onSubmit"
    >
      <div class="grid gap-3 md:grid-cols-2">
        <div class="flex flex-col gap-1">
          <label class="text-slate-300">Live race</label>
          <select
            :value="props.selectedRaceId"
            class="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
            @change="emit('update:selectedRaceId', ($event.target as HTMLSelectElement).value)"
          >
            <option value="">Select a race…</option>
            <option
              v-for="race in props.joinableRaces"
              :key="race.raceId"
              :value="race.raceId"
            >
              {{ race.raceId }}  {{ race.status }} ({{ Math.round((race.durationMs || 0) / 1000) }}s, {{ race.cars }} cars)
            </option>
          </select>
          <span class="text-[0.65rem] text-slate-500 mt-1">Or paste race ID:</span>
          <TextField
            :model-value="props.raceIdInput"
            class="mt-1 text-xs"
            placeholder="race UUID"
            @update:model-value="val => emit('update:raceIdInput', val as string)"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-slate-300">Your car</label>
          <select
            :value="props.selectedCarId"
            class="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
            @change="emit('update:selectedCarId', ($event.target as HTMLSelectElement).value)"
          >
            <option value="">Select one of your cars…</option>
            <option
              v-for="car in props.cars"
              :key="car.id"
              :value="car.id"
            >
              {{ car.name }} (acc {{ car.acceleration }}, top {{ car.topSpeed }}, handling {{ car.handling }})
            </option>
          </select>
        </div>
      </div>
      <p v-if="props.registerMessage" class="text-[0.65rem] text-slate-300">{{ props.registerMessage }}</p>
      <Button
        type="submit"
        :disabled="props.registering || props.cars.length === 0"
        size="sm"
        class="text-[0.7rem]"
        variant="primary"
      >
        {{ props.registering ? 'Registering…' : 'Register car to race' }}
      </Button>
    </form>
  </Card>
</template>
