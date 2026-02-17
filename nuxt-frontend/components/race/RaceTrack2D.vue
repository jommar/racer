<script setup lang="ts">
import { computed, ref } from "vue";
import Card from "~/components/ui/Card.vue";
import Button from "~/components/ui/Button.vue";
import RaceCar2D from "./RaceCar2D.vue";

interface CarAppearance {
  wheelSize?: "small" | "medium" | "large";
  wheelStyle?: "solid" | "rim";
  hasFlag?: boolean;
  flagColor?: string;
  number?: string | number;
  spriteKey?: string;
}

interface CarInRace {
  id: string;
  name: string;
  color: string;
   laneIndex?: number;
  appearance?: CarAppearance;
}

const props = defineProps<{
  cars: CarInRace[];
  progressByCar: Record<string, number>;
  raceStatus: "idle" | "ready" | "running" | "finished";
}>();

// Changing this seed will reshuffle car Y positions while keeping them
// evenly distributed overall.
const shuffleSeed = ref(0);

// Maximum number of vertical lanes we space across the track.
// This keeps existing cars stable when new cars join, since
// spacing no longer depends on the current car count.
const MAX_LANES = 8;

// Deterministic pseudo-random generator based on a string
function pseudoRandomFromString(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return (hash % 10000) / 10000; // 0 <= n < 1
}

const trackCars = computed(() => {
  // Add some left/right padding so cars are fully visible at start/finish
  const startX = 8;
  const endX = 112;
  const length = endX - startX;

  // Vertical band (in SVG units) where cars are allowed to appear
  const startY = 34;
  const endY = 66;
  const laneSlots = MAX_LANES;
  const spacing = (endY - startY) / laneSlots;

  return props.cars.map((car, index) => {
    const progress = Math.max(0, Math.min(1, props.progressByCar[car.id] ?? 0));
    const x = startX + progress * length;
    // If backend provided a laneIndex, use that for deterministic placement;
    // otherwise, fall back to index-based lanes with optional randomization.
    const rawLaneIndex =
      typeof car.laneIndex === "number" ? car.laneIndex : index;
    const laneIndex = Math.max(0, Math.min(laneSlots - 1, rawLaneIndex));
    const baseY = startY + (laneIndex + 0.5) * spacing;

    let y: number;
    if (typeof car.laneIndex === "number") {
      // Stable layout for live races and replays when laneIndex is logged.
      y = baseY;
    } else {
      // Legacy/randomized layout when no laneIndex is available.
      const randomFactor = pseudoRandomFromString(
        `${shuffleSeed.value}-${car.id}-${index}`,
      ); // 0..1
      const jitterAmplitude = spacing * 0.2;
      const jitter = (randomFactor - 0.5) * 2 * jitterAmplitude; // -amp..+amp
      y = Math.max(startY, Math.min(endY, baseY + jitter));
    }
    const rotation = 0;

    const appearance = car.appearance ?? {};
    const wheelSize = appearance.wheelSize ?? "medium";
    const wheelStyle = appearance.wheelStyle ?? "solid";
    const hasFlag = appearance.hasFlag ?? false;
    const flagColor = appearance.flagColor ?? "#f97316";
    const number = appearance.number;
    const spriteKey = appearance.spriteKey ?? "car1";

    const wheelRadiusMap: Record<"small" | "medium" | "large", number> = {
      small: 0.7,
      medium: 0.9,
      large: 1.1,
    };
    const wheelRadius = wheelRadiusMap[wheelSize] ?? wheelRadiusMap.medium;
    return {
      id: car.id,
      name: car.name,
      color: car.color || "#38bdf8",
      x,
      y,
      rotation,
      wheelRadius,
      wheelStyle,
      hasFlag,
      flagColor,
      number,
      spriteKey,
    };
  });
});

function shuffleLanes() {
  shuffleSeed.value++;
}
</script>

<template>
  <Card class="p-0 overflow-hidden">
    <div
      class="flex items-center justify-between px-4 pt-3 pb-2 text-xs text-slate-300"
    >
      <div class="flex items-center gap-2">
        <span class="font-medium text-slate-100">Race track (2D)</span>
        <span
          class="px-1.5 py-0.5 rounded-full bg-sky-500/10 text-[0.65rem] text-sky-300 uppercase tracking-wide"
        >
          Live
        </span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-[0.65rem] text-slate-400 capitalize"
          >Status: {{ raceStatus }}</span
        >
        <Button
          variant="ghost"
          size="sm"
          class="text-[0.65rem] px-2 py-1"
          @click="shuffleLanes"
        >
          Randomize lanes
        </Button>
      </div>
    </div>
    <div
      class="w-full h-64 sm:h-72 md:h-80 bg-slate-950/80 flex items-center justify-center"
    >
      <svg
        viewBox="0 0 120 100"
        preserveAspectRatio="xMidYMid slice"
        class="w-full h-full max-w-full max-h-full drop-shadow-[0_0_24px_rgba(15,23,42,0.95)]"
      >
        <!-- Debug markers to verify car positions -->
        <g fill="red" fill-opacity="0.7">
        </g>
        <RaceCar2D
          v-for="(car, index) in trackCars"
          :key="car.id + '-' + index"
          :car="car"
          :race-status="raceStatus"
        />
      </svg>
    </div>
  </Card>
</template>

<style scoped>
.car-group--running {
  animation: car-bob 0.4s ease-in-out infinite alternate;
}

.car-group--running .car-wheel {
  animation: wheel-spin 0.45s linear infinite;
  transform-box: fill-box;
  transform-origin: center;
}

.car-group--running .car-flag {
  animation: flag-wave 0.55s ease-in-out infinite alternate;
  transform-box: fill-box;
  transform-origin: 3.6px -6px;
}

@keyframes car-bob {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(-0.6px);
  }
}

@keyframes wheel-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes flag-wave {
  from {
    transform: skewX(0deg);
  }
  to {
    transform: skewX(-12deg);
  }
}
</style>
