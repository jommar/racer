<script setup lang="ts">
import Card from '~/components/ui/Card.vue'
import Button from '~/components/ui/Button.vue'

interface AdminCar {
  id: string
  name: string
  acceleration?: number
  topSpeed?: number
  handling?: number
  spriteKey?: string
}

interface CarInRace {
  id: string
}

const props = defineProps<{
  adminCars: AdminCar[]
  adminCarsLoading: boolean
  adminCarsError: string | null
  selectedAdminCarId: string
  registerAdminCarMessage: string | null
  registeringAdminCar: boolean
  raceId: string
  raceStatus: 'idle' | 'ready' | 'running' | 'finished'
  carsInRace: CarInRace[]
}>()

const emit = defineEmits<{
  (e: 'refresh-admin-cars'): void
  (e: 'update:selectedAdminCarId', value: string): void
  (e: 'register-admin-car'): void
}>()

function onChange(e: Event) {
  const target = e.target as HTMLSelectElement | null
  if (!target) return
  emit('update:selectedAdminCarId', target.value)
}

function onSubmit(e: Event) {
  e.preventDefault()
  emit('register-admin-car')
}
</script>

<template>
  <Card class="mt-4">
    <div class="flex items-center justify-between mb-2">
      <h2 class="text-sm font-semibold">Register any car</h2>
      <Button
        type="button"
        class="text-[0.7rem] px-2 py-1"
        variant="secondary"
        size="sm"
        @click="emit('refresh-admin-cars')"
      >
        Refresh
      </Button>
    </div>
    <p class="text-[0.7rem] text-slate-400 mb-3">
      Pick any car from the database and register it into this race.
    </p>
    <p v-if="props.adminCarsLoading" class="text-[0.75rem] text-slate-400">Loading cars…</p>
    <p v-else-if="props.adminCarsError" class="text-[0.7rem] text-rose-300">{{ props.adminCarsError }}</p>
    <p
      v-else-if="props.adminCars.length === 0"
      class="text-[0.75rem] text-slate-400"
    >
      No cars are available in the database yet.
    </p>
    <form
      v-else
      class="space-y-3 text-[0.7rem]"
      @submit="onSubmit"
    >
      <div class="flex flex-col gap-1 max-w-xs">
        <label class="text-slate-300">Car</label>
        <select
          :value="props.selectedAdminCarId"
          class="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
          @change="onChange"
        >
          <option value="">Select a car…</option>
          <option
            v-for="car in props.adminCars"
            :key="car.id"
            :value="car.id"
            :disabled="props.carsInRace.some((existing) => existing.id === car.id)"
          >
            {{ car.name }} (acc {{ car.acceleration }}, top {{ car.topSpeed }}, handling {{ car.handling }})
            <template v-if="props.carsInRace.some((existing) => existing.id === car.id)">
              — already in this race
            </template>
          </option>
        </select>
      </div>
      <p
        v-if="props.registerAdminCarMessage"
        class="text-[0.65rem] text-slate-300"
      >
        {{ props.registerAdminCarMessage }}
      </p>
      <Button
        type="submit"
        :disabled="props.registeringAdminCar || !props.raceId || props.raceStatus === 'running' || props.raceStatus === 'finished'"
        class="text-[0.7rem]"
        size="sm"
      >
        {{ props.registeringAdminCar ? 'Registering…' : 'Register car to this race' }}
      </Button>
    </form>
  </Card>
</template>
