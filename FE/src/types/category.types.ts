export interface Category {
  id: string
  name: string

  sortOrder: number
  isActive: boolean
  createdAt: string
}

export interface CreateCategoryPayload {
  name: string

  sortOrder?: number
  isActive?: boolean
}

export type UpdateCategoryPayload = Partial<CreateCategoryPayload>
