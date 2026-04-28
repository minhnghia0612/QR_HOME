import { computed, watch } from 'vue'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/vue-query'
import { servicesApi } from '@/api/services.api'
import { categoriesApi } from '@/api/categories.api'
import { useStoreManager } from '@/stores/store-manager.store'

export function useServicesData(
  searchQuery: any,
  selectedStatus: any,
  selectedCategory: any,
  selectedSort: any,
  page: any,
  PAGE_SIZE: number = 20
) {
  const storeManager = useStoreManager()
  const queryClient = useQueryClient()

  const servicesQueryKey = computed(() => [
    'services',
    storeManager.currentStoreId,
    searchQuery.value,
    selectedStatus.value,
    selectedCategory.value,
    selectedSort.value,
  ])

  const { data: services, isLoading: loadingServices } = useQuery({
    queryKey: servicesQueryKey,
    queryFn: async () => {
      const baseParams: any = {
        search: searchQuery.value.trim() || undefined,
        categoryId: selectedCategory.value || undefined,
      }

      const pageSize = 100
      let currentPage = 1
      let totalPages = 1
      const allItems: any[] = []

      while (currentPage <= totalPages) {
        const { data } = await servicesApi.getAll({
          ...baseParams,
          page: currentPage,
          limit: pageSize,
        })

        const payload = (data as any)?.data || data
        const items = Array.isArray(payload?.items)
          ? payload.items
          : Array.isArray(payload)
            ? payload
            : []

        allItems.push(...items)

        const nextTotalPages = Number(payload?.totalPages || 1)
        totalPages = Number.isFinite(nextTotalPages) && nextTotalPages > 0 ? nextTotalPages : 1
        currentPage += 1
      }

      return {
        items: allItems,
        total: allItems.length,
        totalPages: Math.ceil(allItems.length / PAGE_SIZE),
      }
    },
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  })

  const processedServices = computed(() => {
    const source = Array.isArray((services.value as any)?.items)
      ? [...(services.value as any).items]
      : []

    const byStatus = source.filter((svc: any) => {
      if (selectedStatus.value === 'true') return !!svc?.isActive
      if (selectedStatus.value === 'false') return !svc?.isActive
      return true
    })

    byStatus.sort((a: any, b: any) => {
      const aTime = new Date(a?.createdAt || 0).getTime()
      const bTime = new Date(b?.createdAt || 0).getTime()
      return selectedSort.value === 'oldest' ? aTime - bTime : bTime - aTime
    })

    return byStatus
  })

  const servicesView = computed(() => {
    const total = processedServices.value.length
    const totalPages = total > 0 ? Math.ceil(total / PAGE_SIZE) : 0
    const start = (page.value - 1) * PAGE_SIZE
    const end = start + PAGE_SIZE

    return {
      items: processedServices.value.slice(start, end),
      total,
      totalPages,
    }
  })

  watch(servicesView, (next) => {
    if (next.totalPages > 0 && page.value > next.totalPages) {
      page.value = next.totalPages
    }
    if (next.totalPages === 0 && page.value !== 1) {
      page.value = 1
    }
  })

  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ['categories', computed(() => storeManager.currentStoreId)],
    queryFn: async () => {
      const { data } = await categoriesApi.getAll()
      return data.data
    },
    staleTime: 60000,
    refetchOnWindowFocus: false,
  })

  const { mutate: deleteService } = useMutation({
    mutationFn: (id: string) => servicesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      queryClient.invalidateQueries({ queryKey: ['nav-services-count'] })
      queryClient.invalidateQueries({ queryKey: ['public-services'] })
      queryClient.invalidateQueries({ queryKey: ['public-categories'] })
    },
  })

  const { mutate: toggleStatus } = useMutation({
    mutationFn: (svc: any) => servicesApi.update(svc.id, { isActive: !svc.isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      queryClient.invalidateQueries({ queryKey: ['public-services'] })
      queryClient.invalidateQueries({ queryKey: ['public-categories'] })
    },
  })

  return {
    servicesView,
    loadingServices,
    categories,
    loadingCategories,
    deleteService,
    toggleStatus,
  }
}
