import { io, type Socket } from 'socket.io-client'
import { defineNuxtPlugin, useRuntimeConfig } from '#app'

declare module '#app' {
  interface NuxtApp {
    $socket: Socket
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $socket: Socket
  }
}

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const SOCKET_URL = config.public.apiBase || 'http://localhost:4000'
  const socket: Socket = io(SOCKET_URL, {
    autoConnect: true,
  })

  return {
    provide: {
      socket,
    },
  }
})
