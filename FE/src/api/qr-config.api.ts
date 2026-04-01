import apiClient from './client'
import type { ApiResponse } from '@/types/api.types'
import type { QrConfig, QrStatus } from '@/types/qr-config.types'

export const qrConfigApi = {
  getConfig: () =>
    apiClient.get<ApiResponse<QrConfig>>('/qr-config'),

  getStatus: () =>
    apiClient.get<ApiResponse<{ status: QrStatus }>>('/qr-config/status'),

  generate: () =>
    apiClient.post<ApiResponse<QrConfig>>('/qr-config/generate'),

  updateConfig: (data: any) =>
    apiClient.patch<ApiResponse<QrConfig>>('/qr-config', data),

  updateStatus: (status: QrStatus) =>
    apiClient.patch<ApiResponse<QrConfig>>('/qr-config/status', { status }),

  downloadQr: () =>
    apiClient.get<ApiResponse<string>>('/qr-config/download'),
}
