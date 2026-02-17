<script setup lang="ts">
import Card from '~/components/ui/Card.vue'

interface Props {
  user: {
    id: string
    name: string
    username: string
    role: string
  } | null
}

const props = defineProps<Props>()
</script>

<template>
  <Card>
    <h2 class="text-sm font-semibold mb-2">Profile</h2>
    <dl class="text-xs text-slate-300 space-y-1">
      <div class="flex justify-between">
        <dt class="text-slate-400">Name</dt>
        <dd>{{ props.user?.name }}</dd>
      </div>
      <div class="flex justify-between">
        <dt class="text-slate-400">Username</dt>
        <dd>{{ props.user?.username }}</dd>
      </div>
      <div class="flex justify-between">
        <dt class="text-slate-400">Role</dt>
        <dd class="uppercase tracking-widest text-[0.6rem] text-slate-400">{{ props.user?.role }}</dd>
      </div>
      <div class="flex justify-between">
        <dt class="text-slate-400">User ID</dt>
        <dd class="text-[0.6rem] text-slate-500 truncate max-w-[12rem] text-right">{{ props.user?.id }}</dd>
      </div>
    </dl>
  </Card>
</template>
