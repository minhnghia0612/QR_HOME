import { ref, computed, watch, type ComputedRef, type Ref } from 'vue'

/**
 * useMenuFilter
 * Manages category selection, search query, filtered/grouped service lists,
 * and all per-theme view-open state + navigation helpers.
 *
 * Theme-specific computed values (dark category tiles, ocean groups, etc.)
 * are also centralised here to keep MenuPage.vue clean.
 */
export function useMenuFilter(
  allServices: ComputedRef<any[]>,
  categories: ComputedRef<any[]>,
  themeFlags: {
    isStitchTheme: ComputedRef<boolean>
    isDarkEleganceTheme: ComputedRef<boolean>
    isVibrantTheme: ComputedRef<boolean>
    isOceanTheme: ComputedRef<boolean>
    isNeonTheme: ComputedRef<boolean>
    isRoseTheme: ComputedRef<boolean>
  },
) {
  const { isStitchTheme, isDarkEleganceTheme, isVibrantTheme, isOceanTheme, isNeonTheme, isRoseTheme } =
    themeFlags

  // ─── Core filter state ───────────────────────────────────────────────────────
  const searchQuery = ref('')
  const selectedCategoryId = ref<string | null>(null)

  // Ref for the "All" tab anchor (Rose theme's switchToAllTab scrolls here)
  const allTabAnchorRef = ref<HTMLElement | null>(null)

  // ─── Per-theme view-open state ───────────────────────────────────────────────
  const darkCategoryViewOpen = ref(false)
  const stitchCategoryViewOpen = ref(false)
  const roseCategoryViewOpen = ref(false)

  // ─── Filtered services ───────────────────────────────────────────────────────
  const filteredServices = computed<any[]>(() => {
    let list = allServices.value

    // Stitch theme: category filtering is handled by groupedByCategory accordion
    if (selectedCategoryId.value && !isStitchTheme.value) {
      list = list.filter((s: any) => s.categoryId === selectedCategoryId.value)
    }

    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase()
      list = list.filter(
        (s: any) =>
          s.name?.toLowerCase().includes(q) ||
          s.shortDescription?.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q),
      )
    }

    return list as any[]
  })

  // ─── Grouped by category ─────────────────────────────────────────────────────
  const groupedByCategory = computed(() => {
    // Stitch theme: accordion model — show only selected category's services
    if (isStitchTheme.value) {
      const groups = categories.value
        .map((cat: any) => ({
          category: cat,
          services: filteredServices.value.filter((s: any) => s.categoryId === cat.id),
        }))
        .filter((g: any) => g.services.length > 0)

      if (!selectedCategoryId.value || !stitchCategoryViewOpen.value) {
        return groups.map((g: any) => ({ category: g.category, services: [] }))
      }

      const selectedGroup = groups.find(
        (g: any) => g.category?.id === selectedCategoryId.value,
      )
      return selectedGroup ? [selectedGroup] : []
    }

    // Normal: single-category filter or all categories
    if (selectedCategoryId.value) {
      const cat = categories.value.find((c: any) => c.id === selectedCategoryId.value)
      return [{ category: cat, services: filteredServices.value }]
    }

    return categories.value
      .map((cat: any) => ({
        category: cat,
        services: filteredServices.value.filter((s: any) => s.categoryId === cat.id),
      }))
      .filter((g: any) => g.services.length > 0)
  })

  // ─── Modern Minimal: masonry 2-column split ──────────────────────────────────
  const modernMinimalColumns = computed(() => {
    const left: any[] = []
    const right: any[] = []
    filteredServices.value.forEach((svc: any, index: number) => {
      if (index % 2 === 0) left.push(svc)
      else right.push(svc)
    })
    return { left, right }
  })

  // ─── Ocean: groups with all services (no search/filter applied) ──────────────
  const oceanGroups = computed(() =>
    categories.value
      .map((cat: any) => ({
        category: cat,
        services: allServices.value.filter((svc: any) => svc.categoryId === cat.id),
      }))
      .filter((group: any) => group.services.length > 0),
  )

  // ─── Dark Elegance: category tiles with service count ───────────────────────
  const darkCategoryTiles = computed(() =>
    categories.value.map((cat: any) => ({
      ...cat,
      count: allServices.value.filter((svc: any) => svc.categoryId === cat.id).length,
    })),
  )

  const darkSelectedServices = computed(() => {
    const selectedId = selectedCategoryId.value || darkCategoryTiles.value[0]?.id
    if (!selectedId) return []
    return filteredServices.value.filter((svc: any) => svc.categoryId === selectedId)
  })

  const darkUsagePercent = computed(() => {
    const total = allServices.value.length || 1
    const selected = darkSelectedServices.value.length
    return Math.max(0, Math.min(100, Math.round((selected / total) * 100)))
  })

  const darkActiveCategoryIndex = computed(() => {
    const selectedId = selectedCategoryId.value || darkCategoryTiles.value[0]?.id
    const index = darkCategoryTiles.value.findIndex((cat: any) => cat.id === selectedId)
    return index >= 0 ? index + 1 : 1
  })

  const darkActiveCategory = computed(() => {
    const selectedId = selectedCategoryId.value || darkCategoryTiles.value[0]?.id
    return darkCategoryTiles.value.find((cat: any) => cat.id === selectedId)
  })

  // ─── Theme watchers: auto-select + reset ────────────────────────────────────
  // Dark Elegance: auto-select first category when tiles load
  watch(
    [isDarkEleganceTheme, darkCategoryTiles],
    ([isDarkTheme, cats]) => {
      if (!isDarkTheme) return
      if (!cats.length) return
      if (!selectedCategoryId.value) {
        selectedCategoryId.value = cats[0].id
      }
    },
    { immediate: true },
  )

  watch(isDarkEleganceTheme, (isDarkTheme) => {
    if (!isDarkTheme) darkCategoryViewOpen.value = false
  })

  // Stitch: reset when leaving theme
  watch(isStitchTheme, (isStitch) => {
    if (!isStitch) {
      stitchCategoryViewOpen.value = false
      selectedCategoryId.value = null
    }
  })

  // Rose: reset when leaving theme
  watch(isRoseTheme, (isRose) => {
    if (!isRose) {
      roseCategoryViewOpen.value = false
      selectedCategoryId.value = null
      searchQuery.value = ''
    }
  })

  // Vibrant: auto-select first category on enter
  watch(
    [isVibrantTheme, categories],
    ([isVibrant, cats]) => {
      if (!isVibrant) return
      if (!cats.length) return
      if (!selectedCategoryId.value) {
        selectedCategoryId.value = cats[0].id
      }
    },
    { immediate: true },
  )

  watch(isVibrantTheme, (isVibrant) => {
    if (!isVibrant) selectedCategoryId.value = null
  })

  // Ocean: reset on enter
  watch(isOceanTheme, (isOcean) => {
    if (isOcean) {
      selectedCategoryId.value = null
      searchQuery.value = ''
    }
  })

  // Neon: guard invalid selectedCategoryId when categories change
  watch(
    [isNeonTheme, categories],
    ([isNeon, cats]) => {
      if (!isNeon) return
      if (!cats.length) return
      if (
        selectedCategoryId.value &&
        !cats.some((cat: any) => cat.id === selectedCategoryId.value)
      ) {
        selectedCategoryId.value = null
      }
    },
    { immediate: true },
  )

  watch(isNeonTheme, (isNeon) => {
    if (!isNeon) {
      selectedCategoryId.value = null
      searchQuery.value = ''
    }
  })

  // ─── Navigation helpers ──────────────────────────────────────────────────────
  function openDarkCategory(catId: string) {
    selectedCategoryId.value = catId
    darkCategoryViewOpen.value = true
  }

  function closeDarkCategoryView() {
    darkCategoryViewOpen.value = false
    searchQuery.value = ''
  }

  function closeStitchCategoryView() {
    stitchCategoryViewOpen.value = false
    selectedCategoryId.value = null
  }

  function toggleLegacyCategory(catId?: string) {
    if (!catId) return
    if (!isStitchTheme.value) return
    selectedCategoryId.value = catId
    stitchCategoryViewOpen.value = true
  }

  function openRoseCategory(catId?: string) {
    if (!catId) return
    selectedCategoryId.value = catId
    searchQuery.value = ''
    roseCategoryViewOpen.value = true
  }

  function closeRoseCategoryView() {
    roseCategoryViewOpen.value = false
    selectedCategoryId.value = null
    searchQuery.value = ''
  }

  function switchToAllTab() {
    closeRoseCategoryView()
    allTabAnchorRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return {
    // state
    searchQuery,
    selectedCategoryId,
    allTabAnchorRef,
    // view-open flags
    darkCategoryViewOpen,
    stitchCategoryViewOpen,
    roseCategoryViewOpen,
    // filtered / grouped
    filteredServices,
    groupedByCategory,
    modernMinimalColumns,
    oceanGroups,
    // dark elegance specific
    darkCategoryTiles,
    darkSelectedServices,
    darkUsagePercent,
    darkActiveCategoryIndex,
    darkActiveCategory,
    // navigation helpers
    openDarkCategory,
    closeDarkCategoryView,
    closeStitchCategoryView,
    toggleLegacyCategory,
    openRoseCategory,
    closeRoseCategoryView,
    switchToAllTab,
  }
}
