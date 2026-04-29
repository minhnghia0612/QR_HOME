<script setup lang="ts">
import { ref, computed } from 'vue'
import { Eye, EyeOff, LogIn } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth.store'

const emit = defineEmits<{
  (e: 'success'): void
  (e: 'switch-mode'): void
}>()

const authStore = useAuthStore()

const loginForm = ref({ username: '', password: '' })
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')

const googleAuthUrl = String(import.meta.env.VITE_GOOGLE_AUTH_URL || '/api/auth/google').trim()
const isGoogleLoginEnabled = computed(() => Boolean(googleAuthUrl))

async function handleLogin() {
  loading.value = true
  error.value = ''
  const result = await authStore.login(loginForm.value.username, loginForm.value.password)
  if (result.success) {
    emit('success')
  } else {
    error.value = result.message || 'Invalid credentials'
    loading.value = false
  }
}

function handleGoogleAuth() {
  if (googleAuthUrl) {
    window.location.href = googleAuthUrl
    console.log('Redirecting to Google auth URL:', googleAuthUrl)
    return
  }
  error.value = 'Google login is not configured yet. Please use username/password for now.'
}
</script>

<template>
  <div class="relative">
    <!-- Header -->
    <div class="mb-8 text-center pt-4">
      <div class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-600 shadow-button">
        <span class="text-2xl font-black text-white">Q</span>
      </div>
      <h2 class="text-2xl font-black text-text-primary">Welcome Back</h2>
      <p class="mt-2 text-sm font-medium text-text-muted">
        Sign in to manage all your services
      </p>
    </div>

    <!-- Error -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="transform -translate-y-4 opacity-0"
      enter-to-class="transform translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="error" class="fixed top-8 left-1/2 -translate-x-1/2 z-[60] w-full max-w-sm px-4">
        <div class="rounded-2xl bg-[#0F172A] px-6 py-4 text-center text-sm font-bold text-white shadow-2xl ring-1 ring-white/10">
          <div class="flex items-center justify-center gap-3">
            <span class="flex h-5 w-5 items-center justify-center rounded-full bg-danger text-[10px] text-white">✕</span>
            {{ error }}
          </div>
        </div>
      </div>
    </Transition>

    <form @submit.prevent="handleLogin" class="space-y-4">
      <div>
        <label class="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-text-muted">Username</label>
        <input v-model="loginForm.username" type="text" placeholder="alex_wright" class="w-full rounded-2xl border-0 bg-[#F1F5F9] py-3.5 px-5 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary-600 transition-all" />
      </div>
      <div>
        <label class="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-text-muted">Password</label>
        <div class="relative">
          <input v-model="loginForm.password" :type="showPassword ? 'text' : 'password'" placeholder="••••••••" class="w-full rounded-2xl border-0 bg-[#F1F5F9] py-3.5 px-5 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary-600 transition-all" />
          <button type="button" @click="showPassword = !showPassword" class="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted">
            <Eye v-if="!showPassword" class="h-4 w-4" />
            <EyeOff v-else class="h-4 w-4" />
          </button>
        </div>
      </div>
      <button type="submit" :disabled="loading" class="w-full flex items-center justify-center gap-3 rounded-2xl bg-primary-600 py-4 text-sm font-black text-white shadow-button hover:brightness-110 active:scale-95 disabled:opacity-70 disabled:cursor-wait transition-all">
        <template v-if="!loading">
          <LogIn class="h-4 w-4" />
          Sign In
        </template>
        <template v-else>
          <div class="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
          Signing in...
        </template>
      </button>

      <template v-if="isGoogleLoginEnabled">
        <div class="relative py-1">
          <span class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-3 text-[11px] font-bold uppercase tracking-wide text-text-muted">or</span>
        </div>

        <button
          type="button"
          @click="handleGoogleAuth"
          class="w-full flex items-center justify-center gap-3 rounded-2xl border border-border bg-white py-3.5 text-sm font-bold text-text-primary shadow-sm transition-all hover:bg-surface-input active:scale-95"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-1.4 3.6-5.5 3.6-3.3 0-6-2.8-6-6.2s2.7-6.2 6-6.2c1.9 0 3.2.8 3.9 1.5l2.7-2.7C16.8 2.5 14.6 1.5 12 1.5 6.8 1.5 2.6 5.8 2.6 11s4.2 9.5 9.4 9.5c5.4 0 9-3.8 9-9.2 0-.6-.1-1-.2-1.4H12z"/>
          </svg>
          Continue with Google
        </button>
      </template>
    </form>

    <div class="mt-8 text-center text-sm font-medium">
      <span class="text-text-muted">Don't have an account? </span>
      <button @click="emit('switch-mode')" class="font-black text-primary-600 hover:underline">
        Sign Up
      </button>
    </div>
  </div>
</template>
