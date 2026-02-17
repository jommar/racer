<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import * as THREE from 'three'
import Card from '~/components/ui/Card.vue'

interface CarInRace {
  id: string
  name: string
  color: string
}

const props = defineProps<{
  cars: CarInRace[]
  progressByCar: Record<string, number>
  raceStatus: 'idle' | 'ready' | 'running' | 'finished'
}>()

const containerRef = ref<HTMLElement | null>(null)

let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let renderer: THREE.WebGLRenderer | null = null
let animationFrameId: number | null = null

const carGroups = new Map<string, THREE.Group>()

const TRACK_RADIUS = 6

function initScene() {
  const container = containerRef.value
  if (!container) return

  const width = container.clientWidth || 600
  const height = container.clientHeight || 320

  scene = new THREE.Scene()
  scene.background = new THREE.Color('#020617')

  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
  camera.position.set(0, 10, 14)
  camera.lookAt(new THREE.Vector3(0, 0, 0))

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.shadowMap.enabled = true
  container.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
  dirLight.position.set(5, 10, 7)
  dirLight.castShadow = true
  scene.add(dirLight)

  const groundGeo = new THREE.PlaneGeometry(40, 40)
  const groundMat = new THREE.MeshStandardMaterial({ color: '#020617' })
  const ground = new THREE.Mesh(groundGeo, groundMat)
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)

  const trackOuter = new THREE.RingGeometry(TRACK_RADIUS - 0.4, TRACK_RADIUS + 0.4, 96)
  const trackMat = new THREE.MeshStandardMaterial({
    color: '#0f172a',
    emissive: '#22c55e',
    emissiveIntensity: 0.15,
    side: THREE.DoubleSide,
  })
  const track = new THREE.Mesh(trackOuter, trackMat)
  track.rotation.x = -Math.PI / 2
  track.receiveShadow = true
  scene.add(track)

  const innerMat = new THREE.MeshStandardMaterial({ color: '#020617', side: THREE.DoubleSide })
  const inner = new THREE.Mesh(new THREE.CircleGeometry(TRACK_RADIUS - 0.4, 96), innerMat)
  inner.rotation.x = -Math.PI / 2
  inner.receiveShadow = true
  scene.add(inner)

  const centerTowerGeo = new THREE.CylinderGeometry(0.35, 0.6, 1.8, 24)
  const centerTowerMat = new THREE.MeshStandardMaterial({ color: '#020617', emissive: '#38bdf8', emissiveIntensity: 0.4 })
  const centerTower = new THREE.Mesh(centerTowerGeo, centerTowerMat)
  centerTower.position.set(0, 0.9, 0)
  centerTower.castShadow = true
  centerTower.receiveShadow = true
  scene.add(centerTower)

  const laneMarkerMat = new THREE.MeshBasicMaterial({ color: '#e5e7eb' })
  for (let i = 0; i < 32; i++) {
    const angle = (i / 32) * Math.PI * 2
    const markerRadius = TRACK_RADIUS + 0.42
    const mx = Math.cos(angle) * markerRadius
    const mz = Math.sin(angle) * markerRadius
    const markerGeo = new THREE.PlaneGeometry(0.18, 0.06)
    const marker = new THREE.Mesh(markerGeo, laneMarkerMat)
    marker.rotation.x = -Math.PI / 2
    marker.position.set(mx, 0.01, mz)
    scene.add(marker)
  }

  updateCars()
  renderScene()

  const handleResize = () => {
    if (!renderer || !camera || !containerRef.value) return
    const w = containerRef.value.clientWidth || 600
    const h = containerRef.value.clientHeight || 320
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
    renderScene()
  }

  window.addEventListener('resize', handleResize)

  ;(container as any)._onResize = handleResize
}

function renderScene() {
  if (!renderer || !scene || !camera) return
  renderer.render(scene, camera)
}

function updateCars() {
  if (!scene) return

  const existingIds = new Set(carGroups.keys())
  const nextIds = new Set(props.cars.map((c) => c.id))

  for (const id of existingIds) {
    if (!nextIds.has(id)) {
      const group = carGroups.get(id)
      if (group) {
        scene.remove(group)
      }
      carGroups.delete(id)
    }
  }

  for (const car of props.cars) {
    let group = carGroups.get(car.id)
    if (!group) {
      group = new THREE.Group()

      const bodyGeo = new THREE.BoxGeometry(0.7, 0.35, 1.4)
      const bodyMat = new THREE.MeshStandardMaterial({ color: car.color || '#38bdf8', metalness: 0.2, roughness: 0.4 })
      const body = new THREE.Mesh(bodyGeo, bodyMat)
      body.position.y = 0.35
      body.castShadow = true
      body.receiveShadow = true
      group.add(body)

      const cabinGeo = new THREE.BoxGeometry(0.45, 0.25, 0.6)
      const cabinMat = new THREE.MeshStandardMaterial({ color: '#020617', emissive: '#0ea5e9', emissiveIntensity: 0.3 })
      const cabin = new THREE.Mesh(cabinGeo, cabinMat)
      cabin.position.set(0, 0.6, 0.1)
      cabin.castShadow = true
      group.add(cabin)

      const wheelGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.18, 16)
      const wheelMat = new THREE.MeshStandardMaterial({ color: '#020617' })

      const wheelPositions: [number, number, number][] = [
        [-0.28, 0.18, 0.48],
        [0.28, 0.18, 0.48],
        [-0.28, 0.18, -0.48],
        [0.28, 0.18, -0.48],
      ]

      for (const [wx, wy, wz] of wheelPositions) {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat)
        wheel.rotation.z = Math.PI / 2
        wheel.position.set(wx, wy, wz)
        wheel.castShadow = true
        group.add(wheel)
      }

      group.castShadow = true
      group.receiveShadow = true

      carGroups.set(car.id, group)
      scene.add(group)
    }
    updateCarPosition(car.id)
  }

  renderScene()
}

function updateCarPosition(carId: string) {
  const group = carGroups.get(carId)
  if (!group) return

  const progress = Math.max(0, Math.min(1, props.progressByCar[carId] ?? 0))
  const angle = progress * Math.PI * 2
  const radius = TRACK_RADIUS

  const x = Math.cos(angle) * radius
  const z = Math.sin(angle) * radius

  group.position.set(x, 0, z)
  group.rotation.y = -angle + Math.PI / 2
}

function animate() {
  if (!scene || !camera || !renderer) return

  animationFrameId = requestAnimationFrame(animate)

  if (props.raceStatus === 'running') {
    camera.position.x = Math.cos(Date.now() * 0.0002) * 12
    camera.position.z = Math.sin(Date.now() * 0.0002) * 16
    camera.lookAt(new THREE.Vector3(0, 0, 0))
  }

  renderScene()
}

function disposeScene() {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }

  const container = containerRef.value
  if (container && (container as any)._onResize) {
    window.removeEventListener('resize', (container as any)._onResize)
  }

  carGroups.clear()

  if (renderer) {
    renderer.dispose()
    if (renderer.domElement && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement)
    }
  }

  scene = null
  camera = null
  renderer = null
}

onMounted(() => {
  if (typeof window === 'undefined') return
  initScene()
  animate()
})

onBeforeUnmount(() => {
  disposeScene()
})

watch(
  () => props.cars,
  () => {
    updateCars()
  },
  { deep: true }
)

watch(
  () => props.progressByCar,
  () => {
    for (const carId of Object.keys(props.progressByCar)) {
      updateCarPosition(carId)
    }
    renderScene()
  },
  { deep: true }
)
</script>

<template>
  <Card class="p-0 overflow-hidden">
    <div class="flex items-center justify-between px-4 pt-3 pb-2 text-xs text-slate-300">
      <div class="flex items-center gap-2">
        <span class="font-medium text-slate-100">Race track (3D)</span>
        <span class="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-[0.65rem] text-emerald-300 uppercase tracking-wide">
          Experimental
        </span>
      </div>
      <span class="text-[0.65rem] text-slate-400 capitalize">Status: {{ raceStatus }}</span>
    </div>
    <div ref="containerRef" class="w-full h-64 sm:h-72 md:h-80"></div>
  </Card>
</template>
