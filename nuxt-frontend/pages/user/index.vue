<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from '#app'
import Card from '~/components/ui/Card.vue'
import Button from '~/components/ui/Button.vue'
import TextField from '~/components/ui/TextField.vue'

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
const registering = ref(false)
const registerMessage = ref<string | null>(null)

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
  e.preventDefault()
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

function handleRegisterCarToRace(e: Event) {
  e.preventDefault()
  registerMessage.value = null

  if (!selectedRaceId.value) {
    registerMessage.value = 'Select a live race first.'
    return
  }
  if (!selectedCarId.value) {
    registerMessage.value = 'Select one of your cars to register.'
    return
  }

  const car = cars.value.find((c) => c.id === selectedCarId.value)
  if (!car) {
    registerMessage.value = 'Selected car not found.'
    return
  }

  registering.value = true
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

    $socket.emit('race:join', { raceId: selectedRaceId.value })
    $socket.emit('car:add', { raceId: selectedRaceId.value, car: payloadCar })

    registerMessage.value = `Registered "${car.name}" to race ${selectedRaceId.value}.`
  } catch (err: any) {
    registerMessage.value = err?.message || 'Failed to register car to race.'
  } finally {
    registering.value = false
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
          <Card>
            <h2 class="text-sm font-semibold mb-2">Profile</h2>
            <dl class="text-xs text-slate-300 space-y-1">
              <div class="flex justify-between">
                <dt class="text-slate-400">Name</dt>
                <dd>{{ user?.name }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-400">Username</dt>
                <dd>{{ user?.username }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-400">Role</dt>
                <dd class="uppercase tracking-widest text-[0.6rem] text-slate-400">{{ user?.role }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-400">User ID</dt>
                <dd class="text-[0.6rem] text-slate-500 truncate max-w-[12rem] text-right">{{ user?.id }}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <h2 class="text-sm font-semibold mb-2">Create a garage car</h2>
            <p class="text-[0.7rem] text-slate-400 mb-3">
              Cars created here are stored in the database and associated with your account.
            </p>
            <form class="space-y-2 text-[0.7rem]" @submit="handleCreateCar">
              <div class="flex flex-col gap-1">
                <label class="text-slate-300">Car name</label>
                <TextField
                  type="text"
                  v-model="name"
                  class="py-1 text-xs"
                  placeholder="e.g. Thunderbolt"
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
                    v-model="acceleration"
                    class="py-1 text-xs"
                  />
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-slate-300">Top speed</label>
                  <TextField
                    type="number"
                    min="50"
                    max="400"
                    step="10"
                    v-model="topSpeed"
                    class="py-1 text-xs"
                  />
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-slate-300">Handling</label>
                  <TextField
                    type="number"
                    min="0"
                    max="1"
                    step="0.05"
                    v-model="handling"
                    class="py-1 text-xs"
                  />
                </div>
              </div>
              <p v-if="error" class="text-[0.65rem] text-rose-300">{{ error }}</p>
              <Button
                type="submit"
                :disabled="creating"
                size="sm"
                class="mt-1 text-[0.7rem]"
              >
                {{ creating ? 'Creating…' : 'Create car' }}
              </Button>
            </form>
          </Card>
        </div>

        <Card>
          <div class="flex items-center justify-between mb-2">
            <h2 class="text-sm font-semibold">My cars</h2>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              class="text-[0.7rem] px-2 py-1"
              @click="fetchCars"
            >
              Refresh
            </Button>
          </div>
          <p v-if="loading" class="text-[0.75rem] text-slate-400">Loading cars…</p>
          <p v-else-if="cars.length === 0" class="text-[0.75rem] text-slate-400">
            No cars yet. Create one above to start your garage.
          </p>
          <div v-else class="overflow-x-auto">
            <table class="min-w-full text-[0.7rem] text-left text-slate-200">
              <thead class="text-[0.65rem] uppercase tracking-wide text-slate-400 border-b border-slate-800">
                <tr>
                  <th class="py-2 pr-3">Name</th>
                  <th class="py-2 pr-3">Color</th>
                  <th class="py-2 pr-3">Accel</th>
                  <th class="py-2 pr-3">Top speed</th>
                  <th class="py-2 pr-3">Handling</th>
                  <th class="py-2 pr-3">Created</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="car in cars"
                  :key="car.id"
                  class="border-b border-slate-800/60 last:border-0"
                >
                  <td class="py-1 pr-3 font-medium">{{ car.name }}</td>
                  <td class="py-1 pr-3">
                    <span class="inline-flex items-center gap-1">
                      <span
                        class="w-3 h-3 rounded-full border border-slate-700"
                        :style="{ backgroundColor: car.color }"
                      />
                      <span class="text-[0.65rem] text-slate-400">{{ car.color }}</span>
                    </span>
                  </td>
                  <td class="py-1 pr-3">{{ car.acceleration }}</td>
                  <td class="py-1 pr-3">{{ car.topSpeed }}</td>
                  <td class="py-1 pr-3">{{ car.handling }}</td>
                  <td class="py-1 pr-3 text-[0.6rem] text-slate-500">
                    {{ car.createdAt ? new Date(car.createdAt).toLocaleString() : '—' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <div class="flex items-center justify-between mb-2">
            <h2 class="text-sm font-semibold">Join a live race</h2>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              class="text-[0.7rem] px-2 py-1"
              @click="fetchRaces"
            >
              Refresh races
            </Button>
          </div>
          <p class="text-[0.7rem] text-slate-400 mb-3">
            Pick one of your cars and register it into a live race created by an admin.
          </p>
          <p v-if="racesLoading" class="text-[0.75rem] text-slate-400">Loading races…</p>
          <p v-else-if="racesError" class="text-[0.7rem] text-rose-300">{{ racesError }}</p>
          <p v-else-if="races.length === 0" class="text-[0.75rem] text-slate-400">
            No live races are currently available.
          </p>
          <form
            v-else
            class="space-y-3 text-[0.7rem]"
            @submit="handleRegisterCarToRace"
          >
            <div class="grid gap-3 md:grid-cols-2">
              <div class="flex flex-col gap-1">
                <label class="text-slate-300">Live race</label>
                <select
                  v-model="selectedRaceId"
                  class="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="">Select a race…</option>
                  <option
                    v-for="race in races"
                    :key="race.raceId"
                    :value="race.raceId"
                  >
                    {{ race.raceId }} — {{ race.status }} ({{ Math.round((race.durationMs || 0) / 1000) }}s, {{ race.cars }} cars)
                  </option>
                </select>
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-slate-300">Your car</label>
                <select
                  v-model="selectedCarId"
                  class="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="">Select one of your cars…</option>
                  <option
                    v-for="car in cars"
                    :key="car.id"
                    :value="car.id"
                  >
                    {{ car.name }} (acc {{ car.acceleration }}, top {{ car.topSpeed }}, handling {{ car.handling }})
                  </option>
                </select>
              </div>
            </div>
            <p v-if="registerMessage" class="text-[0.65rem] text-slate-300">{{ registerMessage }}</p>
            <Button
              type="submit"
              :disabled="registering || cars.length === 0 || races.length === 0"
              size="sm"
              class="text-[0.7rem]"
              variant="primary"
            >
              {{ registering ? 'Registering…' : 'Register car to race' }}
            </Button>
          </form>
        </Card>
      </section>
    </div>
  </div>
</template>
