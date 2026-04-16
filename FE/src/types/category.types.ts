export interface Category {
  id: string
  name: string
  locales?: Record<string, { name: string }>

  sortOrder: number
  isActive: boolean
  createdAt: string
}

export interface CreateCategoryPayload {
  name: string
  locales?: Record<string, { name: string }>

  sortOrder?: number
  isActive?: boolean
}

export type UpdateCategoryPayload = Partial<CreateCategoryPayload>
