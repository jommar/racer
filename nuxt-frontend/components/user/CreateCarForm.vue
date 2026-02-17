<script setup lang="ts">
import Button from '~/components/ui/Button.vue'
import Card from '~/components/ui/Card.vue'
import TextField from '~/components/ui/TextField.vue'

const props = defineProps<{
  name: string
  acceleration: number
  topSpeed: number
  handling: number
  creating: boolean
  error: string | null
}>()

const emit = defineEmits<{
  (e: 'update:name', value: string): void
  (e: 'update:acceleration', value: number): void
  (e: 'update:topSpeed', value: number): void
  (e: 'update:handling', value: number): void
  (e: 'submit'): void
}>()

function onSubmit(e: Event) {
  e.preventDefault()
  emit('submit')
}
</script>

<template>
  <Card>
    <h2 class="text-sm font-semibold mb-2">Create a garage car</h2>
    <p class="text-[0.7rem] text-slate-400 mb-3">
      Cars created here are stored in the database and associated with your account.
    </p>
    <form class="space-y-2 text-[0.7rem]" @submit="onSubmit">
      <div class="flex flex-col gap-1">
        <label class="text-slate-300">Car name</label>
        <TextField
          type="text"
          :model-value="props.name"
          class="py-1 text-xs"
          placeholder="e.g. Thunderbolt"
          @update:model-value="val => emit('update:name', val as string)"
        />
      </div>
      <div class="grid grid-cols-3 gap-2">
        <div class="flex flex-col gap-1">
          <label class="text-slate-300">Acceleration</label>
          <TextField
            type="number"
            min="1"
            max="10"
            step="0.5"
            :model-value="props.acceleration"
            class="py-1 text-xs"
            @update:model-value="val => emit('update:acceleration', Number(val))"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-slate-300">Top speed</label>
          <TextField
            type="number"
            min="50"
            max="400"
            step="10"
            :model-value="props.topSpeed"
            class="py-1 text-xs"
            @update:model-value="val => emit('update:topSpeed', Number(val))"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-slate-300">Handling</label>
          <TextField
            type="number"
            min="0"
            max="1"
            step="0.05"
            :model-value="props.handling"
            class="py-1 text-xs"
            @update:model-value="val => emit('update:handling', Number(val))"
          />
        </div>
      </div>
      <p v-if="props.error" class="text-[0.65rem] text-rose-300">{{ props.error }}</p>
      <Button
        type="submit"
        :disabled="props.creating"
        size="sm"
        class="mt-1 text-[0.7rem]"
      >
        {{ props.creating ? 'Creating…' : 'Create car' }}
      </Button>
    </form>
  </Card>
</template>
