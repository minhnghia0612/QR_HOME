import apiClient from './client'

export const storesApi = {
  getAll: () => apiClient.get('/stores'),
  getById: (id: string) => apiClient.get(`/stores/${id}`),
  create: (data: { name: string }) => apiClient.post('/stores', data),
  update: (id: string, data: { name: string }) => apiClient.patch(`/stores/${id}`, data),
  delete: (id: string) => apiClient.delete(`/stores/${id}`),
}
