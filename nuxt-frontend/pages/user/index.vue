<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRouter } from '#app'
import Button from '~/components/ui/Button.vue'
import UserProfileCard from '~/components/user/UserProfileCard.vue'
import CreateCarForm from '~/components/user/CreateCarForm.vue'
import MyCarsTable from '~/components/user/MyCarsTable.vue'
import JoinLiveRaceCard from '~/components/user/JoinLiveRaceCard.vue'

interface User {
  id: string
  name: string
  username: string
  role: string
}

interface Car {
  id: string
  name: string
  color: string
  acceleration: number
  topSpeed: number
  handling: number
  createdAt?: string
}

interface RaceSummary {
  raceId: string
  status: string
  durationMs: number
  cars: number
}

const router = useRouter()
const { $socket } = useNuxtApp()

const user = ref<User | null>(null)

const cars = ref<Car[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const creating = ref(false)
const name = ref('')
const acceleration = ref(5)
const topSpeed = ref(200)
const handling = ref(0.7)

const races = ref<RaceSummary[]>([])
const racesLoading = ref(false)
const racesError = ref<string | null>(null)
const selectedRaceId = ref('')
const selectedCarId = ref('')
const raceIdInput = ref('')
const registering = ref(false)
const registerMessage = ref<string | null>(null)

const joinableRaces = computed<RaceSummary[]>(() =>
  races.value.filter((r) => r.status === 'idle' || r.status === 'ready'),
)

function attachSocketListeners() {
  const refresh = () => {
    // Keep races list in sync with server whenever race state changes.
    fetchRaces()
  }

  $socket.on('race:state', refresh)
  $socket.on('race:finished', refresh)
  $socket.on('race:close', refresh)
}

function detachSocketListeners() {
  $socket.off('race:state')
  $socket.off('race:finished')
  $socket.off('race:close')
}

async function fetchCars() {
  if (!user.value?.id) return
  try {
    loading.value = true
    error.value = null
    const res = await fetch(`http://localhost:4000/user/${encodeURIComponent(user.value.id)}/cars`, {
      credentials: 'include',
    })
    if (!res.ok) throw new Error('Failed to load cars')
    const data = await res.json()
    cars.value = Array.isArray(data.cars) ? data.cars : []
  } catch (err: any) {
    error.value = err?.message || 'Unable to load cars'
  } finally {
    loading.value = false
  }
}

async function fetchRaces() {
  try {
    racesLoading.value = true
    racesError.value = null
    const res = await fetch('http://localhost:4000/admin/race', {
      credentials: 'include',
    })
    if (!res.ok) throw new Error('Failed to load races')
    const data = await res.json()
    const list: RaceSummary[] = Array.isArray(data.races) ? data.races : []
    races.value = list
    if (!selectedRaceId.value && list.length > 0) {
      const joinable = list.find((r) => r.status === 'idle' || r.status === 'ready')
      if (joinable) selectedRaceId.value = joinable.raceId
    }
  } catch (err: any) {
    racesError.value = err?.message || 'Unable to load races'
  } finally {
    racesLoading.value = false
  }
}

async function handleCreateCar(e: Event) {
  if (!user.value?.id) return
  if (!name.value.trim()) return
  try {
    creating.value = true
    error.value = null
    const body = {
      name: name.value.trim(),
      color: randomColor(),
      acceleration: Number(acceleration.value) || 1,
      topSpeed: Number(topSpeed.value) || 1,
      handling: Math.min(1, Math.max(0, Number(handling.value) || 0.5)),
    }
    const res = await fetch(`http://localhost:4000/user/${encodeURIComponent(user.value.id)}/cars`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error('Failed to create car')
    const data = await res.json()
    if (data && data.car) {
      cars.value = [...cars.value, data.car]
      name.value = ''
    } else {
      await fetchCars()
    }
  } catch (err: any) {
    error.value = err?.message || 'Unable to create car'
  } finally {
    creating.value = false
  }
}

function randomColor() {
  const COLORS = ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#a855f7', '#f97316']
  return COLORS[Math.floor(Math.random() * COLORS.length)]
}

async function handleRegisterCarToRace(e: Event) {
  e.preventDefault()
  registerMessage.value = null

  if (!selectedCarId.value) {
    registerMessage.value = 'Select one of your cars first.'
    return
  }
  const inputId = raceIdInput.value.trim()
  const raceId = inputId || selectedRaceId.value.trim()
  if (!raceId) {
    registerMessage.value = 'Paste the race ID or pick one from the list.'
    return
  }

  registering.value = true
  const car = cars.value.find((c) => c.id === selectedCarId.value)
  if (!car) {
    registerMessage.value = 'Selected car not found.'
    registering.value = false
    return
  }
  try {
    // Verify the race is still idle/ready on the server.
    try {
      const res = await fetch(`http://localhost:4000/admin/race/${encodeURIComponent(raceId)}`, {
        credentials: 'include',
      })
      if (!res.ok) {
        registerMessage.value = 'Race not found or no longer available.'
        return
      }
      const data = await res.json()
      const status = (data as any)?.status ?? (data as any)?.race?.status
      if (status === 'running' || status === 'finished') {
        registerMessage.value = 'You can only register into races that are waiting to start.'
        return
      }
    } catch {
      registerMessage.value = 'Unable to verify race status.'
      return
    }

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

    $socket.emit('race:join', { raceId })
    $socket.emit('car:add', { raceId, car: payloadCar })

    registerMessage.value = `Registered "${car.name}" to race ${raceId}.`
  } catch (err: any) {
    registerMessage.value = err?.message || 'Failed to register car to race.'
  } finally {
    registering.value = false
  }
}

function useCarForLiveRace(carId: string) {
  selectedCarId.value = carId
  const car = cars.value.find((c) => c.id === carId)
  if (car) {
    registerMessage.value = `Selected "${car.name}" for live race. Pick a race and register.`
  }
}

async function loadUser() {
  try {
    const res = await fetch('http://localhost:4000/auth/me', {
      credentials: 'include',
    })
    if (!res.ok) {
      router.push('/login?redirect=/user')
      return
    }
    const data = await res.json()
    const me = data?.user as User | undefined
    if (!me) {
      router.push('/login?redirect=/user')
      return
    }
    user.value = me
  } catch {
    router.push('/login?redirect=/user')
  }
}

async function handleLogout() {
  try {
    await fetch('http://localhost:4000/auth/logout', {
      method: 'POST',
      credentials: 'include',
    })
  } catch {}
  router.push('/login')
}

onMounted(async () => {
  await loadUser()
  if (!user.value) return
  fetchCars()
  fetchRaces()
  attachSocketListeners()
})

onBeforeUnmount(() => {
  detachSocketListeners()
})
</script>

<template>
  <div class="min-h-screen text-slate-50 flex justify-center items-start py-8 px-4 overflow-y-auto">
    <div class="w-full max-w-5xl">
      <header class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight">User dashboard</h1>
          <p class="text-xs text-slate-400 mt-1">Manage your garage and join live races.</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          class="text-xs px-3 py-1"
          @click="handleLogout"
        >
          Logout
        </Button>
      </header>

      <section class="mb-8 space-y-6">
        <div class="grid gap-4 md:grid-cols-2">
          <UserProfileCard :user="user" />

          <CreateCarForm
            :name="name"
            :acceleration="acceleration"
            :top-speed="topSpeed"
            :handling="handling"
            :creating="creating"
            :error="error"
            @update:name="val => (name = val)"
            @update:acceleration="val => (acceleration = val)"
            @update:topSpeed="val => (topSpeed = val)"
            @update:handling="val => (handling = val)"
            @submit="handleCreateCar($event as any)"
          />
        </div>

        <MyCarsTable
          :cars="cars"
          :loading="loading"
          @refresh="fetchCars"
          @use-car="useCarForLiveRace"
        />

        <JoinLiveRaceCard
          :joinable-races="joinableRaces"
          :cars="cars"
          :selected-race-id="selectedRaceId"
          :selected-car-id="selectedCarId"
          :race-id-input="raceIdInput"
          :races-loading="racesLoading"
          :races-error="racesError"
          :registering="registering"
          :register-message="registerMessage"
          @refresh-races="fetchRaces"
          @update:selectedRaceId="val => (selectedRaceId = val)"
          @update:selectedCarId="val => (selectedCarId = val)"
          @update:raceIdInput="val => (raceIdInput = val)"
          @submit="handleRegisterCarToRace($event as any)"
        />
      </section>
    </div>
  </div>
</template>
