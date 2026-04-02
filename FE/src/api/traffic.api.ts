import apiClient from './client'
import type { ApiResponse } from '@/types/api.types'
import type { DashboardData, TopViewedItem } from '@/types/traffic.types'

export const trafficApi = {
  logVisit: (params: { serviceId?: string; adminId: string }) =>
    apiClient.post('/traffic/log', params),

  getDashboard: () =>
    apiClient.get<ApiResponse<DashboardData>>('/traffic/dashboard'),

  getTopViewed: () =>
    apiClient.get<ApiResponse<TopViewedItem[]>>('/traffic/top-viewed'),
}
