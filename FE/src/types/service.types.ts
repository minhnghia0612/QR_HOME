import type { Category } from './category.types'

export interface Service {
  id: string
  categoryId: string
  name: string
  description: string
  durationMinutes: number
  price: number
  currency: string
  imageUrl: string
  isBestSeller: boolean
  isNewService: boolean
  isCombo: boolean
  isActive: boolean
  sortOrder: number
  createdAt: string
  category?: Category
}

export interface CreateServicePayload {
  categoryId: string
  name: string
  description: string
  durationMinutes?: number
  price: number
  currency?: string
  imageUrl: string
  isBestSeller?: boolean
  isNewService?: boolean
  isCombo?: boolean
  isActive?: boolean
  sortOrder?: number
}

export type UpdateServicePayload = Partial<CreateServicePayload>

export interface ServiceQuery {
  page?: number
  limit?: number
  search?: string
  categoryId?: string
  isActive?: boolean
  label?: 'best_seller' | 'new_service' | 'combo'
}
