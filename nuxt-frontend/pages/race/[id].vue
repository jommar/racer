<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from '#app'
import RaceHeader from '~/components/race/RaceHeader.vue'
import RaceStatusAndCarsCard from '~/components/race/RaceStatusAndCarsCard.vue'
import RaceResultsCard from '~/components/race/RaceResultsCard.vue'
import RaceAdminControlsCard from '~/components/race/RaceAdminControlsCard.vue'
import RaceAdminRegisterCarCard from '~/components/race/RaceAdminRegisterCarCard.vue'
import RaceUserRegisterCarCard from '~/components/race/RaceUserRegisterCarCard.vue'
import RaceLogsCard from '~/components/race/RaceLogsCard.vue'

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
    handleSocketStatus(false, null)
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

function handleRegisterUserCarToRace() {
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

function handleRegisterAdminCarToRace() {
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
  if ($socket.connected) {
    handleSocketStatus(true, null)
    if (raceId.value) {
      $socket.emit('race:join', { raceId: raceId.value })
    }
  } else if (raceId.value) {
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
      <RaceHeader
        :race-id="raceId"
        :socket-connected="socketConnected"
        :socket-error="socketError"
      />

      <RaceStatusAndCarsCard
        :race-id="raceId"
        :race-status="raceStatus"
        :duration-seconds="durationSeconds"
        :countdown="countdown"
        :cars="cars"
        :progress-by-car="progressByCar"
        :replay-loading="replayLoading"
        :race-error="raceError"
        @replay-current-race="replayCurrentRace"
      />

      <RaceResultsCard
        :race-status="raceStatus"
        :results="results"
        :cars="cars"
      />

      <RaceAdminControlsCard
        v-if="user && user.role === 'admin'"
        :race-id="raceId"
        :race-status="raceStatus"
        @start-race="handleStartRace"
        @close-race="handleCloseRace"
      />

      <RaceAdminRegisterCarCard
        v-if="user && user.role === 'admin'"
        :admin-cars="adminCars"
        :admin-cars-loading="adminCarsLoading"
        :admin-cars-error="adminCarsError"
        :selected-admin-car-id="selectedAdminCarId"
        :register-admin-car-message="registerAdminCarMessage"
        :registering-admin-car="registeringAdminCar"
        :race-id="raceId"
        :race-status="raceStatus"
        :cars-in-race="cars"
        @refresh-admin-cars="fetchAdminCars"
        @update:selected-admin-car-id="(value) => (selectedAdminCarId = value)"
        @register-admin-car="handleRegisterAdminCarToRace"
      />

      <RaceUserRegisterCarCard
        v-if="user && user.role === 'user'"
        :user-cars="userCars"
        :user-cars-loading="userCarsLoading"
        :user-cars-error="userCarsError"
        :selected-user-car-id="selectedUserCarId"
        :register-user-car-message="registerUserCarMessage"
        :registering-user-car="registeringUserCar"
        :race-id="raceId"
        :race-status="raceStatus"
        :cars-in-race="cars"
        @refresh-user-cars="fetchUserCars"
        @update:selected-user-car-id="(value) => (selectedUserCarId = value)"
        @register-user-car="handleRegisterUserCarToRace"
      />

      <RaceLogsCard
        v-if="user && user.role === 'admin'"
        :replay-loading="replayLoading"
        :replay-error="replayError"
        :replay-logs="replayLogs"
        @replay-log="startReplay"
      />
    </div>
  </div>
</template>
