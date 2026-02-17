<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from '#app'
import AppHeader from '~/components/AppHeader.vue'
import Card from '~/components/ui/Card.vue'
import Button from '~/components/ui/Button.vue'

interface User {
  id: string
  name: string
  username: string
  role: string
}

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

interface AdminUser {
  id: string
  name: string
  username?: string
  role?: string
}

interface AdminCar {
  id: string
  name: string
  color: string
  userId: string
  acceleration: number
  topSpeed: number
  handling: number
}

const router = useRouter()
const { $socket } = useNuxtApp()

const user = ref<User | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const races = ref<RaceSummary[]>([])
const raceHistory = ref<RaceHistoryItem[]>([])
const users = ref<AdminUser[]>([])
const cars = ref<AdminCar[]>([])

const socketConnected = ref(false)
const socketError = ref<string | null>(null)

const selectedRaceId = ref<string | null>(null)
const selectedRaceDetails = ref<any | null>(null)
const raceDetailsLoading = ref(false)
const raceDetailsError = ref<string | null>(null)

const newRaceDurationSeconds = ref(10)
const creatingRace = ref(false)
const createRaceError = ref<string | null>(null)

const isAdmin = computed(() => user.value?.role === 'admin')

function handleSocketStatus(connected: boolean, errorMessage: string | null) {
  socketConnected.value = connected
  socketError.value = errorMessage
}

function attachSocketListeners() {
  $socket.on('connect', () => handleSocketStatus(true, null))
  $socket.on('disconnect', () => handleSocketStatus(false, socketError.value))
  $socket.on('connect_error', (err: any) => {
    handleSocketStatus(false, err?.message || 'Unable to connect')
  })
}

async function fetchAdminData() {
  try {
    loading.value = true
    error.value = null
    const [racesRes, usersRes, carsRes] = await Promise.all([
      fetch('http://localhost:4000/admin/race', { credentials: 'include' }),
      fetch('http://localhost:4000/admin/users', { credentials: 'include' }),
      fetch('http://localhost:4000/admin/cars', { credentials: 'include' }),
    ])

    if (!racesRes.ok || !usersRes.ok || !carsRes.ok) {
      throw new Error('Failed to load admin data')
    }

    const [racesJson, usersJson, carsJson] = await Promise.all([
      racesRes.json(),
      usersRes.json(),
      carsRes.json(),
    ])

    races.value = Array.isArray(racesJson.races) ? racesJson.races : []
    users.value = Array.isArray(usersJson.users) ? usersJson.users : []
    cars.value = Array.isArray(carsJson.cars) ? carsJson.cars : []

    try {
      const historyRes = await fetch('http://localhost:4000/admin/race/history', {
        credentials: 'include',
      })
      if (historyRes.ok) {
        const historyJson = await historyRes.json()
        raceHistory.value = Array.isArray(historyJson.races) ? historyJson.races : []
      } else {
        raceHistory.value = []
      }
    } catch {
      raceHistory.value = []
    }
  } catch (err: any) {
    error.value = err?.message || 'Unable to load admin data'
  } finally {
    loading.value = false
  }
}

async function fetchRaceDetails(id: string | null) {
  if (!id) {
    selectedRaceDetails.value = null
    return
  }
  try {
    raceDetailsLoading.value = true
    raceDetailsError.value = null
    const res = await fetch(`http://localhost:4000/admin/race/${encodeURIComponent(id)}`, {
      credentials: 'include',
    })
    if (!res.ok) throw new Error('Failed to load race details')
    selectedRaceDetails.value = await res.json()
  } catch (err: any) {
    raceDetailsError.value = err?.message || 'Unable to load race details'
    selectedRaceDetails.value = null
  } finally {
    raceDetailsLoading.value = false
  }
}

function handleStartRace(raceId: string) {
  $socket.emit('race:start', { raceId })
}

function handleCloseRace(raceId: string) {
  $socket.emit('race:close', { raceId })
  fetchAdminData()
  if (selectedRaceId.value === raceId) {
    selectedRaceId.value = null
    selectedRaceDetails.value = null
  }
}

function handleViewRace(raceId: string, status: string) {
  const urlRaceId = encodeURIComponent(raceId || '')
  window.open(`/race/${urlRaceId}`, '_blank', 'noopener,noreferrer')
}

function handleCreateRace() {
  if (creatingRace.value) return
  const seconds = Number(newRaceDurationSeconds.value)
  const durationMs = Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : 10000

  creatingRace.value = true
  createRaceError.value = null

  $socket.emit(
    'race:create',
    { durationMs, createdByUserId: user.value?.id },
    (resp: any) => {
      creatingRace.value = false
      if (!resp || !resp.raceId) {
        createRaceError.value = 'Failed to create race'
        return
      }
      fetchAdminData()
      selectedRaceId.value = resp.raceId
    },
  )
}

async function loadUser() {
  try {
    const res = await fetch('http://localhost:4000/auth/me', {
      credentials: 'include',
    })
    if (!res.ok) {
      router.push('/login?redirect=/admin')
      return
    }
    const data = await res.json()
    const me = data?.user as User | undefined
    if (!me || me.role !== 'admin') {
      router.push('/user')
      return
    }
    user.value = me
  } catch {
    router.push('/login?redirect=/admin')
  }
}

async function handleLogout() {
  try {
    await fetch('http://localhost:4000/auth/logout', {
      method: 'POST',
      credentials: 'include',
    })
  } catch {
    // ignore
  }
  router.push('/login')
}

function handleChangeView(view: 'racer' | 'admin' | 'user-dashboard' | 'race-page') {
  if (view === 'admin') return
  if (view === 'user-dashboard') {
    router.push('/user')
  } else if (view === 'racer') {
    // For now, send admins to the race viewer list via React or keep on admin
  }
}

onMounted(async () => {
  await loadUser()
  if (!isAdmin.value) return
  attachSocketListeners()
  fetchAdminData()
})

watch(selectedRaceId, (id) => {
  fetchRaceDetails(id)
})
</script>

<template>
  <div class="min-h-screen text-slate-50 flex justify-center items-start py-8 px-4 overflow-y-auto">
    <div class="w-full max-w-5xl">
      <AppHeader
        :user="user"
        :socket-connected="socketConnected"
        :socket-error="socketError"
        :is-admin="isAdmin"
        active-view="admin"
        @logout="handleLogout"
        @change-view="handleChangeView"
      />

      <main class="grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-6">
        <section class="space-y-4">
          <Card>
            <div class="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 class="text-lg font-semibold">Admin Dashboard</h2>
                <p class="text-xs text-slate-400 mt-1">Overview of races, users, and cars.</p>
              </div>
              <Button
                type="button"
                :disabled="loading"
                variant="secondary"
                size="sm"
                class="text-[0.7rem] px-3 py-1"
                @click="fetchAdminData"
              >
                {{ loading ? 'Refreshing…' : 'Refresh' }}
              </Button>
            </div>

            <div class="mb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 text-[0.8rem]">
              <div>
                <label class="block text-[0.7rem] text-slate-400 uppercase tracking-widest mb-1">
                  New race duration (seconds)
                </label>
                <input
                  v-model="newRaceDurationSeconds"
                  type="number"
                  min="1"
                  class="w-32 rounded-lg border border-slate-700 bg-slate-900/80 px-2 py-1 text-[0.8rem] text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div class="flex flex-col items-start sm:items-end gap-1">
                <Button
                  type="button"
                  :disabled="creatingRace"
                  size="sm"
                  class="text-[0.8rem]"
                  @click="handleCreateRace"
                >
                  {{ creatingRace ? 'Creating race…' : 'Create race' }}
                </Button>
                <p v-if="createRaceError" class="text-[0.7rem] text-rose-300">{{ createRaceError }}</p>
              </div>
            </div>

            <p v-if="error" class="text-[0.75rem] text-rose-300 mb-3">{{ error }}</p>

            <div class="grid sm:grid-cols-3 gap-3 mb-4 text-sm">
              <div class="rounded-xl bg-slate-950/60 px-3 py-3 ring-1 ring-slate-800/40">
                <div class="text-[0.7rem] text-slate-400 uppercase tracking-widest mb-1">Active races</div>
                <div class="text-2xl font-semibold text-slate-50">{{ races.length }}</div>
              </div>
              <div class="rounded-xl bg-slate-950/60 px-3 py-3 ring-1 ring-slate-800/40">
                <div class="text-[0.7rem] text-slate-400 uppercase tracking-widest mb-1">Users</div>
                <div class="text-2xl font-semibold text-slate-50">{{ users.length }}</div>
              </div>
              <div class="rounded-xl bg-slate-950/60 px-3 py-3 ring-1 ring-slate-800/40">
                <div class="text-[0.7rem] text-slate-400 uppercase tracking-widest mb-1">Cars</div>
                <div class="text-2xl font-semibold text-slate-50">{{ cars.length }}</div>
              </div>
            </div>

            <div class="space-y-3">
              <div>
                <h3 class="text-xs font-semibold text-slate-300 uppercase tracking-widest mb-2">Active races (/admin/race)</h3>
                <p v-if="races.length === 0" class="text-[0.8rem] text-slate-500">No active races right now.</p>
                <ul v-else class="space-y-1 text-[0.8rem] max-h-40 overflow-auto pr-1">
                  <li
                    v-for="r in races"
                    :key="r.raceId"
                    class="flex items-center justify-between rounded-lg border border-slate-800/40 bg-slate-900/80 px-2 py-1.5 cursor-pointer hover:border-sky-500/60 hover:bg-slate-900/90 transition-colors"
                    @click="selectedRaceId = r.raceId"
                  >
                    <div class="flex flex-col">
                      <span class="font-mono text-[0.7rem] text-slate-300 truncate max-w-[14rem]">{{ r.raceId }}</span>
                      <span class="text-[0.65rem] text-slate-500">
                        Cars: {{ r.cars }} · Duration: {{ Math.round((r.durationMs || 0) / 1000) }}s
                      </span>
                    </div>
                    <div class="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        class="text-[0.65rem] px-2 py-0.5 rounded-full"
                        @click.stop="handleViewRace(r.raceId, r.status)"
                      >
                        View
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        class="text-[0.65rem] px-2 py-0.5 rounded-full"
                        @click.stop="handleCloseRace(r.raceId)"
                      >
                        Close
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        class="text-[0.65rem] px-2 py-0.5 rounded-full"
                        @click.stop="handleStartRace(r.raceId)"
                      >
                        Start
                      </Button>
                      <span class="text-[0.65rem] px-2 py-0.5 rounded-full border border-slate-700 bg-slate-950/60 text-slate-300 capitalize">
                        {{ r.status }}
                      </span>
                    </div>
                  </li>
                </ul>
              </div>

              <div v-if="selectedRaceId">
                <h3 class="text-xs font-semibold text-slate-300 uppercase tracking-widest mb-2">
                  Race details: {{ selectedRaceId }}
                </h3>
                <p v-if="raceDetailsLoading" class="text-[0.75rem] text-slate-400">Loading race details…</p>
                <p v-else-if="raceDetailsError" class="text-[0.75rem] text-rose-300">{{ raceDetailsError }}</p>
                <p
                  v-else-if="!selectedRaceDetails || !Array.isArray(selectedRaceDetails.cars) || selectedRaceDetails.cars.length === 0"
                  class="text-[0.75rem] text-slate-400"
                >
                  No cars registered for this race yet.
                </p>
                <ul
                  v-else
                  class="space-y-1 text-[0.8rem] max-h-40 overflow-auto pr-1"
                >
                  <li
                    v-for="car in selectedRaceDetails.cars"
                    :key="car.id"
                    class="flex items-center justify-between rounded-lg border border-slate-800/40 bg-slate-900/80 px-2 py-1.5"
                  >
                    <div class="flex items-center gap-2">
                      <span
                        class="w-2 h-6 rounded-full"
                        :style="{ backgroundColor: car.color }"
                      />
                      <div class="flex flex-col">
                        <span class="text-slate-200">{{ car.name }}</span>
                        <span v-if="car.ownerName" class="text-[0.65rem] text-slate-500">User: {{ car.ownerName }}</span>
                      </div>
                    </div>
                    <div class="text-[0.65rem] text-slate-400 flex gap-2">
                      <span>Acc: {{ car.attributes?.acceleration }}</span>
                      <span>Top: {{ car.attributes?.topSpeed }}</span>
                      <span>Handling: {{ car.attributes?.handling }}</span>
                    </div>
                  </li>
                </ul>
              </div>

              <div>
                <h3 class="text-xs font-semibold text-slate-300 uppercase tracking-widest mb-2">Recent races (DB history)</h3>
                <p v-if="!raceHistory || raceHistory.length === 0" class="text-[0.8rem] text-slate-500">
                  No races have been recorded yet.
                </p>
                <ul v-else class="space-y-1 text-[0.8rem] max-h-40 overflow-auto pr-1">
                  <li
                    v-for="r in raceHistory"
                    :key="r.id"
                    class="flex items-center justify-between rounded-lg border border-slate-800/40 bg-slate-900/80 px-2 py-1.5"
                  >
                    <div class="flex flex-col">
                      <span class="font-mono text-[0.7rem] text-slate-300 truncate max-w-[14rem]">{{ r.id }}</span>
                      <span class="text-[0.65rem] text-slate-500">
                        Duration: {{ Math.round((r.durationMs || 0) / 1000) }}s · Created:
                        {{ r.createdAt ? new Date(r.createdAt).toLocaleString() : '—' }}
                        <template v-if="r.finishedAt">
                          · Finished: {{ new Date(r.finishedAt).toLocaleString() }}
                        </template>
                      </span>
                      <span v-if="r.createdByName" class="text-[0.65rem] text-slate-500">Admin: {{ r.createdByName }}</span>
                    </div>
                    <span class="text-[0.65rem] px-2 py-0.5 rounded-full border border-slate-700 bg-slate-950/60 text-slate-300 capitalize">
                      {{ r.status }}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </section>

        <section class="space-y-4">
          <div class="bg-slate-900/60 border border-slate-800/70 rounded-2xl p-4 sm:p-5 shadow-xl shadow-slate-950/50">
            <div class="flex items-center justify-between mb-3">
              <h2 class="text-lg font-semibold">Users</h2>
            </div>
            <p v-if="users.length === 0" class="text-sm text-slate-500">No users found.</p>
            <ul v-else class="space-y-1 text-[0.8rem] max-h-40 overflow-auto pr-1">
              <li
                v-for="u in users"
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

          <div class="bg-slate-900/60 border border-slate-800/70 rounded-2xl p-4 sm:p-5 shadow-xl shadow-slate-950/50">
            <div class="flex items-center justify-between mb-3">
              <h2 class="text-lg font-semibold">Cars</h2>
            </div>
            <p v-if="cars.length === 0" class="text-sm text-slate-500">No cars found.</p>
            <ul v-else class="space-y-1 text-[0.8rem] max-h-40 overflow-auto pr-1">
              <li
                v-for="c in cars"
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
        </section>
      </main>
    </div>
  </div>
</template>
