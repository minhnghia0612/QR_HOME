import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { trafficApi } from '@/api/traffic.api'
import { computed, watch, onBeforeUnmount } from 'vue'
import { io, type Socket } from 'socket.io-client'
import { useAuthStore } from '@/stores/auth.store'
import { useStoreManager } from '@/stores/store-manager.store'

export function useDashboardTraffic() {
  const storeManager = useStoreManager()
  const queryClient = useQueryClient()
  const authStore = useAuthStore()
  
  let dashboardSocket: Socket | null = null

  const { data: dashboard, isFetching: loadingDashboard } = useQuery({
    queryKey: ['dashboard', computed(() => storeManager.currentStoreId)],
    queryFn: async () => {
      const { data } = await trafficApi.getDashboard()
      return data.data
    },
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  })

  function connectDashboardSocket(adminId: string) {
    if (dashboardSocket?.connected) {
      dashboardSocket.emit('dashboard:subscribe', { adminId })
      return
    }

    const token = localStorage.getItem('qr_home_token') || ''

    dashboardSocket = io('/traffic', {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      auth: { token },
      withCredentials: true,
    })

    dashboardSocket.on('connect', () => {
      dashboardSocket?.emit('dashboard:subscribe', { adminId })
    })

    dashboardSocket.on('traffic:dashboard-updated', (payload: any) => {
      if (!payload?.dashboard) return
      if (String(payload?.adminId || '') !== adminId) return
      queryClient.setQueryData(['dashboard', storeManager.currentStoreId], payload.dashboard)
    })
  }

  watch(
    () => authStore.admin?.id,
    (adminId) => {
      const normalized = String(adminId || '').trim()
      if (!normalized) return
      connectDashboardSocket(normalized)
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    dashboardSocket?.disconnect()
    dashboardSocket = null
  })

  const weeklyWithData = computed(() => {
    const weekly = dashboard.value?.weekly ?? []
    const since = new Date()
    since.setHours(0, 0, 0, 0)
    since.setDate(since.getDate() - 6)

    return weekly.filter((day: any) => {
      const date = new Date(day.date)
      date.setHours(0, 0, 0, 0)
      return date >= since && Number(day.count) > 0
    })
  })

  const maxBarValue = computed(() => {
    if (!weeklyWithData.value.length) return 1
    return Math.max(...weeklyWithData.value.map((d: any) => d.count), 1)
  })

  return {
    dashboard,
    loadingDashboard,
    weeklyWithData,
    maxBarValue,
  }
}
