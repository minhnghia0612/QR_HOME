import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { qrConfigApi } from '@/api/qr-config.api'
import { categoriesApi } from '@/api/categories.api'
import { servicesApi } from '@/api/services.api'

const ONBOARDING_CACHE_TTL_MS = 15000
let onboardingCache:
  | {
  adminId: string
      checkedAt: number
      isStep1Complete: boolean
      isStep2Complete: boolean
      isStep3Complete: boolean
    }
  | null = null

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: () => import('@/views/LandingPage.vue'),
      meta: { layout: 'blank' },
    },
    // ── Customer Routes ──
    {
      path: '/menu/:id',
      name: 'customer-menu',
      component: () => import('@/views/customer/MenuPage.vue'),
      meta: { layout: 'customer' },
    },

    {
      path: '/admin/login',
      redirect: '/',
    },
    {
      path: '/admin/register',
      redirect: '/',
    },
    {
      path: '/admin',
      redirect: '/admin/dashboard',
    },
    {
      path: '/admin/dashboard',
      name: 'admin-dashboard',
      component: () => import('@/views/admin/DashboardPage.vue'),
      meta: { layout: 'admin', requiresAuth: true },
    },
    {
      path: '/admin/categories',
      name: 'admin-categories',
      component: () => import('@/views/admin/CategoriesPage.vue'),
      meta: { layout: 'admin', requiresAuth: true },
    },
    {
      path: '/admin/services',
      name: 'admin-services',
      component: () => import('@/views/admin/ServiceManagerPage.vue'),
      meta: { layout: 'admin', requiresAuth: true },
    },
    {
      path: '/admin/qr',
      name: 'admin-settings',
      component: () => import('@/views/admin/SettingsPage.vue'),
      meta: { layout: 'admin', requiresAuth: true },
    },
    {
      path: '/admin/themes',
      name: 'admin-themes',
      component: () => import('@/views/admin/ThemeSettingsPage.vue'),
      meta: { layout: 'admin', requiresAuth: true },
    },

    // ── Catch-all ──
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundPage.vue'),
      meta: { layout: 'blank' },
    },
  ],
})

// Auth & Onboarding guard
router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      return { name: 'landing' }
    }

    // --- Onboarding Flow Logic ---
    // Try to check setup status for admin routes (except the setup routes themselves to avoid loops)
    try {
      // 1. Fetch profile to ensure we have admin ID
      if (!authStore.admin) await authStore.fetchProfile()
      const currentAdminId = String(authStore.admin?.id || '')
      if (!currentAdminId) {
        return { name: 'landing' }
      }

      const now = Date.now()
      const hasFreshCache =
        !!onboardingCache &&
        onboardingCache.adminId === currentAdminId &&
        now - onboardingCache.checkedAt < ONBOARDING_CACHE_TTL_MS

      if (hasFreshCache) {
        const cache = onboardingCache!

        if (!cache.isStep1Complete && to.name !== 'admin-settings') {
          return { name: 'admin-settings' }
        }
        if (
          cache.isStep1Complete &&
          !cache.isStep2Complete &&
          !['admin-settings', 'admin-categories'].includes(to.name as string)
        ) {
          return { name: 'admin-categories' }
        }
        if (
          cache.isStep1Complete &&
          cache.isStep2Complete &&
          !cache.isStep3Complete &&
          !['admin-settings', 'admin-categories', 'admin-services'].includes(to.name as string)
        ) {
          return { name: 'admin-services' }
        }
        return
      }
      
      const { data: configRes } = await qrConfigApi.getConfig()
      const config = (configRes as any).data?.data || (configRes as any).data
      
      const isStep1Complete = !!config?.spaName && !!config?.spaPhone
      
      // If Step 1 not complete, only allow access to 'admin-settings' (Settings Page)
      if (!isStep1Complete && to.name !== 'admin-settings') {
        return { name: 'admin-settings' }
      }

      // 2. Check Categories (Step 2)
      let isStep2Complete = false
      if (isStep1Complete) {
        const { data: catsRes } = await categoriesApi.getAll()
        const categories = (catsRes as any).data?.data || (catsRes as any).data || []
        isStep2Complete = categories.length > 0

        if (!isStep2Complete && !['admin-settings', 'admin-categories'].includes(to.name as string)) {
          return { name: 'admin-categories' }
        }
      }

      // 3. Check Services (Step 3)
      if (isStep1Complete && isStep2Complete) {
        const { data: svcRes } = await servicesApi.getAll({ limit: 1 })
        const services = (svcRes as any).data?.items || (svcRes as any).data || []
        const isStep3Complete = (Array.isArray(services) ? services.length : (services?.items?.length || 0)) > 0

        onboardingCache = {
          adminId: currentAdminId,
          checkedAt: now,
          isStep1Complete,
          isStep2Complete,
          isStep3Complete,
        }

        if (!isStep3Complete && !['admin-settings', 'admin-categories', 'admin-services'].includes(to.name as string)) {
          return { name: 'admin-services' }
        }
      } else {
        onboardingCache = {
          adminId: currentAdminId,
          checkedAt: now,
          isStep1Complete,
          isStep2Complete,
          isStep3Complete: false,
        }
      }
    } catch (err) {
      console.error('Navigation guard error:', err)
    }
  }
})

export default router
