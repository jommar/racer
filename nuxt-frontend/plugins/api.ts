import axios, { type AxiosInstance } from 'axios'
import { defineNuxtPlugin, useRuntimeConfig } from '#app'

declare module '#app' {
  interface NuxtApp {
    $api: AxiosInstance
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $api: AxiosInstance
  }
}

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  const api = axios.create({
    baseURL: config.public.apiBase || 'http://localhost:4000',
    withCredentials: true,
  })

  // You can add interceptors here (e.g. auth, logging) if needed.
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      return Promise.reject(error)
    },
  )

  return {
    provide: {
      api,
    },
  }
})
