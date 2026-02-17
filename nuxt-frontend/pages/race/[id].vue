<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from '#app'
import Card from '~/components/ui/Card.vue'
import Button from '~/components/ui/Button.vue'
import TextField from '~/components/ui/TextField.vue'

interface User {
  id: string
  name: string
  username: string
  role: string
}

interface CarProgress {
  carId: string
  progress: number
}

interface CarInRace {
  id: string
  name: string
  color: string
  acceleration?: number
  topSpeed?: number
  handling?: number
  ownerName?: string
}

const route = useRoute()
const router = useRouter()
const { $socket } = useNuxtApp()

const raceId = computed(() => String(route.params.id || ''))

const user = ref<User | null>(null)

const raceStatus = ref<'idle' | 'ready' | 'running' | 'finished'>('idle')
const countdown = ref<number | null>(null)
const durationSeconds = ref(0)
const cars = ref<CarInRace[]>([])
const progressByCar = ref<Record<string, number>>({})
const results = ref<any[]>([])
const raceError = ref<string | null>(null)

const replayLogs = ref<any[]>([])
const replayLoading = ref(false)
const replayError = ref<string | null>(null)
const replayTimeout = ref<ReturnType<typeof setTimeout> | null>(null)

const userCars = ref<any[]>([])
const userCarsLoading = ref(false)
const userCarsError = ref<string | null>(null)
const selectedUserCarId = ref('')
const registeringUserCar = ref(false)
const registerUserCarMessage = ref<string | null>(null)

const adminCars = ref<any[]>([])
const adminCarsLoading = ref(false)
const adminCarsError = ref<string | null>(null)
const selectedAdminCarId = ref('')
const registeringAdminCar = ref(false)
const registerAdminCarMessage = ref<string | null>(null)

const socketConnected = ref(false)
const socketError = ref<string | null>(null)

function handleSocketStatus(connected: boolean, error: string | null) {
  socketConnected.value = connected
  socketError.value = error
}

function attachSocketListeners() {
  $socket.on('connect', () => {
    handleSocketStatus(true, null)
    if (raceId.value) {
      $socket.emit('race:join', { raceId: raceId.value })
    }
  })

  $socket.on('disconnect', () => {
    handleSocketStatus(false, socketError.value)
  })

  $socket.on('connect_error', (err: any) => {
    handleSocketStatus(false, err?.message || 'Unable to connect')
  })

  $socket.on('race:state', (state: any) => {
    if (state.raceId && state.raceId !== raceId.value) return
    raceError.value = null
    raceStatus.value = state.status
    if (Array.isArray(state.cars)) {
      cars.value = state.cars
    }
    if (typeof state.durationMs === 'number') {
      durationSeconds.value = Math.round(state.durationMs / 1000)
    }
    if (Array.isArray(state.results)) {
      results.value = state.results
    }
  })

  $socket.on('race:started', ({ startedAt, durationMs, raceId: startedRaceId }: any) => {
    if (startedRaceId && startedRaceId !== raceId.value) return
    raceStatus.value = 'running'
    progressByCar.value = {}
    const endTime = startedAt + durationMs
    const updateCountdown = () => {
      const remaining = endTime - Date.now()
      countdown.value = Math.max(0, Math.ceil(remaining / 1000))
      if (remaining <= 0) {
        clearInterval(interval)
      }
    }
    updateCountdown()
    const interval = setInterval(updateCountdown, 250)
  })

  $socket.on('race:finished', ({ results: res, state }: any) => {
    if (state?.raceId && state.raceId !== raceId.value) return
    raceStatus.value = 'finished'
    results.value = res || []
    countdown.value = 0
    fetchReplayLogs().catch(() => {})
  })

  $socket.on('race:tick', ({ tick }: { tick: CarProgress[] }) => {
    if (!Array.isArray(tick)) return
    const next = { ...progressByCar.value }
    tick.forEach((entry) => {
      next[entry.carId] = entry.progress
    })
    progressByCar.value = next
  })

  $socket.on('race:error', (payload: any) => {
    const payloadRaceId = payload?.raceId
    if (payloadRaceId && payloadRaceId !== raceId.value) return
    raceError.value = payload?.message || 'Race not found'
  })
}

function stopReplay() {
  if (replayTimeout.value) {
    clearTimeout(replayTimeout.value)
    replayTimeout.value = null
  }
}

async function fetchReplayLogs() {
  try {
    replayLoading.value = true
    replayError.value = null
    const res = await fetch('http://localhost:4000/logs')
    if (!res.ok) throw new Error('Failed to load logs')
    const data = await res.json()
    const logs = Array.isArray(data.logs) ? data.logs : []
    replayLogs.value = logs.sort((a: any, b: any) => {
      const ta = typeof a.startedAt === 'number' ? a.startedAt : 0
      const tb = typeof b.startedAt === 'number' ? b.startedAt : 0
      return tb - ta
    }).slice(0, 10)
  } catch (err: any) {
    replayError.value = err?.message || 'Unable to load logs'
  } finally {
    replayLoading.value = false
  }
}

async function startReplay(file: string) {
  stopReplay()
  try {
    replayError.value = null
    const res = await fetch(`http://localhost:4000/logs/${encodeURIComponent(file)}`)
    if (!res.ok) throw new Error('Failed to load log')
    const log = await res.json()
    const {
      cars: logCars = [],
      ticks = [],
      results: logResults = [],
    } = log || {}

    cars.value = Array.isArray(logCars) ? logCars : []
    results.value = Array.isArray(logResults) ? logResults : []
    progressByCar.value = {}

    if (!Array.isArray(ticks) || ticks.length === 0) return

    const playStep = (index: number, prevTime: number) => {
      if (index >= ticks.length) return
      const entry: any = ticks[index]
      const at = typeof entry.at === 'number' ? entry.at : prevTime
      const delay = index === 0 || !prevTime ? 0 : Math.max(0, at - prevTime)

      replayTimeout.value = setTimeout(() => {
        const tickArray: any[] = Array.isArray(entry.tick) ? entry.tick : []
        if (tickArray.length) {
          const next: Record<string, number> = { ...progressByCar.value }
          tickArray.forEach((t: any) => {
            next[t.carId] = t.progress
          })
          progressByCar.value = next
        }
        playStep(index + 1, at)
      }, delay)
    }

    const firstAt = typeof (ticks[0] as any)?.at === 'number' ? (ticks[0] as any).at : 0
    playStep(0, firstAt)
  } catch (err: any) {
    replayError.value = err?.message || 'Unable to start replay'
  }
}

function replayCurrentRace() {
  if (!raceId.value) {
    replayError.value = 'Race ID is missing.'
    return
  }

  const logs = Array.isArray(replayLogs.value) ? replayLogs.value : []
  if (logs.length === 0) {
    replayError.value = 'No replays available yet for this race.'
    // Best effort: refresh logs so they appear once the race finishes.
    fetchReplayLogs()
    return
  }

  const match =
    logs.find((log: any) => log.lobbyId === raceId.value) ||
    logs.find((log: any) => log.raceId === raceId.value)

  if (!match || !match.file) {
    replayError.value = 'No replay found for this race yet.'
    return
  }

  startReplay(match.file as string)
}

async function loadUser() {
  try {
    const res = await fetch('http://localhost:4000/auth/me', {
      credentials: 'include',
    })
    if (!res.ok) {
      router.push(`/login?redirect=${encodeURIComponent(route.fullPath)}`)
      return
    }
    const data = await res.json()
    const me = data?.user as User | undefined
    if (!me) {
      router.push(`/login?redirect=${encodeURIComponent(route.fullPath)}`)
      return
    }
    user.value = me
  } catch {
    router.push(`/login?redirect=${encodeURIComponent(route.fullPath)}`)
  }
}

async function fetchUserCars() {
  if (!user.value?.id) return
  try {
    userCarsLoading.value = true
    userCarsError.value = null
    const res = await fetch(`http://localhost:4000/user/${encodeURIComponent(user.value.id)}/cars`, {
      credentials: 'include',
    })
    if (!res.ok) throw new Error('Failed to load your cars')
    const data = await res.json()
    userCars.value = Array.isArray(data.cars) ? data.cars : []
  } catch (err: any) {
    userCarsError.value = err?.message || 'Unable to load your cars'
  } finally {
    userCarsLoading.value = false
  }
}

async function fetchAdminCars() {
  if (!user.value || user.value.role !== 'admin') return
  try {
    adminCarsLoading.value = true
    adminCarsError.value = null
    const res = await fetch('http://localhost:4000/admin/cars', {
      credentials: 'include',
    })
    if (!res.ok) throw new Error('Failed to load cars')
    const data = await res.json()
    adminCars.value = Array.isArray(data.cars) ? data.cars : []
  } catch (err: any) {
    adminCarsError.value = err?.message || 'Unable to load cars'
  } finally {
    adminCarsLoading.value = false
  }
}

function handleRegisterUserCarToRace(e: Event) {
  e.preventDefault()
  registerUserCarMessage.value = null

  if (!raceId.value) {
    registerUserCarMessage.value = 'Race not found.'
    return
  }
  if (raceStatus.value === 'running' || raceStatus.value === 'finished') {
    registerUserCarMessage.value = 'You can only register before the race starts or while it is waiting.'
    return
  }
  if (!selectedUserCarId.value) {
    registerUserCarMessage.value = 'Select one of your cars first.'
    return
  }

  const car = userCars.value.find((c) => c.id === selectedUserCarId.value)
  if (!car) {
    registerUserCarMessage.value = 'Selected car was not found.'
    return
  }

  const alreadyInRace = cars.value.some((existing) => existing.id === car.id)
  if (alreadyInRace) {
    registerUserCarMessage.value = 'This car is already registered in this race.'
    return
  }

  registeringUserCar.value = true
  try {
    const payloadCar = {
      id: car.id,
      name: car.name,
      color: car.color,
      ownerUserId: user.value?.id,
      ownerName: user.value?.name,
      attributes: {
        acceleration: Number(car.acceleration) || 1,
        topSpeed: Number(car.topSpeed) || 1,
        handling: Math.min(1, Math.max(0, Number(car.handling) || 0.5)),
      },
    }

    $socket.emit('car:add', { raceId: raceId.value, car: payloadCar })
    registerUserCarMessage.value = `Registered "${car.name}" to this race.`
  } catch (err: any) {
    registerUserCarMessage.value = err?.message || 'Failed to register car to race.'
  } finally {
    registeringUserCar.value = false
  }
}

function handleRegisterAdminCarToRace(e: Event) {
  e.preventDefault()
  registerAdminCarMessage.value = null

  if (!raceId.value) {
    registerAdminCarMessage.value = 'Race not found.'
    return
  }
  if (raceStatus.value === 'running' || raceStatus.value === 'finished') {
    registerAdminCarMessage.value = 'You can only register before the race starts or while it is waiting.'
    return
  }
  if (!selectedAdminCarId.value) {
    registerAdminCarMessage.value = 'Select a car first.'
    return
  }

  const car = adminCars.value.find((c) => c.id === selectedAdminCarId.value)
  if (!car) {
    registerAdminCarMessage.value = 'Selected car was not found.'
    return
  }

  const alreadyInRace = cars.value.some((existing) => existing.id === car.id)
  if (alreadyInRace) {
    registerAdminCarMessage.value = 'This car is already registered in this race.'
    return
  }

  registeringAdminCar.value = true
  try {
    const payloadCar = {
      id: car.id,
      name: car.name,
      color: car.color,
      ownerUserId: car.userId,
      attributes: {
        acceleration: Number(car.acceleration) || 1,
        topSpeed: Number(car.topSpeed) || 1,
        handling: Math.min(1, Math.max(0, Number(car.handling) || 0.5)),
      },
    }

    $socket.emit('car:add', { raceId: raceId.value, car: payloadCar })
    registerAdminCarMessage.value = `Registered "${car.name}" to this race.`
  } catch (err: any) {
    registerAdminCarMessage.value = err?.message || 'Failed to register car to race.'
  } finally {
    registeringAdminCar.value = false
  }
}

function handleStartRace() {
  if (!user.value || user.value.role !== 'admin') return
  if (!raceId.value) return
  if (raceStatus.value === 'running') return
  $socket.emit('race:start', { raceId: raceId.value })
}

function handleCloseRace() {
  if (!user.value || user.value.role !== 'admin') return
  if (!raceId.value) return
  $socket.emit('race:close', { raceId: raceId.value })
}

onMounted(async () => {
  await loadUser()
  if (!user.value) return

  attachSocketListeners()
  if (raceId.value) {
    $socket.emit('race:join', { raceId: raceId.value })
  }

  fetchReplayLogs()
  fetchUserCars()
  fetchAdminCars()
})

onBeforeUnmount(() => {
  stopReplay()
})
</script>

<template>
  <div class="min-h-screen text-slate-50 flex justify-center items-start py-8 px-4 overflow-y-auto">
    <div class="w-full max-w-5xl space-y-6">
      <header class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-semibold tracking-tight">Race viewer</h1>
          <p class="text-xs text-slate-400 mt-1">
            Live view for race ID
            <span class="font-mono break-all">{{ raceId }}</span>
          </p>
        </div>
        <div class="flex flex-col items-end gap-1 text-xs">
          <span
            class="inline-flex items-center gap-2 rounded-full px-3 py-1 border text-xs font-medium"
            :class="socketConnected
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
              : 'border-rose-500/40 bg-rose-500/10 text-rose-300'"
          >
            <span
              class="w-2 h-2 rounded-full"
              :class="socketConnected ? 'bg-emerald-400' : 'bg-rose-400'"
            />
            {{ socketConnected ? 'Connected' : 'Disconnected' }}
          </span>
          <span v-if="socketError" class="text-[0.65rem] text-rose-300 max-w-[14rem] truncate">
            {{ socketError }}
          </span>
        </div>
      </header>

      <Card>
        <div v-if="raceError" class="mb-4 rounded-lg border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-xs text-rose-100">
          <span v-if="raceId">
            Race with ID <span class="font-mono break-all">{{ raceId }}</span> was not found.
          </span>
          <span v-else>Race not found.</span>
        </div>

        <div class="flex items-center justify-between mb-3 text-xs text-slate-300">
          <div class="flex items-center gap-3">
            <span>Status: <span class="capitalize">{{ raceStatus }}</span></span>
            <span v-if="durationSeconds">Duration: {{ durationSeconds }}s</span>
            <span v-if="countdown !== null">Remaining: {{ countdown }}s</span>
          </div>
          <div class="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              class="text-[0.7rem]"
              :disabled="replayLoading || !raceId"
              @click="replayCurrentRace"
            >
              Replay this race
            </Button>
          </div>
        </div>

        <div v-if="cars.length === 0" class="text-[0.8rem] text-slate-400">
          Waiting for cars to be added to this race.
        </div>
        <ul v-else class="space-y-2">
          <li
            v-for="car in cars"
            :key="car.id"
            class="rounded-lg border border-slate-800/60 bg-slate-900/80 px-3 py-2 text-xs flex flex-col gap-1"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span
                  class="w-2 h-5 rounded-full"
                  :style="{ backgroundColor: car.color }"
                />
                <span class="text-slate-100">{{ car.name }}</span>
                <span v-if="car.ownerName" class="text-[0.65rem] text-slate-500">({{ car.ownerName }})</span>
              </div>
              <span class="text-[0.65rem] text-slate-400">
                {{ Math.round((progressByCar[car.id] || 0) * 100) }}%
              </span>
            </div>
            <div class="h-2 rounded-full bg-slate-800/80 overflow-hidden">
              <div
                class="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all duration-150"
                :style="{ width: `${Math.min(100, Math.max(0, Math.round((progressByCar[car.id] || 0) * 100)))}%` }"
              />
            </div>
          </li>
        </ul>
      </Card>

      <Card class="mt-4">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-semibold">Results</h2>
          <p class="text-[0.7rem] text-slate-400">Computed entirely on the backend.</p>
        </div>

        <p v-if="raceStatus !== 'finished'" class="text-sm text-slate-500">
          Once the race finishes, results will appear here.
        </p>
        <template v-else>
          <div
            v-if="results && results.length"
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm"
          >
            <div
              v-for="r in results"
              :key="r.carId"
              class="flex flex-col gap-2 rounded-xl border border-slate-800/40 bg-slate-900/80 px-3 py-2"
            >
              <div class="flex items-center gap-3">
                <span class="w-6 text-center text-xs font-semibold text-amber-300">
                  #{{ r.rank }}
                </span>
                <div
                  class="w-2 h-8 rounded-full"
                  :style="{ backgroundColor: (cars.find((c) => c.id === r.carId)?.color) || '#64748b' }"
                />
                <div>
                  <div class="font-semibold text-slate-100 text-sm truncate max-w-[8rem]">{{ r.name }}</div>
                  <div class="text-[0.7rem] text-slate-400">
                    Final speed: {{ r.finalSpeed.toFixed(1) }}
                  </div>
                  <div
                    v-if="typeof r.finishTimeMs === 'number'"
                    class="text-[0.7rem] text-slate-400"
                  >
                    Time: {{ (r.finishTimeMs / 1000).toFixed(2) }}s
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p v-else class="text-sm text-slate-500">No results available.</p>
        </template>
      </Card>

      <Card v-if="user && user.role === 'admin'" class="mt-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-sm font-semibold">Admin controls for this race</h2>
            <p class="text-[0.7rem] text-slate-400 mt-0.5">
              Start or close this race directly from the race view.
            </p>
          </div>
          <div class="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              class="text-[0.7rem]"
              :disabled="!raceId || raceStatus === 'running' || raceStatus === 'finished'"
              @click="handleStartRace"
            >
              Start race
            </Button>
            <Button
              type="button"
              size="sm"
              variant="danger"
              class="text-[0.7rem]"
              :disabled="!raceId"
              @click="handleCloseRace"
            >
              Close race
            </Button>
          </div>
        </div>
      </Card>

      <Card v-if="user && user.role === 'admin'" class="mt-4">
        <div class="flex items-center justify-between mb-2">
          <h2 class="text-sm font-semibold">Register any car</h2>
          <Button
            type="button"
            class="text-[0.7rem] px-2 py-1"
            variant="secondary"
            size="sm"
            @click="fetchAdminCars"
          >
            Refresh
          </Button>
        </div>
        <p class="text-[0.7rem] text-slate-400 mb-3">
          Pick any car from the database and register it into this race.
        </p>
        <p v-if="adminCarsLoading" class="text-[0.75rem] text-slate-400">Loading cars…</p>
        <p v-else-if="adminCarsError" class="text-[0.7rem] text-rose-300">{{ adminCarsError }}</p>
        <p v-else-if="adminCars.length === 0" class="text-[0.75rem] text-slate-400">No cars are available in the database yet.</p>
        <form
          v-else
          class="space-y-3 text-[0.7rem]"
          @submit="handleRegisterAdminCarToRace"
        >
          <div class="flex flex-col gap-1 max-w-xs">
            <label class="text-slate-300">Car</label>
            <select
              v-model="selectedAdminCarId"
              class="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="">Select a car…</option>
              <option
                v-for="car in adminCars"
                :key="car.id"
                :value="car.id"
                :disabled="cars.some((existing) => existing.id === car.id)"
              >
                {{ car.name }} (acc {{ car.acceleration }}, top {{ car.topSpeed }}, handling {{ car.handling }})
                <template v-if="cars.some((existing) => existing.id === car.id)">
                  — already in this race
                </template>
              </option>
            </select>
          </div>
          <p v-if="registerAdminCarMessage" class="text-[0.65rem] text-slate-300">{{ registerAdminCarMessage }}</p>
          <Button
            type="submit"
            :disabled="registeringAdminCar || !raceId || raceStatus === 'running' || raceStatus === 'finished'"
            class="text-[0.7rem]"
            size="sm"
          >
            {{ registeringAdminCar ? 'Registering…' : 'Register car to this race' }}
          </Button>
        </form>
      </Card>

      <Card v-if="user && user.role === 'user'" class="mt-4">
        <div class="flex items-center justify-between mb-2">
          <h2 class="text-sm font-semibold">Register one of your cars</h2>
          <Button
            type="button"
            class="text-[0.7rem] px-2 py-1"
            variant="secondary"
            size="sm"
            @click="fetchUserCars"
          >
            Refresh
          </Button>
        </div>
        <p class="text-[0.7rem] text-slate-400 mb-3">
          Choose a car from your garage to register it into this race.
        </p>
        <p v-if="userCarsLoading" class="text-[0.75rem] text-slate-400">Loading your cars…</p>
        <p v-else-if="userCarsError" class="text-[0.7rem] text-rose-300">{{ userCarsError }}</p>
        <p v-else-if="userCars.length === 0" class="text-[0.75rem] text-slate-400">
          You have no cars yet. Create one from your dashboard first.
        </p>
        <form
          v-else
          class="space-y-3 text-[0.7rem]"
          @submit="handleRegisterUserCarToRace"
        >
          <div class="flex flex-col gap-1 max-w-xs">
            <label class="text-slate-300">Your car</label>
            <select
              v-model="selectedUserCarId"
              class="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="">Select one of your cars…</option>
              <option
                v-for="car in userCars"
                :key="car.id"
                :value="car.id"
                :disabled="cars.some((existing) => existing.id === car.id)"
              >
                {{ car.name }} (acc {{ car.acceleration }}, top {{ car.topSpeed }}, handling {{ car.handling }})
                <template v-if="cars.some((existing) => existing.id === car.id)">
                  — already in this race
                </template>
              </option>
            </select>
          </div>
          <p v-if="registerUserCarMessage" class="text-[0.65rem] text-slate-300">{{ registerUserCarMessage }}</p>
          <Button
            type="submit"
            :disabled="registeringUserCar || !raceId || raceStatus === 'running' || raceStatus === 'finished'"
            class="text-[0.7rem]"
            size="sm"
          >
            {{ registeringUserCar ? 'Registering…' : 'Register car to this race' }}
          </Button>
        </form>
      </Card>

      <Card class="mt-4">
        <h2 class="text-sm font-semibold mb-2">Recent race logs</h2>
        <p v-if="replayLoading" class="text-[0.75rem] text-slate-400">Loading logs…</p>
        <p v-else-if="replayError" class="text-[0.75rem] text-rose-300">{{ replayError }}</p>
        <p v-else-if="replayLogs.length === 0" class="text-[0.75rem] text-slate-400">No logs available yet.</p>
        <ul v-else class="space-y-1 text-[0.75rem] max-h-40 overflow-auto pr-1">
          <li
            v-for="log in replayLogs"
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
              @click="startReplay(log.file)"
            >
              Replay
            </Button>
          </li>
        </ul>
      </Card>
    </div>
  </div>
</template>
