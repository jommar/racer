<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from '#app'
import LoginView from '~/components/LoginView.vue'

interface User {
  id: string
  name: string
  username: string
  role: 'admin' | 'user' | string
}

const router = useRouter()
const route = useRoute()
const checkingSession = ref(true)

async function checkSession() {
  try {
    const res = await fetch('http://localhost:4000/auth/me', {
      credentials: 'include',
    })
    if (res.ok) {
      const data = await res.json()
      const user = data?.user as User | undefined
      if (user) {
        redirectAfterLogin(user)
        return
      }
    }
  } catch {
    // ignore, user will see login
  } finally {
    checkingSession.value = false
  }
}

function redirectAfterLogin(user: User) {
  const redirect = (route.query.redirect as string | undefined) || null
  if (redirect) {
    router.push(redirect)
    return
  }
  if (user.role === 'admin') {
    router.push('/admin')
  } else {
    router.push('/user')
  }
}

function handleLoginSuccess(user: User) {
  redirectAfterLogin(user)
}

onMounted(() => {
  checkSession()
})
</script>

<template>
  <div>
    <LoginView v-if="!checkingSession" @login-success="handleLoginSuccess" />
  </div>
</template>
