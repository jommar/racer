<script setup lang="ts">
import { computed } from 'vue'
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

const laneCenters = computed(() => {
	const laneCount = Math.max(props.cars.length, 1)
	const startY = 25
	const endY = 75
	const spacing = (endY - startY) / laneCount

	return Array.from({ length: laneCount }, (_, index) => startY + (index + 0.5) * spacing)
})

const trackCars = computed(() => {
	const startX = 0
	const endX = 120
	const length = endX - startX

	return props.cars.map((car, index) => {
		const progress = Math.max(0, Math.min(1, props.progressByCar[car.id] ?? 0))
		const x = startX + progress * length
		const y = laneCenters.value[index] ?? 50
		const rotation = 0

		return {
			id: car.id,
			name: car.name,
			color: car.color || '#38bdf8',
			x,
			y,
			rotation,
		}
	})
})
</script>

<template>
	<Card class="p-0 overflow-hidden">
		<div class="flex items-center justify-between px-4 pt-3 pb-2 text-xs text-slate-300">
			<div class="flex items-center gap-2">
				<span class="font-medium text-slate-100">Race track (2D)</span>
				<span class="px-1.5 py-0.5 rounded-full bg-sky-500/10 text-[0.65rem] text-sky-300 uppercase tracking-wide">
					Live
				</span>
			</div>
			<span class="text-[0.65rem] text-slate-400 capitalize">Status: {{ raceStatus }}</span>
		</div>
		<div class="w-full h-64 sm:h-72 md:h-80 bg-slate-950/80 flex items-center justify-center">
			<svg
				viewBox="0 0 120 100"
				preserveAspectRatio="none"
				class="w-full h-[85%] max-w-full max-h-full drop-shadow-[0_0_24px_rgba(15,23,42,0.95)]"
			>
				<defs>
					<radialGradient id="trackGlow" cx="50%" cy="50%" r="60%">
						<stop offset="0%" stop-color="#0f172a" />
						<stop offset="70%" stop-color="#020617" />
						<stop offset="100%" stop-color="#000000" />
					</radialGradient>
					<linearGradient id="trackLane" x1="0%" y1="0%" x2="100%" y2="0%">
						<stop offset="0%" stop-color="#22c55e" />
						<stop offset="100%" stop-color="#0ea5e9" />
					</linearGradient>
				</defs>

				<rect
					x="0"
					y="20"
					width="120"
					rx="8"
					ry="8"
					fill="url(#trackGlow)"
					stroke="#020617"
					stroke-width="1.5"
				/>

				<rect
					x="0"
					y="25"
					width="120"
					height="50"
					rx="6"
					ry="6"
					fill="#020617"
					stroke="#0f172a"
					stroke-width="2.5"
				/>

				<g v-for="(laneY, laneIndex) in laneCenters" :key="laneIndex">
					<line
						x1="0"
						y1="laneY"
						x2="120"
						y2="laneY"
						stroke="url(#trackLane)"
						stroke-width="1.4"
						stroke-linecap="round"
						stroke-dasharray="3 5"
					/>
				</g>

				<g>
					<rect x="0" y="25" width="4" height="50" fill="#e5e7eb" fill-opacity="0.9" />
					<path d="M4 25 h8 v3 h-8 z" fill="#0f172a" />
					<path d="M4 72 h8 v3 h-8 z" fill="#0f172a" />
				</g>

				<g v-for="car in trackCars" :key="car.id">
					<g
						:transform="`translate(${car.x}, ${car.y}) rotate(${car.rotation})`"
						class="transition-transform duration-150 ease-out"
					>
						<rect
							x="-4.5"
							y="-3.2"
							width="9"
							height="6.4"
							rx="1.4"
							ry="1.4"
							:fill="car.color"
							stroke="#020617"
							stroke-width="0.3"
						/>
						<rect
							x="-3.4"
							y="-1.4"
							width="6.8"
							height="2.8"
							rx="0.7"
							ry="0.7"
							fill="#020617"
							stroke="#0ea5e9"
							stroke-width="0.25"
						/>
						<rect x="-4.5" y="-3" width="1.4" height="6" fill="#020617" />
						<rect x="3.1" y="-3" width="1.4" height="6" fill="#020617" />
						<circle cx="-4.5" cy="-3" r="0.9" fill="#0f172a" />
						<circle cx="4.5" cy="-3" r="0.9" fill="#0f172a" />
						<circle cx="-4.5" cy="3" r="0.9" fill="#0f172a" />
						<circle cx="4.5" cy="3" r="0.9" fill="#0f172a" />
						<circle cx="-3.4" cy="-3.1" r="0.6" fill="#facc15" fill-opacity="0.98" />
						<circle cx="3.4" cy="-3.1" r="0.6" fill="#facc15" fill-opacity="0.98" />
					</g>
				</g>
			</svg>
		</div>
	</Card>
</template>
