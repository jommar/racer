<script setup lang="ts">
import { ref } from 'vue'
import Card from '~/components/ui/Card.vue'
import Button from '~/components/ui/Button.vue'
import TextField from '~/components/ui/TextField.vue'

interface User {
  id: string
  name: string
  username: string
  role: 'admin' | 'user' | string
}

const emit = defineEmits<{
  (e: 'login-success', user: User): void
}>()

const username = ref('')
const password = ref('')
const error = ref<string | null>(null)
const loading = ref(false)

async function handleSubmit() {
    console.log(123)
  if (!username.value.trim() || !password.value.trim()) return
  console.log(321)
  loading.value = true
  error.value = null
  try {
    // Ensure we use the browser fetch (not a server-side polyfill).
    const res = await window.fetch('http://localhost:4000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username: username.value.trim(), password: password.value }),
    })
    if (!res.ok) {
      if (res.status === 401) {
        error.value = 'Invalid username or password'
      } else {
        error.value = 'Login failed'
      }
      return
    }
    const data = await res.json()
    if (data && data.user) {
      username.value = ''
      password.value = ''
      emit('login-success', data.user as User)
    } else {
      error.value = 'Unexpected response from server'
    }
  } catch (err: any) {
    error.value = err?.message || 'Unable to login'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen text-slate-50 flex items-center justify-center py-10 px-4">
    <Card class="w-full max-w-sm">
      <div class="mb-4">
        <h1 class="text-2xl font-bold tracking-tight bg-gradient-to-r from-sky-400 to-emerald-300 bg-clip-text text-transparent">
          Racing Arena
        </h1>
        <p class="text-xs text-slate-400 mt-1">
          Sign in to manage races. Use one of the seeded accounts, for example
          <span class="block mt-1 text-[0.7rem] text-slate-300">admin / admin123</span>
        </p>
      </div>
      <form class="space-y-3 text-sm" @submit.prevent="handleSubmit">
        <div>
          <label class="block text-xs font-medium text-slate-300 mb-1">Username</label>
          <TextField
            type="text"
            autocomplete="username"
            v-model="username"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-300 mb-1">Password</label>
          <TextField
            type="password"
            autocomplete="current-password"
            v-model="password"
          />
        </div>
        <p v-if="error" class="text-[0.75rem] text-rose-300">{{ error }}</p>
        <Button
          :disabled="loading"
          full-width
          class="mt-2 w-full"
          variant="primary"
          @click="handleSubmit"
        >
          {{ loading ? 'Signing in…' : 'Sign in' }}
        </Button>
      </form>
      <div class="mt-5 text-[0.65rem] text-slate-500 border-t border-slate-800 pt-3">
        <div class="mb-1 text-slate-400">Other seeded users</div>
        <ul class="space-y-0.5 text-slate-300">
          <li>Alice — alice / alice123</li>
          <li>Bob — bob / bob123</li>
          <li>Race Admin — raceadmin / raceadmin123</li>
        </ul>
      </div>
    </Card>
  </div>
</template>
