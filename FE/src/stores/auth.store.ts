import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth.api'
import { clearAuthBrowserState } from '@/lib/auth-storage'
import { queryClient } from '@/lib/query-client'
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
      clearAuthBrowserState()
      queryClient.clear()
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
      clearAuthBrowserState()
      queryClient.clear()
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

  async function completeGoogleLoginFromCookie() {
    isLoading.value = true
    try {
      const { data } = await authApi.getSession()
      clearAuthBrowserState()
      queryClient.clear()
      token.value = data.data.accessToken
      admin.value = data.data.admin
      localStorage.setItem('qr_home_token', data.data.accessToken)
      return { success: true }
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Google login failed' }
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    // Clear local auth state immediately to prevent stale-session race conditions.
    token.value = null
    admin.value = null
    clearAuthBrowserState()
    queryClient.clear()

    try {
      await authApi.logout()
    } catch {
      // Ignore logout transport errors and clear local auth state anyway.
    }
    router.push('/')
  }

  return { token, admin, isLoading, isAuthenticated, login, register, fetchProfile, completeGoogleLoginFromCookie, logout }
})
