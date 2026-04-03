import type { Category } from './category.types'

export interface ServiceVariantOption {
  name: string
  price: number
}

export interface Service {
  id: string
  categoryId: string
  name: string
  shortDescription?: string
  description: string
  durationMinutes: number
  price: number
  priceFrom?: number
  priceTo?: number
  hasVariants?: boolean
  variantOptions?: ServiceVariantOption[]
  currency: string
  imageUrl: string
  isBestSeller: boolean
  isNewService: boolean
  isCombo: boolean
  specialTags?: string[]
  isActive: boolean
  sortOrder: number
  createdAt: string
  category?: Category
}

export interface CreateServicePayload {
  categoryId: string
  name: string
  shortDescription?: string
  description: string
  durationMinutes?: number
  price: number
  priceFrom?: number
  priceTo?: number
  hasVariants?: boolean
  variantOptions?: ServiceVariantOption[]
  currency?: string
  imageUrl: string
  isBestSeller?: boolean
  isNewService?: boolean
  isCombo?: boolean
  specialTags?: string[]
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
  sortBy?: 'createdAt' | 'sortOrder'
  sortDirection?: 'ASC' | 'DESC'
}
