import apiClient from './client'
import type { ApiResponse } from '@/types/api.types'
import type { Category, CreateCategoryPayload, UpdateCategoryPayload } from '@/types/category.types'

export const categoriesApi = {
  getAll: () =>
    apiClient.get<ApiResponse<Category[]>>('/categories'),

  getActive: (params?: { adminId: string }) =>
    apiClient.get<ApiResponse<Category[]>>('/categories/active', { params }),

  getOne: (id: string) =>
    apiClient.get<ApiResponse<Category>>(`/categories/${id}`),

  create: (data: CreateCategoryPayload) =>
    apiClient.post<ApiResponse<Category>>('/categories', data),

  update: (id: string, data: UpdateCategoryPayload) =>
    apiClient.patch<ApiResponse<Category>>(`/categories/${id}`, data),

  delete: (id: string) =>
    apiClient.delete(`/categories/${id}`),
}
