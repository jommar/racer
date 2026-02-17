import { io, type Socket } from 'socket.io-client'
import { defineNuxtPlugin } from '#app'

const SOCKET_URL = 'http://localhost:4000'

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
  const socket: Socket = io(SOCKET_URL, {
    autoConnect: true,
  })

  return {
    provide: {
      socket,
    },
  }
})
