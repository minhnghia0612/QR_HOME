import type { Router } from 'vue-router'
import { qrConfigApi } from '@/api/qr-config.api'
import { categoriesApi } from '@/api/categories.api'
import { servicesApi } from '@/api/services.api'

export async function handlePostAuthRedirect(router: Router, authStore: any) {
  try {
    await authStore.fetchProfile()
    
    // Get all necessary data to determine onboarding state
    const configRes = await qrConfigApi.getConfig()
    const config = configRes.data?.data || configRes.data
    
    // Step 1: Spa Name AND Spa Phone are required
    const isConfigDone = !!config?.spaName && !!config?.spaPhone
    if (!isConfigDone) {
      router.push('/admin/qr')
      return
    }

    // Step 2: Categories
    const catsRes = await categoriesApi.getAll()
    const catsData = catsRes.data?.data || catsRes.data || []
    const isCategoryDone = catsData.length > 0
    if (!isCategoryDone) {
      router.push('/admin/categories')
      return
    }

    // Step 3: Services
    const servicesRes = await servicesApi.getAll({ limit: 1 })
    const raw: any = servicesRes.data
    const servicesData = raw?.data?.items || raw?.items || raw?.data || []
    const isServiceDone = (Array.isArray(servicesData) ? servicesData.length : 0) > 0
    if (!isServiceDone) {
      router.push('/admin/services')
      return
    }

    // If all steps done, go to dashboard
    router.push('/admin/dashboard')
    
  } catch (err) {
    console.error('Redirect error:', err)
    router.push('/admin/dashboard')
  }
}
