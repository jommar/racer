<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  modelValue?: string | number;
  class?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const base =
  "w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 shadow-inner shadow-slate-950/40 focus:outline-none focus:ring-2 focus:ring-sky-500/60 focus:border-sky-500 transition-colors duration-150 ease-out hover:border-slate-500";

const classes = computed(() => [base, props.class].filter(Boolean).join(" "));

function onInput(event: Event) {
  const target = event.target as HTMLInputElement | null;
  emit("update:modelValue", target?.value ?? "");
}
</script>

<template>
  <input
    :class="classes"
    :value="props.modelValue"
    @input="onInput"
    v-bind="$attrs"
  />
</template>
