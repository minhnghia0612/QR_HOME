import apiClient from './client'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { Service, CreateServicePayload, UpdateServicePayload, ServiceQuery } from '@/types/service.types'

export const servicesApi = {
  getAll: (params?: ServiceQuery) =>
    apiClient.get<PaginatedResponse<Service>>('/services', { params }),

  getPublic: (params?: ServiceQuery) =>
    apiClient.get<PaginatedResponse<Service>>('/services/public', { params }),

  getOne: (id: string) =>
    apiClient.get<ApiResponse<Service>>(`/services/${id}`),

  create: (data: CreateServicePayload) =>
    apiClient.post<ApiResponse<Service>>('/services', data),

  update: (id: string, data: UpdateServicePayload) =>
    apiClient.patch<ApiResponse<Service>>(`/services/${id}`, data),

  delete: (id: string) =>
    apiClient.delete(`/services/${id}`),
}
