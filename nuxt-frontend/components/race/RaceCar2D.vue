<script setup lang="ts">
import { computed } from "vue";
import { getSpriteForKey } from "./raceSprites";

interface TrackCarViewModel {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  rotation: number;
  wheelRadius: number;
  wheelStyle: "solid" | "rim";
  hasFlag: boolean;
  flagColor: string;
  number?: string | number;
  spriteKey?: string;
}

const { car, raceStatus } = defineProps<{
  car: TrackCarViewModel;
  raceStatus: "idle" | "ready" | "running" | "finished";
}>();

const spriteDef = computed(() => getSpriteForKey(car.spriteKey));

// target on-track height in SVG units; width is derived from sprite aspect
const CAR_DISPLAY_HEIGHT = 10;
const scale = computed(() => CAR_DISPLAY_HEIGHT / spriteDef.value.height);

const spriteImageTransform = computed(() => {
  const s = spriteDef.value;
  const centerX = s.x + s.width / 2;
  const centerY = s.y + s.height / 2;
  return `translate(${-centerX}, ${-centerY})`;
});
</script>

<template>
  <g :transform="`translate(${car.x}, ${car.y}) rotate(${car.rotation})`">
    <!-- Shift the sprite so car.x/y refers to the car's center, not its tip -->
    <g :transform="`translate(${-CAR_DISPLAY_HEIGHT / 2}, 0)`">
      <g
        class="car-group"
        :class="{ 'car-group--running': raceStatus === 'running' }"
      >
        <g :transform="`scale(${scale}) rotate(-90)`">
          <defs>
            <clipPath :id="`car-clip-${car.id}`">
              <rect
                :x="-spriteDef.width / 2"
                :y="-spriteDef.height / 2"
                :width="spriteDef.width"
                :height="spriteDef.height"
              />
            </clipPath>
          </defs>
          <g :clip-path="`url(#car-clip-${car.id})`">
            <image
              :href="spriteDef.sheet"
              :width="spriteDef.sheetWidth"
              :height="spriteDef.sheetHeight"
              :transform="spriteImageTransform"
            />
          </g>
        </g>
      </g>
    </g>
  </g>
</template>

<style scoped>
.car-group--running {
  animation: car-bob 0.4s ease-in-out infinite alternate;
}

@keyframes car-bob {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(-0.6px);
  }
}
</style>
