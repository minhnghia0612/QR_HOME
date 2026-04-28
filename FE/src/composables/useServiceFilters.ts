import { ref, computed, watch } from 'vue'

export function useServiceFilters(PAGE_SIZE: number = 20) {
  const searchInput = ref('')
  const searchQuery = ref('')
  const selectedStatus = ref('')
  const selectedCategory = ref('')
  const selectedSort = ref<'newest' | 'oldest'>('newest')
  const openFilter = ref<'status' | 'category' | 'sort' | null>(null)
  const page = ref(1)

  // Debounce search
  let searchTimeout: any
  watch(searchInput, (val) => {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      searchQuery.value = val
      page.value = 1
    }, 300)
  })

  // Reset page on filter change
  watch([selectedStatus, selectedCategory, selectedSort], () => {
    page.value = 1
  })

  function toggleFilter(name: 'status' | 'category' | 'sort') {
    openFilter.value = openFilter.value === name ? null : name
  }

  function setStatusFilter(value: string) {
    selectedStatus.value = value
    openFilter.value = null
  }

  function setCategoryFilter(value: string) {
    selectedCategory.value = value
    openFilter.value = null
  }

  function setSortFilter(value: 'newest' | 'oldest') {
    selectedSort.value = value
    openFilter.value = null
  }

  return {
    searchInput,
    searchQuery,
    selectedStatus,
    selectedCategory,
    selectedSort,
    openFilter,
    page,
    toggleFilter,
    setStatusFilter,
    setCategoryFilter,
    setSortFilter,
  }
}
