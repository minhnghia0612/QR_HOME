import apiClient from './client'
import type { ApiResponse } from '@/types/api.types'
import type { DashboardData, TopViewedItem } from '@/types/traffic.types'

export const trafficApi = {
  logVisit: (params: { serviceId?: string; adminId?: string; storeId?: string }) =>
    apiClient.post('/traffic/log', params),

  getDashboard: () =>
    apiClient.get<ApiResponse<DashboardData>>('/traffic/dashboard'),

  getTopViewed: (params?: { adminId?: string; storeId?: string }) => {
    const query = new URLSearchParams()
    if (params?.adminId) query.append('adminId', params.adminId)
    if (params?.storeId) query.append('storeId', params.storeId)
    return apiClient.get<ApiResponse<TopViewedItem[]>>(`/traffic/top-viewed?${query.toString()}`)
  },
}
