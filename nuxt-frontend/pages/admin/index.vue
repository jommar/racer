<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from '#app'
import AppHeader from '~/components/AppHeader.vue'
import AdminOverviewCard from '~/components/admin/AdminOverviewCard.vue'
import AdminActiveRacesSection from '~/components/admin/AdminActiveRacesSection.vue'
import AdminRaceDetailsSection from '~/components/admin/AdminRaceDetailsSection.vue'
import AdminRaceHistorySection from '~/components/admin/AdminRaceHistorySection.vue'
import AdminUsersCard from '~/components/admin/AdminUsersCard.vue'
import AdminCarsCard from '~/components/admin/AdminCarsCard.vue'

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

const newRaceDurationSeconds = ref<number | string>(10)
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
          <AdminOverviewCard
            :loading="loading"
            :error="error"
            :races="races"
            :race-history="raceHistory"
            :users-count="users.length"
            :cars-count="cars.length"
            :new-race-duration-seconds="newRaceDurationSeconds"
            @refresh-admin-data="fetchAdminData"
            @update:new-race-duration-seconds="(value) => (newRaceDurationSeconds = value)"
          >
            <template #create-race>
              <button
                type="button"
                class="inline-flex items-center justify-center rounded-md bg-sky-600 px-3 py-1 text-[0.8rem] font-medium text-white shadow-sm hover:bg-sky-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="creatingRace"
                @click="handleCreateRace"
              >
                {{ creatingRace ? 'Creating race…' : 'Create race' }}
              </button>
              <p v-if="createRaceError" class="text-[0.7rem] text-rose-300 mt-1">{{ createRaceError }}</p>
            </template>

            <div class="space-y-3">
              <AdminActiveRacesSection
                :races="races"
                :selected-race-id="selectedRaceId"
                @select-race="(id) => (selectedRaceId = id)"
                @view-race="handleViewRace"
                @close-race="handleCloseRace"
                @start-race="handleStartRace"
              />

              <AdminRaceDetailsSection
                :selected-race-id="selectedRaceId"
                :race-details-loading="raceDetailsLoading"
                :race-details-error="raceDetailsError"
                :selected-race-details="selectedRaceDetails"
              />

              <AdminRaceHistorySection :race-history="raceHistory" />
            </div>
          </AdminOverviewCard>
        </section>

        <section class="space-y-4">
          <AdminUsersCard :users="users" />
          <AdminCarsCard :cars="cars" />
        </section>
      </main>
    </div>
  </div>
</template>
