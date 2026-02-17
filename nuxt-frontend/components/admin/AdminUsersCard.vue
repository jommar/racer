<script setup lang="ts">
interface AdminUser {
  id: string
  name: string
  username?: string
  role?: string
}

const props = defineProps<{
  users: AdminUser[]
}>()
</script>

<template>
  <div class="bg-slate-900/60 border border-slate-800/70 rounded-2xl p-4 sm:p-5 shadow-xl shadow-slate-950/50">
    <div class="flex items-center justify-between mb-3">
      <h2 class="text-lg font-semibold">Users</h2>
    </div>
    <p v-if="props.users.length === 0" class="text-sm text-slate-500">No users found.</p>
    <ul v-else class="space-y-1 text-[0.8rem] max-h-40 overflow-auto pr-1">
      <li
        v-for="u in props.users"
        :key="u.id"
        class="flex items-center justify-between rounded-lg border border-slate-800/40 bg-slate-900/80 px-2 py-1.5"
      >
        <div class="flex flex-col">
          <span class="text-slate-200">{{ u.name }}</span>
          <span v-if="u.username" class="text-[0.65rem] text-slate-500">{{ u.username }}</span>
        </div>
        <span class="text-[0.65rem] uppercase tracking-widest text-slate-400">{{ u.role || 'user' }}</span>
      </li>
    </ul>
  </div>
</template>
