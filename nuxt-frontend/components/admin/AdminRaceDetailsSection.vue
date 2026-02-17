<script setup lang="ts">
interface RaceCarDetails {
  id: string
  name: string
  color: string
  ownerName?: string
  attributes?: {
    acceleration?: number
    topSpeed?: number
    handling?: number
  }
}

interface RaceDetails {
  cars?: RaceCarDetails[]
}

const props = defineProps<{
  selectedRaceId: string | null
  raceDetailsLoading: boolean
  raceDetailsError: string | null
  selectedRaceDetails: RaceDetails | null
}>()
</script>

<template>
  <div v-if="props.selectedRaceId">
    <h3 class="text-xs font-semibold text-slate-300 uppercase tracking-widest mb-2">
      Race details: {{ props.selectedRaceId }}
    </h3>
    <p v-if="props.raceDetailsLoading" class="text-[0.75rem] text-slate-400">Loading race details…</p>
    <p v-else-if="props.raceDetailsError" class="text-[0.75rem] text-rose-300">{{ props.raceDetailsError }}</p>
    <p
      v-else-if="!props.selectedRaceDetails || !Array.isArray(props.selectedRaceDetails.cars) || props.selectedRaceDetails.cars.length === 0"
      class="text-[0.75rem] text-slate-400"
    >
      No cars registered for this race yet.
    </p>
    <ul
      v-else
      class="space-y-1 text-[0.8rem] max-h-40 overflow-auto pr-1"
    >
      <li
        v-for="car in props.selectedRaceDetails.cars"
        :key="car.id"
        class="flex items-center justify-between rounded-lg border border-slate-800/40 bg-slate-900/80 px-2 py-1.5"
      >
        <div class="flex items-center gap-2">
          <span
            class="w-2 h-6 rounded-full"
            :style="{ backgroundColor: car.color }"
          />
          <div class="flex flex-col">
            <span class="text-slate-200">{{ car.name }}</span>
            <span v-if="car.ownerName" class="text-[0.65rem] text-slate-500">User: {{ car.ownerName }}</span>
          </div>
        </div>
        <div class="text-[0.65rem] text-slate-400 flex gap-2">
          <span>Acc: {{ car.attributes?.acceleration }}</span>
          <span>Top: {{ car.attributes?.topSpeed }}</span>
          <span>Handling: {{ car.attributes?.handling }}</span>
        </div>
      </li>
    </ul>
  </div>
</template>
