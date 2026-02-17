<script setup lang="ts">
import Card from '~/components/ui/Card.vue'
import Button from '~/components/ui/Button.vue'

interface RaceLogEntry {
  file: string
  raceId?: string
  lobbyId?: string
}

const props = defineProps<{
  replayLoading: boolean
  replayError: string | null
  replayLogs: RaceLogEntry[]
}>()

const emit = defineEmits<{
  (e: 'replay-log', file: string): void
}>()
</script>

<template>
  <Card class="mt-4">
    <h2 class="text-sm font-semibold mb-2">Recent race logs</h2>
    <p v-if="props.replayLoading" class="text-[0.75rem] text-slate-400">Loading logs…</p>
    <p v-else-if="props.replayError" class="text-[0.75rem] text-rose-300">{{ props.replayError }}</p>
    <p
      v-else-if="props.replayLogs.length === 0"
      class="text-[0.75rem] text-slate-400"
    >
      No logs available yet.
    </p>
    <ul v-else class="space-y-1 text-[0.75rem] max-h-40 overflow-auto pr-1">
      <li
        v-for="log in props.replayLogs"
        :key="log.file"
        class="flex items-center justify-between rounded-lg border border-slate-800/40 bg-slate-900/80 px-2 py-1.5"
      >
        <div class="flex flex-col">
          <span class="font-mono text-[0.65rem] text-slate-300 truncate max-w-[14rem]">{{ log.file }}</span>
          <span class="text-[0.65rem] text-slate-500">
            Race: {{ log.raceId }} · Lobby: {{ log.lobbyId }}
          </span>
        </div>
        <Button
          type="button"
          size="sm"
          class="text-[0.65rem] px-2 py-0.5"
          @click="emit('replay-log', log.file)"
        >
          Replay
        </Button>
      </li>
    </ul>
  </Card>
</template>
