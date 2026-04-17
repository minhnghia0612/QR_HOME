import type { Category } from './category.types'
import type { AppLocale } from '@/i18n'

// Per-locale content overrides stored alongside the main service record.
// Only `name` is required per entry; description / shortDescription are optional.
export interface ServiceLocaleEntry {
  name: string
  description?: string
  shortDescription?: string
  variantOptions?: Array<{ name: string; price?: number }>
  variantNames?: string[]
  specialTags?: string[]
}

export type ServiceLocales = Partial<Record<AppLocale, ServiceLocaleEntry>>

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
  /** Multilingual content overrides. Falls back to root `name`/`description` when absent. */
  locales?: ServiceLocales
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
  /** Multilingual content overrides. */
  locales?: ServiceLocales
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
  adminId?: string
  storeId?: string
}
