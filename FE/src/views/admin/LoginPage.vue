<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { Eye, EyeOff, LogIn } from 'lucide-vue-next'
import { qrConfigApi } from '@/api/qr-config.api'
import { categoriesApi } from '@/api/categories.api'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  if (!username.value || !password.value) {
    error.value = 'Please enter username and password'
    return
  }
  loading.value = true
  error.value = ''
  try {
    await authStore.login(username.value, password.value)
    
    // Check if system is set up
    const { data: configData } = await qrConfigApi.getConfig()
    const { data: catsData } = await categoriesApi.getAll()
    
    const isConfigured = !!configData.data?.spaName
    const hasCategories = catsData.data?.length > 0
    
    if (!isConfigured) {
      router.push('/admin/qr')
    } else if (!hasCategories) {
      router.push('/admin/categories')
    } else {
      router.push('/admin/dashboard')
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Login failed. Please check your credentials.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-surface-page px-4">
    <div class="w-full max-w-sm">
      <!-- Logo -->
      <div class="mb-8 text-center">
        <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-b from-primary-600 to-[#0048B5] shadow-button">
          <span class="text-2xl font-black text-white">Q</span>
        </div>
        <h1 class="text-2xl font-extrabold tracking-tight text-text-primary">QRHome Admin</h1>
        <p class="mt-1 text-sm text-text-secondary">Sign in to manage your spa</p>
      </div>

      <!-- Card -->
      <div class="rounded-3xl bg-white p-8 shadow-card">
        <form @submit.prevent="handleLogin" class="space-y-5">
          <!-- Error -->
          <div v-if="error" class="rounded-xl bg-danger/10 p-3 text-center text-sm font-medium text-danger">
            {{ error }}
          </div>

          <!-- Username -->
          <div>
            <label class="mb-1.5 block text-sm font-medium text-text-secondary">Username</label>
            <input
              v-model="username"
              type="text"
              placeholder="admin"
              autocomplete="username"
              class="w-full rounded-lg border-0 bg-surface-input px-4 py-3 text-sm text-text-primary outline-none ring-1 ring-transparent placeholder:text-text-muted focus:ring-2 focus:ring-primary-600"
            />
          </div>

          <!-- Password -->
          <div>
            <label class="mb-1.5 block text-sm font-medium text-text-secondary">Password</label>
            <div class="relative">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                autocomplete="current-password"
                class="w-full rounded-lg border-0 bg-surface-input px-4 py-3 pr-11 text-sm text-text-primary outline-none ring-1 ring-transparent placeholder:text-text-muted focus:ring-2 focus:ring-primary-600"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                @click="showPassword = !showPassword"
              >
                <Eye v-if="!showPassword" class="h-4 w-4" />
                <EyeOff v-else class="h-4 w-4" />
              </button>
            </div>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="loading"
            class="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-primary-600 to-[#0048B5] py-3.5 text-sm font-extrabold text-white shadow-button transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
          >
            <LogIn v-if="!loading" class="h-4 w-4" />
            <span v-if="loading" class="animate-spin">⏳</span>
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <div class="mt-8 text-center text-sm font-medium">
          <span class="text-text-muted">Don't have an account? </span>
          <RouterLink to="/admin/register" class="font-black text-primary-600 hover:underline">Create Account</RouterLink>
        </div>
      </div>

      <p class="mt-6 text-center text-xs text-text-muted">
        © 2026 QRHome · Premium Wellness Platform
      </p>
    </div>
  </div>
</template>
