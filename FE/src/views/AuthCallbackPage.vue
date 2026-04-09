<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { qrConfigApi } from '@/api/qr-config.api'
import { categoriesApi } from '@/api/categories.api'
import { servicesApi } from '@/api/services.api'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const isLoading = ref(true)
const error = ref('')

async function handlePostAuthRedirect() {
  try {
    await authStore.fetchProfile()

    const configRes = await qrConfigApi.getConfig()
    const config = configRes.data?.data || configRes.data
    const isConfigDone = !!config?.spaName && !!config?.spaPhone

    if (!isConfigDone) {
      await router.replace('/admin/qr')
      return
    }

    const catsRes = await categoriesApi.getAll()
    const catsData = catsRes.data?.data || catsRes.data || []
    const isCategoryDone = Array.isArray(catsData) && catsData.length > 0

    if (!isCategoryDone) {
      await router.replace('/admin/categories')
      return
    }

    const servicesRes = await servicesApi.getAll({ limit: 1 })
    const raw: any = servicesRes.data
    const servicesData = raw?.data?.items || raw?.items || raw?.data || []
    const isServiceDone = (Array.isArray(servicesData) ? servicesData.length : 0) > 0

    if (!isServiceDone) {
      await router.replace('/admin/services')
      return
    }

    await router.replace('/admin/dashboard')
  } catch {
    await router.replace('/admin/dashboard')
  }
}

onMounted(async () => {
  const queryErr = String(route.query.error || '').trim()
  if (queryErr) {
    await router.replace({
      path: '/',
      query: { error: queryErr },
    })
    return
  }

  const oauth = String(route.query.oauth || '').toLowerCase()
  if (oauth !== 'google') {
    error.value = 'Invalid OAuth callback.'
    isLoading.value = false
    return
  }

  const result = await authStore.completeGoogleLoginFromCookie()
  if (!result.success) {
    error.value = result.message || 'Google login failed'
    isLoading.value = false
    return
  }

  await handlePostAuthRedirect()
  isLoading.value = false
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-slate-50 px-6">
    <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div v-if="isLoading" class="space-y-3">
        <div class="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
        <h1 class="text-lg font-semibold text-slate-900">Completing Google sign in...</h1>
        <p class="text-sm text-slate-500">Please wait while we set up your session.</p>
      </div>

      <div v-else-if="error" class="space-y-4">
        <h1 class="text-lg font-semibold text-slate-900">Sign in failed</h1>
        <p class="text-sm text-red-600">{{ error }}</p>
        <button
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          @click="router.replace('/')"
        >
          Back to home
        </button>
      </div>
    </div>
  </div>
</template>
