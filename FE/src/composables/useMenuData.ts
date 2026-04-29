import { computed, onMounted, watch, type ComputedRef } from 'vue'
import { useQuery, useMutation } from '@tanstack/vue-query'
import { useAuthStore } from '@/stores/auth.store'
import { categoriesApi } from '@/api/categories.api'
import { servicesApi } from '@/api/services.api'
import { qrConfigApi } from '@/api/qr-config.api'
import { trafficApi } from '@/api/traffic.api'
import { getAdminPreviewSession, type AdminPreviewPayload } from '@/lib/admin-preview-session'

const PUBLIC_MENU_REFETCH_INTERVAL_MS = 15000

/**
 * useMenuData
 * Central data-fetching composable for the customer menu.
 * Handles: public config, categories, services (all-pages), admin preview session,
 * traffic logging, and selectedService sync on background refetch.
 */
export function useMenuData(targetId: ComputedRef<string>) {
  const authStore = useAuthStore()

  // ─── Public Config ───────────────────────────────────────────────────────────
  const publicConfigQueryKey = computed(() => ['public-config', targetId.value])

  const { data: configRes, isLoading: loadingConfig } = useQuery({
    queryKey: publicConfigQueryKey,
    queryFn: async () => {
      const { data } = await qrConfigApi.getPublicConfig(targetId.value)
      return (data as any).data || data
    },
    enabled: computed(() => !!targetId.value),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  })

  const spaConfig = computed(() => {
    const raw = configRes.value
    return (raw as any)?.status ? raw : (raw as any)?.data || raw || {}
  })

  const resolvedStoreId = computed(() => spaConfig.value?.storeId)
  const resolvedAdminId = computed(() => spaConfig.value?.adminId)

  // ─── Admin Session ───────────────────────────────────────────────────────────
  const isSessionAdmin = computed(() => {
    const currentAdminId = String(authStore.admin?.id || '')
    const configAdminId = String(resolvedAdminId.value || '')
    return !!authStore.token && !!currentAdminId && currentAdminId === configAdminId
  })

  const hasPendingAdminSession = computed(() => !!authStore.token && !authStore.admin)

  const previewSession = computed(() =>
    getAdminPreviewSession(resolvedAdminId.value || ''),
  )

  const isAdminPreview = computed(() => isSessionAdmin.value)

  function getPreviewValue<T extends string>(
    key: keyof AdminPreviewPayload,
    fallback: T,
  ): string | T {
    if (!isAdminPreview.value) return fallback
    const value = previewSession.value?.[key]
    if (typeof value === 'string' && value.trim()) return value
    return fallback
  }

  // ─── Categories ──────────────────────────────────────────────────────────────
  const publicCategoriesQueryKey = computed(() => [
    'public-categories',
    resolvedStoreId.value || targetId.value,
    isAdminPreview.value,
  ])

  const { data: categoriesRes, isLoading: loadingCats } = useQuery({
    queryKey: publicCategoriesQueryKey,
    queryFn: async () => {
      if (isAdminPreview.value) {
        const { data } = await categoriesApi.getAll()
        return (data as any).data || data
      }
      const { data } = await categoriesApi.getActive({
        adminId: resolvedAdminId.value,
        storeId: resolvedStoreId.value || targetId.value,
      })
      return (data as any).data || data
    },
    enabled: computed(
      () => !loadingConfig.value && !!(resolvedStoreId.value || targetId.value),
    ),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: PUBLIC_MENU_REFETCH_INTERVAL_MS,
  })

  // ─── Services (all pages) ────────────────────────────────────────────────────
  const publicServicesQueryKey = computed(() => [
    'public-services',
    resolvedStoreId.value || targetId.value,
    isAdminPreview.value,
  ])

  const { data: servicesRes, isLoading: loadingServices } = useQuery({
    queryKey: publicServicesQueryKey,
    queryFn: async () => {
      if (isAdminPreview.value) {
        const { data } = await servicesApi.getAll({ limit: 100 })
        const payload = (data as any).data || data
        return payload?.items || payload || []
      }

      const firstResponse = await servicesApi.getPublic({
        adminId: resolvedAdminId.value,
        storeId: resolvedStoreId.value || targetId.value,
        page: 1,
        limit: 100,
      } as any)

      const firstData = (firstResponse.data as any)?.data || firstResponse.data
      const firstItems = Array.isArray(firstData?.items) ? firstData.items : []
      const totalPages = Number(firstData?.totalPages) || 1

      if (totalPages <= 1) return firstItems

      const requests: Promise<any>[] = []
      for (let page = 2; page <= totalPages; page += 1) {
        requests.push(
          servicesApi.getPublic({
            adminId: resolvedAdminId.value,
            storeId: resolvedStoreId.value || targetId.value,
            page,
            limit: 100,
          } as any),
        )
      }

      const nextResponses = await Promise.all(requests)
      const extraItems = nextResponses.flatMap((response) => {
        const payload = (response.data as any)?.data || response.data
        return Array.isArray(payload?.items) ? payload.items : []
      })

      return [...firstItems, ...extraItems]
    },
    enabled: computed(
      () => !loadingConfig.value && !!(resolvedStoreId.value || targetId.value),
    ),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: PUBLIC_MENU_REFETCH_INTERVAL_MS,
  })

  // ─── Derived data ────────────────────────────────────────────────────────────
  const allServices = computed(() => {
    const raw = servicesRes.value
    const data = (raw as any)?.data || raw
    return data?.items || data || []
  })

  const categories = computed(() => {
    const raw = categoriesRes.value
    const list = (raw as any)?.data || raw || []
    // Only show categories that have at least one service
    return list.filter((cat: any) =>
      allServices.value.some((svc: any) => svc.categoryId === cat.id),
    )
  })

  const newServices = computed(() =>
    allServices.value
      .filter((s: any) => s.isNewService)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5),
  )

  const articleSlides = computed(() =>
    newServices.value.length ? newServices.value : allServices.value.slice(0, 5),
  )

  const isInitialLoading = computed(
    () => loadingCats.value || loadingConfig.value || loadingServices.value,
  )

  // ─── Traffic logging ─────────────────────────────────────────────────────────
  const { mutate: logTraffic } = useMutation({
    mutationFn: (params: { serviceId?: string; adminId?: string; storeId?: string }) =>
      trafficApi.logVisit(params),
  })

  watch(
    [resolvedAdminId, resolvedStoreId],
    ([admin, store]) => {
      if (hasPendingAdminSession.value) return
      if (isAdminPreview.value) return
      if (admin && store) {
        logTraffic({ adminId: admin, storeId: store })
      }
    },
    { immediate: true },
  )

  // ─── Bootstrap ───────────────────────────────────────────────────────────────
  onMounted(() => {
    if (authStore.token && !authStore.admin) {
      authStore.fetchProfile()
    }
  })

  return {
    // config
    spaConfig,
    loadingConfig,
    resolvedStoreId,
    resolvedAdminId,
    // session
    isAdminPreview,
    hasPendingAdminSession,
    previewSession,
    getPreviewValue,
    // categories
    categories,
    loadingCats,
    // services
    allServices,
    loadingServices,
    newServices,
    articleSlides,
    // combined
    isInitialLoading,
    // traffic
    logTraffic,
  }
}
