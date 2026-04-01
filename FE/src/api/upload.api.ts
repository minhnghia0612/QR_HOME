import apiClient from './client'
import type { ApiResponse } from '@/types/api.types'

interface UploadResponse {
  url: string
  originalName: string
  size: number
}

export const uploadApi = {
  upload: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post<ApiResponse<UploadResponse>>('/upload', formData)
  },
}
