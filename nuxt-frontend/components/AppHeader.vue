<script setup lang="ts">
import Button from '~/components/ui/Button.vue'

interface User {
  id: string
  name: string
  username?: string
  role?: string
}

const props = defineProps<{
  user: User | null
  socketConnected: boolean
  socketError: string | null
  isAdmin: boolean
  activeView: 'racer' | 'admin' | 'user-dashboard' | 'race-page'
}>()

const emit = defineEmits<{
  (e: 'logout'): void
  (e: 'change-view', view: 'racer' | 'admin' | 'user-dashboard' | 'race-page'): void
}>()
</script>

<template>
  <header class="sticky top-0 z-30 flex flex-col gap-4 mb-8 bg-slate-950/80 backdrop-blur-sm border-b border-slate-800/60 pb-4">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold tracking-tight bg-gradient-to-r from-sky-400 via-emerald-300 to-amber-200 bg-clip-text text-transparent">
          Racing Arena
        </h1>
        <p class="text-sm text-slate-400 mt-1">
          Add as many cars as you like, set a race timer, and let the backend decide the winner.
        </p>
      </div>
      <div class="flex items-center gap-3 text-sm">
        <div v-if="user" class="flex flex-col items-end text-xs text-slate-300 mr-2">
          <span class="font-semibold">{{ user.name }}</span>
          <span
            v-if="user.role"
            class="uppercase tracking-widest text-[0.6rem] text-slate-400"
          >
            {{ user.role }}
          </span>
        </div>
        <span
          class="inline-flex items-center gap-2 rounded-full px-3 py-1 border text-xs font-medium"
          :class="props.socketConnected
            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
            : 'border-rose-500/40 bg-rose-500/10 text-rose-300'"
        >
          <span
            class="w-2 h-2 rounded-full"
            :class="props.socketConnected ? 'bg-emerald-400' : 'bg-rose-400'"
          />
          {{ props.socketConnected ? 'Connected to backend' : 'Disconnected' }}
        </span>
        <span
          v-if="socketError"
          class="text-[0.65rem] text-rose-300 max-w-[14rem] truncate"
        >
          {{ socketError }}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          class="text-xs px-3 py-1"
          @click="emit('logout')"
        >
          Logout
        </Button>
      </div>
    </div>
    <nav class="flex items-center gap-2 text-xs">
      <template v-if="isAdmin">
        <Button
          type="button"
          size="sm"
          class="rounded-full text-[0.7rem]"
          :variant="activeView === 'racer' ? 'primary' : 'secondary'"
          @click="emit('change-view', 'racer')"
        >
          Race view
        </Button>
        <Button
          type="button"
          size="sm"
          class="rounded-full text-[0.7rem]"
          :variant="activeView === 'admin' ? 'primary' : 'secondary'"
          @click="emit('change-view', 'admin')"
        >
          Admin dashboard
        </Button>
      </template>
      <template v-else>
        <Button
          type="button"
          size="sm"
          class="rounded-full text-[0.7rem]"
          :variant="activeView === 'user-dashboard' ? 'primary' : 'secondary'"
          @click="emit('change-view', 'user-dashboard')"
        >
          User dashboard
        </Button>
      </template>
    </nav>
  </header>
</template>
