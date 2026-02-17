<script setup lang="ts">
interface AdminCar {
  id: string
  name: string
  color: string
  userId: string
  acceleration: number
  topSpeed: number
  handling: number
}

const props = defineProps<{
  cars: AdminCar[]
}>()
</script>

<template>
  <div class="bg-slate-900/60 border border-slate-800/70 rounded-2xl p-4 sm:p-5 shadow-xl shadow-slate-950/50">
    <div class="flex items-center justify-between mb-3">
      <h2 class="text-lg font-semibold">Cars</h2>
    </div>
    <p v-if="props.cars.length === 0" class="text-sm text-slate-500">No cars found.</p>
    <ul v-else class="space-y-1 text-[0.8rem] max-h-40 overflow-auto pr-1">
      <li
        v-for="c in props.cars"
        :key="c.id"
        class="flex items-center justify-between rounded-lg border border-slate-800/40 bg-slate-900/80 px-2 py-1.5"
      >
        <div class="flex items-center gap-2">
          <span
            class="w-2 h-6 rounded-full"
            :style="{ backgroundColor: c.color }"
          />
          <div class="flex flex-col">
            <span class="text-slate-200">{{ c.name }}</span>
            <span class="text-[0.65rem] text-slate-500">User: {{ c.userId }}</span>
          </div>
        </div>
        <div class="text-[0.65rem] text-slate-400 flex gap-2">
          <span>Acc: {{ c.acceleration.toFixed(1) }}</span>
          <span>Top: {{ c.topSpeed.toFixed(0) }}</span>
          <span>Handling: {{ c.handling.toFixed(2) }}</span>
        </div>
      </li>
    </ul>
  </div>
</template>
