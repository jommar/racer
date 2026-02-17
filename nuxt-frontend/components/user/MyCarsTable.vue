<script setup lang="ts">
import Card from '~/components/ui/Card.vue'
import Button from '~/components/ui/Button.vue'

interface Car {
  id: string
  name: string
  color: string
  acceleration: number
  topSpeed: number
  handling: number
  createdAt?: string
}

const props = defineProps<{
  cars: Car[]
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
  (e: 'use-car', id: string): void
}>()
</script>

<template>
  <Card>
    <div class="flex items-center justify-between mb-2">
      <h2 class="text-sm font-semibold">My cars</h2>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        class="text-[0.7rem] px-2 py-1"
        @click="emit('refresh')"
      >
        Refresh
      </Button>
    </div>
    <p v-if="props.loading" class="text-[0.75rem] text-slate-400">Loading cars…</p>
    <p v-else-if="props.cars.length === 0" class="text-[0.75rem] text-slate-400">
      No cars yet. Create one above to start your garage.
    </p>
    <div v-else class="overflow-x-auto">
      <table class="min-w-full text-[0.7rem] text-left text-slate-200">
        <thead class="text-[0.65rem] uppercase tracking-wide text-slate-400 border-b border-slate-800">
          <tr>
            <th class="py-2 pr-3">Name</th>
            <th class="py-2 pr-3">Color</th>
            <th class="py-2 pr-3">Accel</th>
            <th class="py-2 pr-3">Top speed</th>
            <th class="py-2 pr-3">Handling</th>
            <th class="py-2 pr-3">Created</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="car in props.cars"
            :key="car.id"
            class="border-b border-slate-800/60 last:border-0"
          >
            <td class="py-1 pr-3 font-medium flex items-center gap-2">
              <span>{{ car.name }}</span>
              <Button
                type="button"
                size="sm"
                class="text-[0.6rem] px-2 py-0.5"
                variant="secondary"
                @click="emit('use-car', car.id)"
              >
                Use for live race
              </Button>
            </td>
            <td class="py-1 pr-3">
              <span class="inline-flex items-center gap-1">
                <span
                  class="w-3 h-3 rounded-full border border-slate-700"
                  :style="{ backgroundColor: car.color }"
                />
                <span class="text-[0.65rem] text-slate-400">{{ car.color }}</span>
              </span>
            </td>
            <td class="py-1 pr-3">{{ car.acceleration }}</td>
            <td class="py-1 pr-3">{{ car.topSpeed }}</td>
            <td class="py-1 pr-3">{{ car.handling }}</td>
            <td class="py-1 pr-3 text-[0.6rem] text-slate-500">
              {{ car.createdAt ? new Date(car.createdAt).toLocaleString() : '' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </Card>
</template>
