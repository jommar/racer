<script setup lang="ts">
import Card from '~/components/ui/Card.vue'
import Button from '~/components/ui/Button.vue'

interface RaceSummary {
  raceId: string
  status: string
  durationMs: number
  cars: number
}

interface RaceHistoryItem {
  id: string
  status: string
  durationMs: number
  createdAt?: string
  finishedAt?: string
  createdByName?: string
}

const props = defineProps<{
  loading: boolean
  error: string | null
  races: RaceSummary[]
  raceHistory: RaceHistoryItem[]
  usersCount: number
  carsCount: number
  newRaceDurationSeconds: number | string
}>()

const emit = defineEmits<{
  (e: 'refresh-admin-data'): void
  (e: 'update:newRaceDurationSeconds', value: number | string): void
}>()

function onDurationChange(e: Event) {
  const target = e.target as HTMLInputElement | null
  if (!target) return
  emit('update:newRaceDurationSeconds', target.value)
}
</script>

<template>
  <Card>
    <div class="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold">Admin Dashboard</h2>
        <p class="text-xs text-slate-400 mt-1">Overview of races, users, and cars.</p>
      </div>
      <Button
        type="button"
        :disabled="props.loading"
        variant="secondary"
        size="sm"
        class="text-[0.7rem] px-3 py-1"
        @click="emit('refresh-admin-data')"
      >
        {{ props.loading ? 'Refreshing…' : 'Refresh' }}
      </Button>
    </div>

    <div class="mb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 text-[0.8rem]">
      <div>
        <label class="block text-[0.7rem] text-slate-400 uppercase tracking-widest mb-1">
          New race duration (seconds)
        </label>
        <input
          :value="props.newRaceDurationSeconds"
          type="number"
          min="1"
          class="w-32 rounded-lg border border-slate-700 bg-slate-900/80 px-2 py-1 text-[0.8rem] text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
          @input="onDurationChange"
        />
      </div>
      <div class="flex flex-col items-start sm:items-end gap-1">
        <slot name="create-race" />
      </div>
    </div>

    <p v-if="props.error" class="text-[0.75rem] text-rose-300 mb-3">{{ props.error }}</p>

    <div class="grid sm:grid-cols-3 gap-3 mb-4 text-sm">
      <div class="rounded-xl bg-slate-950/60 px-3 py-3 ring-1 ring-slate-800/40">
        <div class="text-[0.7rem] text-slate-400 uppercase tracking-widest mb-1">Active races</div>
        <div class="text-2xl font-semibold text-slate-50">{{ props.races.length }}</div>
      </div>
      <div class="rounded-xl bg-slate-950/60 px-3 py-3 ring-1 ring-slate-800/40">
        <div class="text-[0.7rem] text-slate-400 uppercase tracking-widest mb-1">Users</div>
        <div class="text-2xl font-semibold text-slate-50">{{ props.usersCount }}</div>
      </div>
      <div class="rounded-xl bg-slate-950/60 px-3 py-3 ring-1 ring-slate-800/40">
        <div class="text-[0.7rem] text-slate-400 uppercase tracking-widest mb-1">Cars</div>
        <div class="text-2xl font-semibold text-slate-50">{{ props.carsCount }}</div>
      </div>
    </div>

    <slot />
  </Card>
</template>
