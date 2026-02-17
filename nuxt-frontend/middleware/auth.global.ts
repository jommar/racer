import { defineNuxtRouteMiddleware, navigateTo, useRequestURL } from '#app'

export default defineNuxtRouteMiddleware(async (to) => {
  // Do not guard the login page itself.
  if (to.path === '/login') {
    return
  }

  const isProtected =
    to.path.startsWith('/admin') ||
    to.path.startsWith('/user') ||
    to.path.startsWith('/race')

  if (!isProtected) {
    return
  }

  // Simple client-side check using the backend's /auth/me endpoint.
  // Guard against running on the server by checking window.
  if (typeof window === 'undefined') {
    return
  }

  try {
    const res = await fetch('http://localhost:4000/auth/me', {
      credentials: 'include',
    })
    if (!res.ok) {
      const redirect = encodeURIComponent(to.fullPath || '/')
      return navigateTo(`/login?redirect=${redirect}`)
    }
    const data = await res.json()
    if (!data || !data.user) {
      const redirect = encodeURIComponent(to.fullPath || '/')
      return navigateTo(`/login?redirect=${redirect}`)
    }
  } catch {
    const redirect = encodeURIComponent(to.fullPath || '/')
    return navigateTo(`/login?redirect=${redirect}`)
  }
})
