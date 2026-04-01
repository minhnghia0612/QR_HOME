import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { qrConfigApi } from '@/api/qr-config.api'
import { categoriesApi } from '@/api/categories.api'

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
      
      const { data: configRes } = await qrConfigApi.getConfig()
      const config = (configRes as any).data?.data || (configRes as any).data
      
      const isStep1Complete = !!config?.spaName && !!config?.spaPhone
      
      // If Step 1 not complete, only allow access to 'admin-settings' (Settings Page)
      if (!isStep1Complete && to.name !== 'admin-settings') {
        return { name: 'admin-settings' }
      }

      // 2. Check Categories (Step 2)
      if (isStep1Complete) {
        const { data: catsRes } = await categoriesApi.getAll()
        const categories = (catsRes as any).data?.data || (catsRes as any).data
        const isStep2Complete = categories && categories.length > 0

        // If Step 1 is done but Step 2 is not, only allow Settings or Categories
        if (!isStep2Complete && !['admin-settings', 'admin-categories'].includes(to.name as string)) {
          return { name: 'admin-categories' }
        }
      }
    } catch (err) {
      console.error('Navigation guard error:', err)
    }
  }
})

export default router
