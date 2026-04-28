import { computed } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { categoriesApi } from '@/api/categories.api'
import { useStoreManager } from '@/stores/store-manager.store'

export function useCategoriesData() {
  const storeManager = useStoreManager()
  const queryClient = useQueryClient()

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories', computed(() => storeManager.currentStoreId)],
    queryFn: async () => {
      const { data } = await categoriesApi.getAll()
      return data.data
    },
  })

  const { mutate: deleteCategory } = useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  })

  return {
    categories,
    isLoading,
    deleteCategory,
  }
}
