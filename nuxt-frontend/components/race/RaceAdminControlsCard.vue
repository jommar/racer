<script setup lang="ts">
import Card from '~/components/ui/Card.vue'
import Button from '~/components/ui/Button.vue'

const props = defineProps<{
  raceId: string
  raceStatus: 'idle' | 'ready' | 'running' | 'finished'
}>()

const emit = defineEmits<{
  (e: 'start-race'): void
  (e: 'close-race'): void
}>()
</script>

<template>
  <Card class="mt-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-sm font-semibold">Admin controls for this race</h2>
        <p class="text-[0.7rem] text-slate-400 mt-0.5">
          Start, re-run, or close this race directly from the race view.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          class="text-[0.7rem]"
          :disabled="!props.raceId || props.raceStatus === 'running'"
          @click="emit('start-race')"
        >
          {{ props.raceStatus === 'finished' ? 'Re-run race' : 'Start race' }}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="danger"
          class="text-[0.7rem]"
          :disabled="!props.raceId"
          @click="emit('close-race')"
        >
          Close race
        </Button>
      </div>
    </div>
  </Card>
</template>
