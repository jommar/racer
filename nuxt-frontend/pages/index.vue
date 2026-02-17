<script setup lang="ts">
const features = [
  'Live race monitoring',
  'Admin and user views',
  'Replay and results',
]
</script>

<template>
  <section class="space-y-8">
    <div>
      <h2 class="text-3xl font-semibold tracking-tight">Nuxt Frontend</h2>
      <p class="mt-2 max-w-xl text-sm text-slate-300">
        This is a Vue/Nuxt alternative frontend for the Racer app, living
        alongside the existing React/Vite implementation.
      </p>
    </div>

    <div class="grid gap-4 sm:grid-cols-3">
      <article
        v-for="item in features"
        :key="item"
        class="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm shadow-slate-950/40"
      >
        <h3 class="text-sm font-medium text-slate-100">
          {{ item }}
        </h3>
      </article>
    </div>

    <div class="mt-4 text-xs text-slate-400">
      <p>
        To start this frontend locally, run
        <span class="font-mono text-slate-200">npm install</span>
        and
        <span class="font-mono text-slate-200">npm run dev</span>
        inside the <span class="font-mono text-slate-200">nuxt-frontend</span>
        directory.
      </p>
    </div>
  </section>
</template>
