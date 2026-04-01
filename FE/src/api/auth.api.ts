import apiClient from './client'
import type { ApiResponse } from '@/types/api.types'

interface LoginPayload {
  username: string
  password: string
}

interface LoginResponse {
  accessToken: string
  admin: { id: string; username: string; fullName: string }
}

interface RegisterPayload extends LoginPayload {
  fullName: string
  email: string
  spaName?: string
}

interface ProfileResponse {
  id: string
  username: string
  lastLogin: string | null
}

export const authApi = {
  login: (data: LoginPayload) =>
    apiClient.post<ApiResponse<LoginResponse>>('/auth/login', data),

  register: (data: RegisterPayload) =>
    apiClient.post<ApiResponse<LoginResponse>>('/auth/register', data),

  getProfile: () =>
    apiClient.get<ApiResponse<ProfileResponse>>('/auth/me'),
}
