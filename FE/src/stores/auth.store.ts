import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth.api'
import router from '@/router'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('qr_home_token'))
  const admin = ref<{ id: string; username: string; fullName: string } | null>(null)
  const isLoading = ref(false)

  const isAuthenticated = computed(() => !!token.value)

  async function login(username: string, password: string) {
    isLoading.value = true
    try {
      const { data } = await authApi.login({ username, password })
      token.value = data.data.accessToken
      admin.value = data.data.admin
      localStorage.setItem('qr_home_token', data.data.accessToken)
      return { success: true }
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Invalid credentials' }
    } finally {
      isLoading.value = false
    }
  }

  async function register(payload: any) {
    isLoading.value = true
    try {
      const { data } = await authApi.register(payload)
      token.value = data.data.accessToken
      admin.value = data.data.admin
      localStorage.setItem('qr_home_token', data.data.accessToken)
      return { success: true }
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Registration failed' }
    } finally {
      isLoading.value = false
    }
  }

  async function fetchProfile() {
    if (!token.value) return
    try {
      const { data } = await authApi.getProfile()
      admin.value = { 
        id: data.data.id, 
        username: data.data.username,
        fullName: (data.data as any).fullName || '' 
      }
    } catch {
      logout()
    }
  }

  function logout() {
    token.value = null
    admin.value = null
    localStorage.removeItem('qr_home_token')
    router.push('/')
  }

  return { token, admin, isLoading, isAuthenticated, login, register, fetchProfile, logout }
})
