<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery, useMutation } from '@tanstack/vue-query'
import { categoriesApi } from '@/api/categories.api'
import { servicesApi } from '@/api/services.api'
import { trafficApi } from '@/api/traffic.api'
import apiClient from '@/api/client'
import { useAuthStore } from '@/stores/auth.store'
import { getAdminPreviewSession, type AdminPreviewPayload } from '@/lib/admin-preview-session'
import { Search, Clock, X, ChevronDown, ChevronLeft, ChevronRight, Phone, Mail, MapPin, ArrowLeft, Share2, DollarSign, Heart } from 'lucide-vue-next'
import heroImg from '@/assets/hero_customer.png'

const route = useRoute()
const authStore = useAuthStore()
const adminId = computed(() => route.params.id as string)
const publicCategoriesQueryKey = computed(() => ['public-categories', adminId.value])
const publicConfigQueryKey = computed(() => ['public-config', adminId.value])
const publicServicesQueryKey = computed(() => ['public-services', adminId.value])
const PUBLIC_MENU_REFETCH_INTERVAL_MS = 15000

const searchQuery = ref('')
const selectedCategoryId = ref<string | null>(null)
const selectedService = ref<any>(null)
const showDetail = ref(false)
const allTabAnchorRef = ref<HTMLElement | null>(null)

// Article Slide State
const currentSlideIndex = ref(0)
let slideInterval: any = null
const touchStartX = ref<number | null>(null)
const SWIPE_THRESHOLD_PX = 40

const { data: categoriesRes, isLoading: loadingCats } = useQuery({
  queryKey: publicCategoriesQueryKey,
  queryFn: async () => {
    const { data } = await categoriesApi.getActive({ adminId: adminId.value })
    return (data as any).data || data
  },
  enabled: computed(() => !!adminId.value),
  staleTime: 0,
  refetchOnMount: 'always',
  refetchOnWindowFocus: true,
  refetchInterval: PUBLIC_MENU_REFETCH_INTERVAL_MS,
})

const { data: configRes, isLoading: loadingConfig } = useQuery({
  queryKey: publicConfigQueryKey,
  queryFn: async () => {
    const { data } = await apiClient.get(`/qr-config/public?adminId=${adminId.value}`)
    return (data as any).data || data
  },
  enabled: computed(() => !!adminId.value),
  staleTime: 0,
  refetchOnMount: 'always',
  refetchOnWindowFocus: true,
})

const router = useRouter()
const spaConfig = computed(() => {
  const raw = configRes.value
  return (raw as any)?.status ? raw : (raw as any)?.data || raw || {}
})

const isSessionAdmin = computed(() => {
  return !!authStore.token && authStore.admin?.id === adminId.value
})
const hasPendingAdminSession = computed(() => !!authStore.token && !authStore.admin)

const previewSession = computed(() => getAdminPreviewSession(adminId.value))
const isAdminPreview = computed(() => isSessionAdmin.value)

const themeId = computed(() => {
  return String(getPreviewValue('themeId', spaConfig.value?.themeId || 'classic'))
})

function getPreviewValue<T extends string>(key: keyof AdminPreviewPayload, fallback: T): string | T {
  if (!isAdminPreview.value) return fallback
  const value = previewSession.value?.[key]
  if (typeof value === 'string' && value.trim()) return value
  return fallback
}

const currencyUnit = computed<'VND' | 'USD' | 'EUR'>(() => {
  const unit = String(
    getPreviewValue('currencyUnit', spaConfig.value?.currencyUnit || spaConfig.value?.currency || 'VND'),
  ).toUpperCase()
  if (unit === 'USD' || unit === 'DOLLAR') return 'USD'
  if (unit === 'EUR' || unit === 'EURO') return 'EUR'
  return 'VND'
})

const menuSize = computed<'large' | 'normal' | 'compact'>(() => {
  const size = String(
    getPreviewValue('customerUiSize', spaConfig.value?.customerUiSize || 'normal'),
  ).toLowerCase()
  if (size === 'large' || size === 'compact') return size
  return 'normal'
})

const menuFontFamily = computed(() =>
  String(getPreviewValue('fontFamily', spaConfig.value?.fontFamily || 'Inter')),
)

const MENU_FONT_STACK_MAP: Record<string, string> = {
  Inter: "'Inter', sans-serif",
  Montserrat: "'Montserrat', sans-serif",
  'Dancing Script': "'Dancing Script', cursive",
  Pacifico: "'Pacifico', cursive",
}

const resolvedMenuFontFamily = computed(() => {
  const selected = menuFontFamily.value
  return MENU_FONT_STACK_MAP[selected] || MENU_FONT_STACK_MAP.Inter
})

const LEGACY_THEME_IDS = new Set(['classic', 'rustic', 'stitch'])
const isLegacyTheme = computed(() => LEGACY_THEME_IDS.has(String(themeId.value)))
const isStitchTheme = computed(() => String(themeId.value) === 'stitch')
const isDarkEleganceTheme = computed(() => String(themeId.value) === 'dark-elegance')
const isModernMinimalTheme = computed(() => String(themeId.value) === 'modern-minimal')
const isNatureTheme = computed(() => String(themeId.value) === 'nature')
const isRoseTheme = computed(() => String(themeId.value) === 'rose')
const isVibrantTheme = computed(() => String(themeId.value) === 'vibrant')
const isOceanTheme = computed(() => String(themeId.value) === 'ocean')
const isNeonTheme = computed(() => String(themeId.value) === 'neon')

function hexToRgba(hexColor: string, alpha: number) {
  const hex = String(hexColor || '').replace('#', '').trim()
  const normalized = hex.length === 3
    ? `${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`
    : hex
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return `rgba(2, 83, 205, ${alpha})`
  const r = parseInt(normalized.slice(0, 2), 16)
  const g = parseInt(normalized.slice(2, 4), 16)
  const b = parseInt(normalized.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const customerInterfaceStyle = computed<Record<string, string>>(() => {
  const primary = String(getPreviewValue('primaryColor', spaConfig.value?.primaryColor || '#0253CD'))
  const secondary = String(getPreviewValue('secondaryColor', spaConfig.value?.secondaryColor || '#5E0B61'))
  const secondarySoft = hexToRgba(secondary, 0.12)
  const secondaryMuted = hexToRgba(secondary, 0.75)
  const family = resolvedMenuFontFamily.value

  const style: Record<string, string> = {
    '--color-primary-600': primary,
    '--color-primary-500': primary,
    '--color-primary-400': primary,
    '--color-primary-100': hexToRgba(primary, 0.15),
    '--color-text-secondary': secondary,
    '--color-text-muted': secondaryMuted,
    '--color-surface-secondary': secondarySoft,
    '--color-badge-new-bg': hexToRgba(primary, 0.2),
    '--color-badge-new-text': primary,
    '--color-badge-bestseller-bg': hexToRgba(secondary, 0.2),
    '--color-badge-bestseller-text': secondary,
    '--menu-font-family': family,
  }
  
  // Pacifico only has 400 weight. The browser can drop it or fail synthetic bolding if a heading requests 700/800.
  if (menuFontFamily.value === 'Pacifico') {
    style['--menu-title-weight'] = '400';
  } else {
    style['--menu-title-weight'] = 'inherit';
  }

  return style
})

watch([spaConfig, loadingConfig], ([config, loading]) => {
  if (hasPendingAdminSession.value) return
  const isAdmin = isAdminPreview.value
  if (!loading && config && config.status && config.status !== 'active' && !isAdmin) {
    router.replace('/404')
  }
})

const categories = computed(() => {
  const raw = categoriesRes.value
  const list = (raw as any)?.data || raw || []
  // Only show categories that have at least one service
  return list.filter((cat: any) => 
    allServices.value.some((svc: any) => svc.categoryId === cat.id)
  )
})
const allServices = computed(() => {
  const raw = servicesRes.value
  const data = (raw as any)?.data || raw
  return data?.items || data || []
})

const { data: servicesRes, isLoading: loadingServices } = useQuery({
  queryKey: publicServicesQueryKey,
  queryFn: async () => {
    // Fetch all pages so newly added services/categories are not hidden by default pagination.
    const firstResponse = await servicesApi.getPublic({
      adminId: adminId.value,
      page: 1,
      limit: 100,
    } as any)

    const firstData = (firstResponse.data as any)?.data || firstResponse.data
    const firstItems = Array.isArray(firstData?.items) ? firstData.items : []
    const totalPages = Number(firstData?.totalPages) || 1

    if (totalPages <= 1) {
      return firstItems
    }

    const requests: Promise<any>[] = []
    for (let page = 2; page <= totalPages; page += 1) {
      requests.push(
        servicesApi.getPublic({
          adminId: adminId.value,
          page,
          limit: 100,
        } as any),
      )
    }

    const nextResponses = await Promise.all(requests)
    const extraItems = nextResponses.flatMap((response) => {
      const payload = (response.data as any)?.data || response.data
      return Array.isArray(payload?.items) ? payload.items : []
    })

    return [...firstItems, ...extraItems]
  },
  enabled: computed(() => !!adminId.value),
  staleTime: 0,
  refetchOnMount: 'always',
  refetchOnWindowFocus: true,
  refetchInterval: PUBLIC_MENU_REFETCH_INTERVAL_MS,
})

const newServices = computed(() => {
  return allServices.value
    .filter((s: any) => s.isNewService)
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
})

const articleSlides = computed(() => {
  return newServices.value.length ? newServices.value : allServices.value.slice(0, 5)
})

// Auto Slide Logic
function startSlideTimer() {
  stopSlideTimer()
  if (articleSlides.value.length <= 1) return
  slideInterval = setInterval(() => {
    goToNextSlide()
  }, 5000)
}

function stopSlideTimer() {
  if (slideInterval) clearInterval(slideInterval)
}

function goToNextSlide() {
  if (!articleSlides.value.length) return
  currentSlideIndex.value = (currentSlideIndex.value + 1) % articleSlides.value.length
}

function goToPrevSlide() {
  if (!articleSlides.value.length) return
  currentSlideIndex.value =
    (currentSlideIndex.value - 1 + articleSlides.value.length) % articleSlides.value.length
}

function onSlideTouchStart(event: TouchEvent) {
  touchStartX.value = event.touches[0]?.clientX ?? null
}

function onSlideTouchEnd(event: TouchEvent) {
  if (touchStartX.value == null) return

  const endX = event.changedTouches[0]?.clientX
  if (typeof endX !== 'number') {
    touchStartX.value = null
    return
  }

  const deltaX = endX - touchStartX.value
  touchStartX.value = null
  if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return

  stopSlideTimer()
  if (deltaX < 0) goToNextSlide()
  else goToPrevSlide()
  startSlideTimer()
}

watch(articleSlides, (val) => {
  if (currentSlideIndex.value >= val.length) {
    currentSlideIndex.value = 0
  }
  if (val.length > 0) startSlideTimer()
}, { immediate: true })

onMounted(() => {
  if (authStore.token && !authStore.admin) {
    authStore.fetchProfile()
  }
  if (articleSlides.value.length > 0) startSlideTimer()
})

const { mutate: logTraffic } = useMutation({
  mutationFn: (params: { serviceId?: string; adminId: string }) => trafficApi.logVisit(params),
})

// Log overall page visit when adminId becomes available
watch(adminId, (newId) => {
  if (hasPendingAdminSession.value) return
  const isAdmin = isAdminPreview.value
  if (newId && !isAdmin) {
    logTraffic({ adminId: newId })
  }
}, { immediate: true })

watch(allServices, (services) => {
  if (!showDetail.value || !selectedService.value?.id) return
  const latest = services.find((svc: any) => svc.id === selectedService.value.id)
  if (latest) {
    selectedService.value = latest
  }
}, { deep: true })

onUnmounted(() => {
  stopSlideTimer()
})

const isInitialLoading = computed(() => loadingCats.value || loadingConfig.value || loadingServices.value)

const filteredServices = computed<any[]>(() => {
  let list = allServices.value
  if (selectedCategoryId.value && !isStitchTheme.value) {
    list = list.filter((s: any) => s.categoryId === selectedCategoryId.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter((s: any) =>
      s.name?.toLowerCase().includes(q) ||
      s.shortDescription?.toLowerCase().includes(q) ||
      s.description?.toLowerCase().includes(q)
    )
  }
  return list as any[]
})

const groupedByCategory = computed(() => {
  if (isStitchTheme.value) {
    const groups = categories.value.map((cat: any) => ({
      category: cat,
      services: filteredServices.value.filter((s: any) => s.categoryId === cat.id),
    })).filter((g: any) => g.services.length > 0)

    if (!selectedCategoryId.value || !stitchCategoryViewOpen.value) {
      return groups.map((g: any) => ({
        category: g.category,
        services: [],
      }))
    }

    const selectedGroup = groups.find((g: any) => g.category?.id === selectedCategoryId.value)
    return selectedGroup ? [selectedGroup] : []
  }

  if (selectedCategoryId.value) {
    const cat = categories.value.find((c: any) => c.id === selectedCategoryId.value)
    return [{ category: cat, services: filteredServices.value }]
  }
  return categories.value.map((cat: any) => ({
    category: cat,
    services: filteredServices.value.filter((s: any) => s.categoryId === cat.id),
  })).filter((g: any) => g.services.length > 0)
})

const modernMinimalColumns = computed(() => {
  const left: any[] = []
  const right: any[] = []
  filteredServices.value.forEach((svc: any, index: number) => {
    if (index % 2 === 0) left.push(svc)
    else right.push(svc)
  })
  return { left, right }
})

const oceanGroups = computed(() => {
  return categories.value
    .map((cat: any) => ({
      category: cat,
      services: allServices.value.filter((svc: any) => svc.categoryId === cat.id),
    }))
    .filter((group: any) => group.services.length > 0)
})

const darkCategoryTiles = computed(() => {
  return categories.value.map((cat: any) => ({
    ...cat,
    count: allServices.value.filter((svc: any) => svc.categoryId === cat.id).length,
  }))
})

const darkCategoryViewOpen = ref(false)
const stitchCategoryViewOpen = ref(false)
const roseCategoryViewOpen = ref(false)

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

watch([isDarkEleganceTheme, darkCategoryTiles], ([isDarkTheme, cats]) => {
  if (!isDarkTheme) return
  if (!cats.length) return
  if (!selectedCategoryId.value) {
    selectedCategoryId.value = cats[0].id
  }
}, { immediate: true })

watch(isDarkEleganceTheme, (isDarkTheme) => {
  if (!isDarkTheme) {
    darkCategoryViewOpen.value = false
  }
})

watch(isStitchTheme, (isStitch) => {
  if (!isStitch) {
    stitchCategoryViewOpen.value = false
    selectedCategoryId.value = null
  }
})

watch(isRoseTheme, (isRose) => {
  if (!isRose) {
    roseCategoryViewOpen.value = false
    selectedCategoryId.value = null
    searchQuery.value = ''
  }
})

watch([isVibrantTheme, categories], ([isVibrant, cats]) => {
  if (!isVibrant) return
  if (!cats.length) return
  if (!selectedCategoryId.value) {
    selectedCategoryId.value = cats[0].id
  }
}, { immediate: true })

watch(isVibrantTheme, (isVibrant) => {
  if (!isVibrant) {
    selectedCategoryId.value = null
  }
})

watch(isOceanTheme, (isOcean) => {
  if (isOcean) {
    selectedCategoryId.value = null
    searchQuery.value = ''
  }
})

watch([isNeonTheme, categories], ([isNeon, cats]) => {
  if (!isNeon) return
  if (!cats.length) return
  if (selectedCategoryId.value && !cats.some((cat: any) => cat.id === selectedCategoryId.value)) {
    selectedCategoryId.value = null
  }
}, { immediate: true })

watch(isNeonTheme, (isNeon) => {
  if (!isNeon) {
    selectedCategoryId.value = null
    searchQuery.value = ''
  }
})

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

function toggleLegacyCategory(catId?: string) {
  if (!catId) return
  if (!isStitchTheme.value) return
  selectedCategoryId.value = catId
  stitchCategoryViewOpen.value = true
}

const BADGE_STYLE_MAP: Record<string, string> = {
  best_seller: 'bg-badge-bestseller-bg text-badge-bestseller-text',
  new_service: 'bg-badge-new-bg text-badge-new-text',
  must_try: 'bg-emerald-100 text-emerald-700',
  limited_edition: 'bg-amber-100 text-amber-700',
  summer_special: 'bg-orange-100 text-orange-700',
  happy_hour: 'bg-pink-100 text-pink-700',
}

function formatNumber(price: number) {
  const locale = currencyUnit.value === 'VND' ? 'vi-VN' : 'en-US'
  return new Intl.NumberFormat(locale).format(price)
}

function formatCurrencySingle(value: number) {
  if (currencyUnit.value === 'USD') return `$${formatNumber(value)}`
  if (currencyUnit.value === 'EUR') return `€${formatNumber(value)}`
  return `${formatNumber(value)} VND`
}

function formatCurrencyRange(from: number, to: number) {
  if (currencyUnit.value === 'USD') return `$${formatNumber(from)} - $${formatNumber(to)}`
  if (currencyUnit.value === 'EUR') return `€${formatNumber(from)} - €${formatNumber(to)}`
  return `${formatNumber(from)} - ${formatNumber(to)} VND`
}

function parseOptionalNumber(value: unknown): number | undefined {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

function getServiceDisplayPrice(service: any) {
  if (service?.hasVariants && Array.isArray(service?.variantOptions) && service.variantOptions.length) {
    const prices = service.variantOptions
      .map((opt: any) => Number(opt?.price))
      .filter((p: number) => Number.isFinite(p) && p > 0)

    if (prices.length) {
      const min = Math.min(...prices)
      const max = Math.max(...prices)
      if (min !== max) return formatCurrencyRange(min, max)
      return formatCurrencySingle(min)
    }
  }

  const from = parseOptionalNumber(service?.priceFrom)
  const to = parseOptionalNumber(service?.priceTo)

  if (from !== undefined && to !== undefined) return formatCurrencyRange(from, to)
  if (from !== undefined) return formatCurrencySingle(from)
  if (to !== undefined) return formatCurrencySingle(to)

  const singlePrice = Number(service?.price)
  if (Number.isFinite(singlePrice) && singlePrice > 0) return formatCurrencySingle(singlePrice)
  return ''
}

function openDetail(service: any) {
  selectedService.value = service
  showDetail.value = true
  if (hasPendingAdminSession.value) return
  const isAdmin = isAdminPreview.value
  if (!isAdmin && adminId.value) {
    logTraffic({ serviceId: service.id, adminId: adminId.value })
  }
}

function closeDetail() {
  showDetail.value = false
  setTimeout(() => { selectedService.value = null }, 300)
}

function formatTagLabel(tag: string) {
  return tag
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function getServiceLabelItems(item: any) {
  const labels: Array<{ key: string; label: string }> = []
  if (item?.isBestSeller) labels.push({ key: 'best_seller', label: 'Best Seller' })
  if (item?.isNewService) labels.push({ key: 'new_service', label: 'New Service' })
  if (Array.isArray(item?.specialTags)) {
    item.specialTags.forEach((tag: string) => {
      const normalizedTag = String(tag || '').trim()
      if (normalizedTag) labels.push({ key: normalizedTag, label: formatTagLabel(normalizedTag) })
    })
  }

  const seen = new Set<string>()
  return labels.filter((label) => {
    if (seen.has(label.key)) return false
    seen.add(label.key)
    return true
  })
}

function getBadgeClasses(key: string) {
  if (key === 'must_try') return 'bg-primary-100 text-primary-600'
  if (key === 'limited_edition') return 'bg-surface-secondary text-text-secondary'
  return BADGE_STYLE_MAP[key] || 'bg-primary-100 text-primary-600'
}

function getDetailVariantOptions(service: any) {
  if (!service?.hasVariants || !Array.isArray(service?.variantOptions)) return []
  return service.variantOptions
    .map((opt: any) => ({
      name: String(opt?.name || '').trim(),
      price: Number(opt?.price),
    }))
    .filter((opt: any) => opt.name && Number.isFinite(opt.price) && opt.price > 0)
}
</script>

<template>
  <div :class="['menu-root min-h-screen bg-surface-page', `theme-${themeId}`, `menu-size-${menuSize}`]" :style="customerInterfaceStyle">
    <template v-if="isLegacyTheme">
    <!-- Hero Section -->
    <div class="t-hero-wrap relative w-full">
      <!-- Banner Background (Darkened to make logo pop) -->
      <div class="t-hero-banner relative h-[240px] w-full overflow-hidden">
        <div v-if="loadingConfig" class="skeleton h-full w-full"></div>
        <img
          v-else
          :src="spaConfig.bannerUrl || heroImg"
          alt="Spa Hero"
          class="h-full w-full object-cover brightness-[0.75] object-center"
        />
        <!-- Overlay for exact 'tối đi' feel -->
        <div class="absolute inset-0 bg-black/30"></div>
      </div>

      <!-- Content overlap -->
      <div class="t-hero-body relative -mt-16 flex flex-col items-center px-6 pb-6 text-center">
        <!-- Logo Avatar -->
        <div class="t-hero-logo flex h-32 w-32 items-center justify-center rounded-full border-4 border-surface bg-surface shadow-card overflow-hidden">
          <div v-if="loadingConfig" class="skeleton h-full w-full"></div>
          <img v-else-if="spaConfig.spaLogo" :src="spaConfig.spaLogo" class="h-full w-full object-cover p-1 rounded-full" />
          <span v-else class="text-5xl font-black text-primary-600">
            {{ (spaConfig.spaName || 'Q').charAt(0).toUpperCase() }}
          </span>
        </div>

        <div v-if="loadingConfig" class="mt-5 flex w-full flex-col items-center space-y-3">
          <div class="skeleton h-8 w-48 rounded-md"></div>
          <div class="skeleton h-10 w-64 rounded-full"></div>
        </div>
        <div v-else class="t-hero-meta mt-5 w-full">
          <h1 class="t-spa-name text-[28px] font-black uppercase tracking-tight text-text-primary">
            {{ spaConfig.spaName || 'QR Home Spa' }}
          </h1>
          <p v-if="spaConfig.welcomeMessage || String(themeId) === 'stitch'" class="t-hero-welcome mt-1 text-[13px] font-bold text-text-secondary">
            {{ spaConfig.welcomeMessage || 'Please select a category' }}
          </p>

          <!-- Address Pill -->
          <div v-if="spaConfig.spaAddress" class="t-hero-address mt-4 mx-auto inline-flex max-w-full items-center justify-center gap-2 rounded-full bg-surface-input px-5 py-2.5 text-[13px] font-bold text-text-secondary">
            <MapPin class="h-4 w-4 flex-shrink-0 opacity-70" />
            <span class="truncate">{{ spaConfig.spaAddress }}</span>
          </div>

          <!-- Phone & Email Info -->
          <div v-if="spaConfig.spaPhone || spaConfig.spaEmail" class="t-hero-contact mt-3 flex flex-wrap items-center justify-center gap-5 text-xs font-bold text-text-muted">
            <div v-if="spaConfig.spaPhone" class="flex items-center gap-1.5">
              <Phone class="h-3.5 w-3.5 opacity-70" /> {{ spaConfig.spaPhone }}
            </div>
            <div v-if="spaConfig.spaEmail" class="flex items-center gap-1.5">
              <Mail class="h-3.5 w-3.5 opacity-70" /> {{ spaConfig.spaEmail }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 1. Article Slide: New Services (Dynamic Carousel) -->
    <div v-if="newServices.length > 0 || loadingServices" class="t-featured-section mt-8 mb-8 overflow-hidden px-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-black tracking-tight text-text-primary">Featured Services</h2>
        <span class="text-[10px] font-bold uppercase tracking-widest text-primary-600">New Arrivals</span>
      </div>
      
      <div
        class="relative group h-48 w-full overflow-hidden rounded-[32px] shadow-card"
        @touchstart="onSlideTouchStart"
        @touchend="onSlideTouchEnd"
      >
        <template v-if="loadingServices">
          <div class="skeleton h-full w-full"></div>
        </template>
        <template v-else>
          <!-- Slides -->
          <div class="h-full w-full relative">
            <TransitionGroup name="slide-fade">
              <div
                v-for="(svc, index) in newServices"
                v-show="index === currentSlideIndex"
                :key="svc.id"
                @click="openDetail(svc)"
                class="absolute inset-0 cursor-pointer overflow-hidden"
              >
                <img
                  v-if="svc.imageUrl"
                  :src="svc.imageUrl"
                  :alt="svc.name"
                  class="h-full w-full object-cover transition-transform duration-[5000ms] ease-linear scale-100 group-hover:scale-110"
                />
                <div v-else class="flex h-full w-full items-center justify-center bg-surface-input text-5xl">
                  ✨
                </div>
                
                <!-- Content Overlay -->
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-5">
                  <h3 class="text-white font-bold text-lg leading-tight">{{ svc.name }}</h3>
                  <div class="mt-1 flex items-center justify-between">
                    <span v-if="getServiceDisplayPrice(svc)" class="text-sm font-medium text-white/90">{{ getServiceDisplayPrice(svc) }}</span>
                    <div class="flex gap-1.5">
                      <div 
                        v-for="(_, i) in newServices" 
                        :key="i"
                        class="h-1 rounded-full transition-all duration-300"
                        :class="[i === currentSlideIndex ? 'w-6 bg-white' : 'w-2 bg-white/40']"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TransitionGroup>
          </div>
        </template>
      </div>
    </div>

    <!-- Sticky Navigation Container: 2. Filter (Pills) + 3. Search -->
    <div class="t-controls-sticky sticky top-0 z-30 bg-surface-page/95 backdrop-blur-xl">
      <!-- 2. Category Pills (Filter) -->
      <div v-if="categories.length > 0 || loadingCats" class="no-scrollbar flex gap-2 overflow-x-auto px-6 py-4">
        <template v-if="loadingCats">
          <div v-for="i in 4" :key="i" class="skeleton h-8 w-20 rounded-full flex-shrink-0"></div>
        </template>
        <template v-else>
          <button
            :class="[
              'whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide transition-all',
              !selectedCategoryId
                ? 'bg-primary-600 text-white shadow-card'
                : 'bg-surface text-text-secondary ring-1 ring-border hover:bg-surface-input'
            ]"
            @click="selectedCategoryId = null"
          >
            All
          </button>
          <button
            v-for="cat in categories"
            :key="cat.id"
            :class="[
              'whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide transition-all',
              selectedCategoryId === cat.id
                ? 'bg-primary-600 text-white shadow-card'
                : 'bg-surface text-text-secondary ring-1 ring-border hover:bg-surface-input'
            ]"
            @click="selectedCategoryId = cat.id"
          >
            {{ cat.name }}
          </button>
        </template>
      </div>

      <!-- 3. Search Bar -->
      <div class="px-6 pb-4">
        <div class="relative">
          <Search class="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search services..."
            class="w-full rounded-xl border-0 bg-surface py-3 pl-11 pr-4 text-sm font-medium text-text-primary shadow-card outline-none ring-1 ring-border placeholder:text-text-muted focus:ring-2 focus:ring-primary-600"
          />
        </div>
      </div>
    </div>
 
    <!-- Services by Category -->
    <div class="t-service-section space-y-8 px-6 pb-24">
      <div v-if="isStitchTheme && stitchCategoryViewOpen" class="sticky top-0 z-30 -mx-6 mb-3 bg-surface-page/95 px-6 py-3 backdrop-blur-lg">
        <button class="inline-flex items-center gap-2 text-sm font-bold text-text-secondary" @click="closeStitchCategoryView">
          <ArrowLeft class="h-4 w-4" /> Back to categories
        </button>
      </div>

      <!-- SKELETON: Services -->
      <template v-if="loadingServices">
        <div v-for="i in 2" :key="i" class="space-y-4">
          <div class="skeleton h-6 w-32"></div>
          <div class="space-y-3">
            <div v-for="j in 3" :key="j" class="flex gap-4 rounded-2xl bg-surface p-2 shadow-card">
              <div class="skeleton h-24 w-24 flex-shrink-0 rounded-xl"></div>
              <div class="flex flex-1 flex-col justify-center py-1 space-y-2">
                <div class="skeleton h-4 w-3/4"></div>
                <div class="skeleton h-3 w-full"></div>
                <div class="skeleton h-4 w-20"></div>
              </div>
            </div>
          </div>
        </div>
      </template>
      <div v-for="group in groupedByCategory" :key="group.category?.id" class="space-y-4">
        <h2
          :class="[
            't-cat-title select-none text-xl font-extrabold tracking-tight text-text-primary ',
            isStitchTheme ? 'cursor-pointer' : '',
            isStitchTheme && selectedCategoryId === group.category?.id ? 'is-active' : ''
          ]"
          @click="toggleLegacyCategory(group.category?.id)"
          style="margin-bottom: 2rem !important;"
        >
          {{ group.category?.name }}
        </h2>

        <div v-if="group.services.length" class="t-card-grid space-y-3">
          <div
            v-for="svc in group.services"
            :key="svc.id"
            class="t-card flex cursor-pointer gap-4 rounded-2xl bg-surface p-2 shadow-card transition-all active:scale-[0.98] hover:shadow-elevated"
            @click="openDetail(svc)"
          >
            <!-- Thumbnail -->
            <div class="t-card-img relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-surface-input shadow-inner">
              <img
                v-if="svc.imageUrl"
                :src="svc.imageUrl"
                :alt="svc.name"
                class="h-full w-full object-cover"
              />
              <div v-else class="flex h-full w-full items-center justify-center text-2xl text-text-muted">
                🧖
              </div>
            </div>

            <!-- Info -->
            <div class="t-card-info flex flex-1 flex-col justify-between py-1 pr-2">
              <div>
                <h3 class="t-card-name text-[15px] font-bold text-text-primary leading-tight line-clamp-1">{{ svc.name }}</h3>
                <p class="mt-1 text-xs text-text-secondary leading-normal line-clamp-2">{{ svc.shortDescription || svc.description || 'Premium service' }}</p>
                
                <!-- Badge (Inside Info) -->
                <div class="mt-2 flex flex-wrap gap-1.5">
                  <div
                    v-for="label in getServiceLabelItems(svc)"
                    :key="label.key"
                    :class="['inline-flex rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-wider', getBadgeClasses(label.key)]"
                  >
                    {{ label.label }}
                  </div>
                </div>
              </div>
              
              <div class="t-card-price mt-1 flex items-center justify-between">
                <span v-if="getServiceDisplayPrice(svc)" class="text-base font-black text-text-primary">{{ getServiceDisplayPrice(svc) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!filteredServices.length" class="flex flex-col items-center py-16 text-text-muted">
        <span class="text-5xl">🔍</span>
        <p class="mt-4 text-sm font-medium">No services found</p>
      </div>
    </div>
    </template>

    <template v-else-if="isDarkEleganceTheme">
      <section class="min-h-screen bg-black px-6 pb-24 pt-8 text-white">
        <div class="mx-auto max-w-5xl">
          <template v-if="!darkCategoryViewOpen">
            <div class="rounded-2xl px-5 py-6">
              <div class="flex items-start gap-4">
                <div class="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl">
                  <img v-if="spaConfig.spaLogo" :src="spaConfig.spaLogo" class="h-full w-full object-cover" />
                  <div v-else class="flex h-full w-full items-center justify-center text-2xl font-black text-[#F57C00]">
                    {{ (spaConfig.spaName || 'Q').charAt(0).toUpperCase() }}
                  </div>
                </div>

                <div class="min-w-0 flex-1">
                  <p class="line-clamp-1 text-3xl font-black text-white">{{ spaConfig.spaName || 'QR Home Spa' }}</p>
                  <p v-if="spaConfig.welcomeMessage" class="mt-1 line-clamp-2 text-sm font-medium text-white/70">{{ spaConfig.welcomeMessage }}</p>
                </div>
              </div>

              <div class="mt-5 grid gap-2 text-sm text-white/80 sm:grid-cols-2">
                <div class="rounded-xl px-3 py-2 flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin-house-icon lucide-map-pin-house"><path d="M15 22a1 1 0 0 1-1-1v-4a1 1 0 0 1 .445-.832l3-2a1 1 0 0 1 1.11 0l3 2A1 1 0 0 1 22 17v4a1 1 0 0 1-1 1z"/><path d="M18 10a8 8 0 0 0-16 0c0 4.993 5.539 10.193 7.399 11.799a1 1 0 0 0 .601.2"/><path d="M18 22v-3"/><circle cx="10" cy="10" r="3"/></svg>
                  <p class="line-clamp-2 font-semibold">{{ spaConfig.spaAddress || 'Updating address' }}</p>
                </div>
                <div class="rounded-xl px-3 py-2 flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-phone-icon lucide-phone"><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"/></svg>                  <p class="line-clamp-1 font-semibold">{{ spaConfig.spaPhone || 'Updating phone' }}</p>
                </div>
                <div class="rounded-xl px-3 py-2 flex items-start gap-2 sm:col-span-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mail-icon lucide-mail"><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"/><rect x="2" y="4" width="20" height="16" rx="2"/></svg>
                  <p class="line-clamp-1 font-semibold">{{ spaConfig.spaEmail || 'Updating email' }}</p>
                </div>
              </div>
            </div>

            <div
              class="relative mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#17191F]"
              @touchstart="onSlideTouchStart"
              @touchend="onSlideTouchEnd"
            >
              <div class="relative h-44 w-full">
                <TransitionGroup name="slide-fade">
                  <button
                    v-for="(svc, index) in articleSlides"
                    v-show="index === currentSlideIndex"
                    :key="`dark-article-${svc.id}`"
                    class="absolute inset-0 text-left"
                    @click="openDetail(svc)"
                  >
                    <img v-if="svc.imageUrl" :src="svc.imageUrl" :alt="svc.name" class="h-full w-full object-cover opacity-80" />
                    <div v-else class="flex h-full w-full items-center justify-center bg-[#23252B] text-3xl">✨</div>
                    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent"></div>
                    <div class="absolute bottom-0 left-0 right-0 p-4">
                      <p class="line-clamp-1 text-xl font-black text-white">{{ svc.name }}</p>
                      <p class="text-sm font-semibold text-white/80">{{ getServiceDisplayPrice(svc) }}</p>
                    </div>
                  </button>
                </TransitionGroup>
              </div>

              <div v-if="articleSlides.length > 1" class="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
                <span
                  v-for="(_, i) in articleSlides"
                  :key="`dark-dot-${i}`"
                  class="h-1.5 rounded-full transition-all"
                  :class="i === currentSlideIndex ? 'w-6 bg-white' : 'w-2 bg-white/45'"
                />
              </div>
            </div>

            <div class="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2 ">
              <button
                v-for="cat in darkCategoryTiles"
                :key="`dark-cat-${cat.id}`"
                class="relative min-h-[180px] p-5 text-left transition-all bg-[#23252B] hover:bg-[#F57C00]/10 rounded-2xl"
                @click="openDarkCategory(cat.id)"
              >
                <p class="text-[22px] font-semibold leading-tight">{{ cat.name }}</p>
              </button>
            </div>
          </template>

          <template v-else>
            <div class="sticky top-0 z-20 -mx-6 border-b border-white/10 bg-black/95 px-6 py-4 backdrop-blur-lg">
              <button class="mb-3 inline-flex items-center gap-2 text-sm font-bold text-white/80" @click="closeDarkCategoryView">
                <ArrowLeft class="h-4 w-4" /> Back
              </button>
              <div class="relative rounded-2xl">
                <Search class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55" />
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search in selected category..."
                  class="w-full rounded-none border border-white/20 bg-[#1D1F24] py-3 pl-11 pr-4 text-sm font-semibold text-white outline-none placeholder:text-white/45 focus:border-[#F57C00]"
                  style="border-radius: 20px;"
                />
              </div>
            </div>

            <div class="mt-6 grid grid-cols-1 gap-3 pb-24 sm:grid-cols-2">
              <button
                v-for="svc in darkSelectedServices"
                :key="`dark-svc-${svc.id}`"
                class="flex min-h-[80px] items-center gap-3 bg-[#23252B] p-3 text-left ring-1 ring-white/10 transition-all hover:bg-[#2A2D35] rounded-2xl"
                @click="openDetail(svc)"
              >
                <div class="h-24 w-24 flex-shrink-0 overflow-hidden bg-[#121317] rounded-2xl">
                  <img v-if="svc.imageUrl" :src="svc.imageUrl" :alt="svc.name" class="h-full w-full object-cover rounded-2xl" />
                  <div v-else class="flex h-full w-full items-center justify-center text-2xl text-white/50">🧖</div>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="line-clamp-1 text-lg font-black text-white">{{ svc.name }}</p>
                  <p class="mt-1 line-clamp-2 text-xs font-medium text-white/60">{{ svc.shortDescription || svc.description || 'Premium service' }}</p>
                  <p class="mt-2 text-sm font-black text-[#F57C00]">{{ getServiceDisplayPrice(svc) }}</p>
                </div>
              </button>
            </div>

            <div v-if="!darkSelectedServices.length" class="mt-10 border border-white/10 bg-[#1B1D23] py-12 text-center text-white/60">
              <p class="text-base font-semibold">No services in this category</p>
            </div>
          </template>
        </div>
      </section>
    </template>

    <template v-else>
      <!-- New Layout For Non-Legacy Themes -->
      <section class="nl-hero-shell relative overflow-hidden px-6 pb-6 pt-8">
        <template v-if="isNeonTheme">
          <div class="neon-hero-card rounded-[30px] p-5 sm:p-6">
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0 flex-1">
                <p class="line-clamp-1 text-3xl font-black text-white">{{ spaConfig.spaName || 'Neon Lounge' }}</p>
                <p class="mt-1 line-clamp-2 text-sm font-semibold text-cyan-100/85">
                  {{ spaConfig.welcomeMessage || 'Tactical care mode engaged' }}
                </p>
              </div>
              <div class="neon-hero-logo h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl">
                <img v-if="spaConfig.spaLogo" :src="spaConfig.spaLogo" class="h-full w-full object-cover" />
                <div v-else class="flex h-full w-full items-center justify-center text-xl font-black text-cyan-100">
                  {{ (spaConfig.spaName || 'Q').charAt(0).toUpperCase() }}
                </div>
              </div>
            </div>

            <div class="mt-4 grid gap-2 text-xs font-semibold text-cyan-100/85 sm:grid-cols-3">
              <div class="neon-hero-chip rounded-xl px-3 py-2">{{ spaConfig.spaAddress || 'Address updating' }}</div>
              <div class="neon-hero-chip rounded-xl px-3 py-2">{{ spaConfig.spaPhone || 'Phone updating' }}</div>
              <div class="neon-hero-chip rounded-xl px-3 py-2">{{ spaConfig.spaEmail || 'Email updating' }}</div>
            </div>
          </div>
        </template>

        <template v-else-if="isOceanTheme">
          <div class="ocean-hero-card rounded-[28px] p-5">
            <div class="flex items-center gap-4">
              <div class="ocean-hero-logo h-14 w-14 flex-shrink-0 overflow-hidden rounded-2xl">
                <img v-if="spaConfig.spaLogo" :src="spaConfig.spaLogo" class="h-full w-full object-cover" />
                <div v-else class="flex h-full w-full items-center justify-center text-lg font-black text-white">
                  {{ (spaConfig.spaName || 'Q').charAt(0).toUpperCase() }}
                </div>
              </div>

              <div class="min-w-0 flex-1">
                <p class="line-clamp-1 text-2xl font-black text-white">{{ spaConfig.spaName || 'QR Home' }}</p>
                <p class="line-clamp-1 text-sm font-semibold text-white/80">{{ spaConfig.welcomeMessage || 'Freshly curated menu' }}</p>
              </div>

            </div>
          </div>
        </template>

        <template v-else>
          <div class="absolute -right-12 -top-10 h-40 w-40 rounded-full bg-primary-100/70 blur-2xl"></div>
          <div class="absolute -left-16 bottom-0 h-44 w-44 rounded-full bg-surface-secondary blur-2xl"></div>

          <div class="nl-hero-card relative rounded-[28px] bg-white/90 p-5 shadow-card ring-1 ring-border backdrop-blur-md">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h1 class="mt-2 text-3xl font-black leading-tight text-text-primary">
                  {{ spaConfig.spaName || 'QR Home ' }}
                </h1>
                <p v-if="spaConfig.welcomeMessage" class="mt-2 text-sm font-medium text-text-secondary">
                  {{ spaConfig.welcomeMessage }}
                </p>
              </div>
              <div class="w-[140px] aspect-square overflow-hidden rounded-full bg-surface-input shadow-inner ring-1 ring-border">
                <img v-if="spaConfig.spaLogo" :src="spaConfig.spaLogo" class="h-full w-full object-cover rounded-full" />
                <div v-else class="flex h-full w-full items-center justify-center text-xl font-black text-primary-600">
                  {{ (spaConfig.spaName || 'Q').charAt(0).toUpperCase() }}
                </div>
              </div>
            </div>

            <div class="mt-4 grid gap-2 text-xs font-semibold text-text-secondary sm:grid-cols-3">
              <div class="rounded-xl bg-surface px-3 py-2 flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg"width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin-house-icon lucide-map-pin-house"><path d="M15 22a1 1 0 0 1-1-1v-4a1 1 0 0 1 .445-.832l3-2a1 1 0 0 1 1.11 0l3 2A1 1 0 0 1 22 17v4a1 1 0 0 1-1 1z"/><path d="M18 10a8 8 0 0 0-16 0c0 4.993 5.539 10.193 7.399 11.799a1 1 0 0 0 .601.2"/><path d="M18 22v-3"/><circle cx="10" cy="10" r="3"/></svg>
                {{ spaConfig.spaAddress || 'Address updating' }}
              </div>
              <div class="rounded-xl bg-surface px-3 py-2 flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-phone-icon lucide-phone"><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"/></svg>
                {{ spaConfig.spaPhone || 'Phone updating' }}
              </div>
              <div class="rounded-xl bg-surface px-3 py-2 flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mail-icon lucide-mail"><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"/><rect x="2" y="4" width="20" height="16" rx="2"/></svg>
                {{ spaConfig.spaEmail || 'Email updating' }}
              </div>
            </div>
          </div>
        </template>
      </section>

      <section v-if="isNeonTheme" class="neon-feature-shell px-6">
        <div class="neon-feature-card rounded-[28px] p-4 sm:p-5">
          <div
            class="relative h-56 overflow-hidden rounded-3xl"
            @touchstart="onSlideTouchStart"
            @touchend="onSlideTouchEnd"
          >
            <TransitionGroup name="slide-fade">
              <button
                v-for="(svc, index) in articleSlides"
                v-show="index === currentSlideIndex"
                :key="`neon-article-${svc.id}`"
                @click="openDetail(svc)"
                class="absolute inset-0 text-left"
              >
                <img v-if="svc.imageUrl" :src="svc.imageUrl" :alt="svc.name" class="h-full w-full object-cover" />
                <div v-else class="flex h-full w-full items-center justify-center bg-slate-900 text-3xl text-cyan-200">⚡</div>
                <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/30 to-transparent"></div>
                <div class="absolute bottom-0 left-0 right-0 p-4">
                  <p class="line-clamp-1 text-2xl font-black text-white">{{ svc.name }}</p>
                  <p class="text-sm font-semibold text-cyan-100/90">{{ getServiceDisplayPrice(svc) }}</p>
                </div>
              </button>
            </TransitionGroup>

            <div v-if="articleSlides.length > 1" class="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
              <span
                v-for="(_, i) in articleSlides"
                :key="`neon-dot-${i}`"
                class="h-1.5 rounded-full transition-all"
                :class="i === currentSlideIndex ? 'w-6 bg-cyan-300' : 'w-2 bg-cyan-300/45'"
              />
            </div>
          </div>
        </div>
      </section>

      <section v-if="isNeonTheme" class="neon-search-shell px-6 mt-4">
        <div class="relative">
          <Search class="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cyan-300/60" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search cyber services..."
            class="w-full rounded-[20px] border border-cyan-500/30 bg-slate-900/60 py-3.5 pl-12 pr-4 text-sm font-bold text-white shadow-inner outline-none placeholder:text-cyan-100/50 focus:border-cyan-400/80 focus:ring-1 focus:ring-cyan-500/50"
          />
        </div>
      </section>

      <section v-if="isNeonTheme" class="neon-dock fixed bottom-5 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2">
        <div class="neon-dock-card shadow-2xl backdrop-blur-xl rounded-[28px] p-2 border border-cyan-500/30 bg-slate-950/85">
          <div class="neon-mode-tabs no-scrollbar flex gap-2 overflow-x-auto p-1">
            <button
              :class="['neon-mode-tab flex-shrink-0 flex flex-col items-center justify-center p-2 rounded-2xl transition-all min-w-[72px]', !selectedCategoryId ? 'bg-cyan-500/20 text-cyan-50 ring-1 ring-cyan-400/50' : 'text-slate-400 hover:text-cyan-200']"
              @click="selectedCategoryId = null"
            >
              <div :class="['h-9 w-9 rounded-[14px] flex items-center justify-center mb-1.5 transition-all', !selectedCategoryId ? 'bg-cyan-400/20 shadow-[0_0_10px_rgba(34,211,238,0.3)]' : 'bg-slate-800/80 ring-1 ring-white/10']">✨</div>
              <span class="text-[10px] font-black uppercase tracking-wider">All</span>
            </button>

            <button
              v-for="cat in categories"
              :key="`neon-tab-${cat.id}`"
              :class="['neon-mode-tab flex-shrink-0 flex flex-col items-center justify-center p-2 rounded-2xl transition-all min-w-[72px]', selectedCategoryId === cat.id ? 'bg-cyan-500/20 text-cyan-50 ring-1 ring-cyan-400/50' : 'text-slate-400 hover:text-cyan-200']"
              @click="selectedCategoryId = cat.id"
            >
              <div :class="['h-9 w-9 rounded-[14px] flex items-center justify-center mb-1.5 transition-all text-xs font-black', selectedCategoryId === cat.id ? 'bg-cyan-400/20 shadow-[0_0_10px_rgba(34,211,238,0.3)] text-cyan-300' : 'bg-slate-800/80 ring-1 ring-white/10 text-slate-300']">
                {{ (cat.name || 'C').charAt(0).toUpperCase() }}
              </div>
              <span class="line-clamp-1 w-full text-center text-[10px] font-black uppercase tracking-wider">{{ cat.name }}</span>
            </button>
          </div>
        </div>
      </section>

      <section v-else-if="!isOceanTheme" class="nl-feature-shell px-6">
        <div class="overflow-hidden rounded-[30px] shadow-card">

          <div v-if="loadingServices" class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div v-for="i in 4" :key="`new-layout-skeleton-${i}`" class="h-28 rounded-2xl bg-surface-input animate-pulse"></div>
          </div>

          <div
            v-else-if="isModernMinimalTheme || isNatureTheme || isRoseTheme"
            class="relative h-56 overflow-hidden rounded-2xl"
            @touchstart="onSlideTouchStart"
            @touchend="onSlideTouchEnd"
          >
            <TransitionGroup name="slide-fade">
              <button
                v-for="(svc, index) in articleSlides"
                v-show="index === currentSlideIndex"
                :key="`${isNatureTheme ? 'nature' : isRoseTheme ? 'rose' : 'modern'}-article-${svc.id}`"
                @click="openDetail(svc)"
                class="absolute inset-0 text-left"
              >
                <img v-if="svc.imageUrl" :src="svc.imageUrl" :alt="svc.name" class="h-full w-full object-cover" />
                <div v-else class="flex h-full w-full items-center justify-center bg-surface-input text-3xl">✨</div>
                <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                <div class="absolute bottom-0 left-0 right-0 p-4">
                  <p class="line-clamp-1 text-2xl font-black text-white">{{ svc.name }}</p>
                  <p class="text-base font-bold text-white/90">{{ getServiceDisplayPrice(svc) }}</p>
                </div>
              </button>
            </TransitionGroup>

            <div v-if="articleSlides.length > 1" class="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
              <span
                v-for="(_, i) in articleSlides"
                :key="`modern-dot-${i}`"
                class="h-1.5 rounded-full transition-all"
                :class="i === currentSlideIndex ? 'w-6 bg-white' : 'w-2 bg-white/45'"
              />
            </div>
          </div>

          <div v-else class="nl-feature-grid grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              v-for="svc in (newServices.length ? newServices.slice(0, 4) : allServices.slice(0, 4))"
              :key="`feature-${svc.id}`"
              @click="openDetail(svc)"
              class="nl-feature-card group relative overflow-hidden rounded-2xl bg-surface text-left ring-1 ring-border transition-all hover:-translate-y-0.5 hover:shadow-elevated"
            >
              <div class="absolute inset-0 bg-gradient-to-r from-black/65 to-transparent"></div>
              <img v-if="svc.imageUrl" :src="svc.imageUrl" :alt="svc.name" class="h-28 w-full object-cover" />
              <div v-else class="flex h-28 items-center justify-center bg-surface-input text-3xl">✨</div>
              <div class="absolute inset-0 flex flex-col justify-end p-3">
                <p class="line-clamp-1 text-sm font-black text-white">{{ svc.name }}</p>
                <p class="text-xs font-bold text-white/90">{{ getServiceDisplayPrice(svc) }}</p>
              </div>
            </button>
          </div>
        </div>
      </section>

      <section ref="allTabAnchorRef" v-if="!isNatureTheme && !isVibrantTheme && !isOceanTheme && !isNeonTheme && !(isRoseTheme && roseCategoryViewOpen)" class="nl-controls sticky top-0 z-30 mt-6 border-y border-border bg-surface-page/95 px-6 py-3 backdrop-blur-lg">
        <template v-if="isModernMinimalTheme">
          <div class="space-y-3">
            <div class="relative w-full">
              <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Find your service"
                class="w-full rounded-xl border-0 bg-white py-2.5 pl-10 pr-3 text-sm font-semibold text-text-primary ring-1 ring-border outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>

            <div class="no-scrollbar flex items-center gap-5 overflow-x-auto pb-0.5">
              <button
                :class="[
                  'whitespace-nowrap border-b-2 pb-1 text-base font-medium transition-colors',
                  !selectedCategoryId ? 'border-text-primary text-text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
                ]"
                @click="selectedCategoryId = null"
              >
                All
              </button>
              <button
                v-for="cat in categories"
                :key="`modern-tab-cat-${cat.id}`"
                :class="[
                  'whitespace-nowrap border-b-2 pb-1 text-base font-medium transition-colors',
                  selectedCategoryId === cat.id ? 'border-text-primary text-text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
                ]"
                @click="selectedCategoryId = cat.id"
              >
                {{ cat.name }}
              </button>
            </div>
          </div>
        </template>

        <template v-else>
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="no-scrollbar flex gap-2 overflow-x-auto pb-1">
              <button
                :class="[
                  'whitespace-nowrap rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wider transition-all',
                  !selectedCategoryId ? 'bg-primary-600 text-white' : 'bg-white text-text-secondary ring-1 ring-border hover:bg-surface'
                ]"
                @click="selectedCategoryId = null"
              >
                All Menu
              </button>
              <button
                v-for="cat in categories"
                :key="`new-layout-cat-${cat.id}`"
                :class="[
                  'whitespace-nowrap rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wider transition-all',
                  selectedCategoryId === cat.id ? 'bg-primary-600 text-white' : 'bg-white text-text-secondary ring-1 ring-border hover:bg-surface'
                ]"
                @click="selectedCategoryId = cat.id"
              >
                {{ cat.name }}
              </button>
            </div>

            <div class="relative w-full sm:w-72">
              <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Find your service"
                class="w-full rounded-xl border-0 bg-white py-2.5 pl-10 pr-3 text-sm font-semibold text-text-primary ring-1 ring-border outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>
          </div>
        </template>
      </section>

      <section class="nl-services space-y-8 px-6 pb-24 pt-6">
        <div v-if="isNatureTheme" class="nl-controls nl-controls-nature z-30">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="no-scrollbar flex gap-2 overflow-x-auto pb-1">
              <button
                :class="[
                  'whitespace-nowrap rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wider transition-all',
                  !selectedCategoryId ? 'bg-primary-600 text-white' : 'bg-white text-text-secondary ring-1 ring-border hover:bg-surface'
                ]"
                @click="selectedCategoryId = null"
              >
                All Menu
              </button>
              <button
                v-for="cat in categories"
                :key="`nature-body-cat-${cat.id}`"
                :class="[
                  'whitespace-nowrap rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wider transition-all',
                  selectedCategoryId === cat.id ? 'bg-primary-600 text-white' : 'bg-white text-text-secondary ring-1 ring-border hover:bg-surface'
                ]"
                @click="selectedCategoryId = cat.id"
              >
                {{ cat.name }}
              </button>
            </div>
          </div>
        </div>

        <template v-if="loadingServices">
          <div v-for="i in 2" :key="`new-layout-list-skeleton-${i}`" class="space-y-4">
            <div class="h-6 w-32 rounded bg-surface-input animate-pulse"></div>
            <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div v-for="j in 4" :key="`new-layout-card-skeleton-${i}-${j}`" class="h-28 rounded-2xl bg-surface-input animate-pulse"></div>
            </div>
          </div>
        </template>

        <template v-else-if="isModernMinimalTheme">
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-3">
              <button
                v-for="(svc, idx) in modernMinimalColumns.left"
                :key="`modern-left-${svc.id}`"
                class="w-full overflow-hidden rounded-[22px] bg-white text-left shadow-card transition-all hover:shadow-elevated"
                @click="openDetail(svc)"
              >
                <div class="relative overflow-hidden" :class="idx === 0 ? 'h-56' : 'h-44'">
                  <img v-if="svc.imageUrl" :src="svc.imageUrl" :alt="svc.name" class="h-full w-full object-cover" />
                  <div v-else class="flex h-full w-full items-center justify-center bg-surface-input text-3xl">✨</div>
                </div>
                <div class="p-3">
                  <p class="line-clamp-1 text-sm font-black text-text-primary">{{ svc.name }}</p>
                  <p class="mt-1 text-xs font-semibold text-primary-700">{{ getServiceDisplayPrice(svc) }}</p>
                </div>
              </button>
            </div>

            <div class="space-y-3 pt-6">
              <button
                v-for="(svc, idx) in modernMinimalColumns.right"
                :key="`modern-right-${svc.id}`"
                class="w-full overflow-hidden rounded-[22px] bg-white text-left shadow-card transition-all hover:shadow-elevated"
                @click="openDetail(svc)"
              >
                <div class="relative overflow-hidden" :class="idx === 0 ? 'h-44' : 'h-52'">
                  <img v-if="svc.imageUrl" :src="svc.imageUrl" :alt="svc.name" class="h-full w-full object-cover" />
                  <div v-else class="flex h-full w-full items-center justify-center bg-surface-input text-3xl">✨</div>
                  <div class="absolute right-2 top-2 rounded-full bg-white/85 px-1.5 py-0.5 text-xs font-black text-text-primary">...</div>
                </div>
                <div class="p-3">
                  <p class="line-clamp-1 text-sm font-black text-text-primary">{{ svc.name }}</p>
                  <p class="mt-1 text-xs font-semibold text-primary-700">{{ getServiceDisplayPrice(svc) }}</p>
                </div>
              </button>
            </div>
          </div>

          <div v-if="!filteredServices.length" class="rounded-3xl bg-white py-14 text-center text-text-muted shadow-card ring-1 ring-border">
            <p class="text-3xl">🍽️</p>
            <p class="mt-3 text-sm font-semibold">No matching services</p>
          </div>
        </template>

        <template v-else>
          <template v-if="isNeonTheme">
            <div class="neon-menu-shell">
              <div class="neon-bento-grid mt-4">
                <button
                  v-for="(svc, index) in filteredServices"
                  :key="`neon-svc-${svc.id}`"
                  :class="[
                    'neon-bento-item text-left relative overflow-hidden transition-all duration-300 hover:scale-[0.98]',
                    index % 5 === 0 ? 'neon-bento-large' : 'neon-bento-small'
                  ]"
                  @click="openDetail(svc)"
                >
                  <div class="absolute inset-0 bg-slate-900 border border-white/5 rounded-[24px]"></div>
                  
                  <div class="absolute inset-0 overflow-hidden rounded-[24px]">
                    <img v-if="svc.imageUrl" :src="svc.imageUrl" :alt="svc.name" class="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
                    <div v-else class="flex h-full w-full items-center justify-center bg-slate-900 text-3xl text-cyan-200">⚡</div>
                  </div>

                  <div :class="['absolute inset-0 bg-gradient-to-t rounded-[24px]', index % 5 === 0 ? 'from-slate-950 via-slate-900/60 to-transparent' : 'from-slate-950 to-transparent']"></div>
                  
                  <div class="absolute inset-x-0 bottom-0 p-4">
                    <p :class="[index % 5 === 0 ? 'text-[32px]' : 'text-lg', 'font-black leading-none text-white line-clamp-2']">{{ svc.name }}</p>
                    <p v-if="index % 5 === 0" class="mt-1 line-clamp-1 text-sm font-medium text-cyan-100/70">{{ svc.shortDescription || svc.description || 'Premium hyper-service' }}</p>
                    <p :class="[index % 5 === 0 ? 'mt-3 text-lg' : 'mt-1 text-sm', 'font-black text-cyan-300']">{{ getServiceDisplayPrice(svc) }}</p>
                  </div>
                </button>
              </div>

              <div v-if="!filteredServices.length" class="mt-6 rounded-3xl border border-cyan-300/25 bg-slate-900/45 py-12 text-center text-cyan-100/75">
                <p class="text-base font-semibold">No services in this mode</p>
              </div>
            </div>
          </template>

          <template v-else-if="isOceanTheme">
            <div class="ocean-menu-shell space-y-7">
              <div
                v-for="group in oceanGroups"
                :key="`ocean-group-${group.category?.id}`"
                class="ocean-menu-group"
              >
                <div class="ocean-menu-head flex items-center gap-2">
                  <span class="ocean-menu-dot" aria-hidden="true"></span>
                  <h3 class="line-clamp-1 text-[23px] font-black text-text-primary">{{ group.category?.name }}</h3>
                </div>

                <div class="ocean-service-track no-scrollbar mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1">
                  <button
                    v-for="svc in group.services"
                    :key="`ocean-svc-${svc.id}`"
                    class="ocean-service-card w-[178px] flex-shrink-0 snap-start text-left"
                    @click="openDetail(svc)"
                  >
                    <div class="ocean-service-media h-36 w-full overflow-hidden bg-surface-input">
                      <img v-if="svc.imageUrl" :src="svc.imageUrl" :alt="svc.name" class="h-full w-full object-cover" />
                      <div v-else class="flex h-full w-full items-center justify-center text-3xl text-text-muted">🧋</div>
                    </div>

                    <div class="ocean-service-body px-3 py-2.5">
                      <p class="line-clamp-2 text-[13px] font-black text-white">{{ svc.name }}</p>
                      <p class="mt-1 text-sm font-black text-white/90">{{ getServiceDisplayPrice(svc) }}</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </template>

          <template v-else-if="isVibrantTheme">
            <div class="vibrant-header-shell mb-4 rounded-[26px] p-4 sm:p-5">
              <div class="vibrant-header-top flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="line-clamp-1 text-2xl font-black text-white">
                    {{ spaConfig.spaName || 'QR Home Spa' }}
                  </p>
                  <p v-if="spaConfig.welcomeMessage" class="mt-1 line-clamp-2 text-sm font-semibold text-white/80">
                    {{ spaConfig.welcomeMessage }}
                  </p>
                </div>
                <div class="h-14 w-14 flex-shrink-0 overflow-hidden rounded-2xl bg-white/20 ring-1 ring-white/30">
                  <img v-if="spaConfig.spaLogo" :src="spaConfig.spaLogo" class="h-full w-full object-cover" />
                  <div v-else class="flex h-full w-full items-center justify-center text-xl font-black text-white">
                    {{ (spaConfig.spaName || 'Q').charAt(0).toUpperCase() }}
                  </div>
                </div>
              </div>

              <div
                class="vibrant-article-shell mt-4 relative h-44 overflow-hidden rounded-3xl"
                @touchstart="onSlideTouchStart"
                @touchend="onSlideTouchEnd"
              >
                <TransitionGroup name="slide-fade">
                  <button
                    v-for="(svc, index) in articleSlides"
                    v-show="index === currentSlideIndex"
                    :key="`vibrant-article-${svc.id}`"
                    class="absolute inset-0 text-left"
                    @click="openDetail(svc)"
                  >
                    <img v-if="svc.imageUrl" :src="svc.imageUrl" :alt="svc.name" class="h-full w-full object-cover" />
                    <div v-else class="flex h-full w-full items-center justify-center bg-white/20 text-3xl text-white">✨</div>
                    <div class="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent"></div>
                    <div class="absolute bottom-0 left-0 right-0 p-3">
                      <p class="line-clamp-1 text-lg font-black text-white">{{ svc.name }}</p>
                      <p class="text-sm font-bold text-white/90">{{ getServiceDisplayPrice(svc) }}</p>
                    </div>
                  </button>
                </TransitionGroup>

                <div v-if="articleSlides.length > 1" class="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
                  <span
                    v-for="(_, i) in articleSlides"
                    :key="`vibrant-dot-${i}`"
                    class="h-1.5 rounded-full transition-all"
                    :class="i === currentSlideIndex ? 'w-6 bg-white' : 'w-2 bg-white/50'"
                  />
                </div>
              </div>
            </div>

            <div class="vibrant-menu-shell rounded-[30px] p-3 sm:p-4">
              <div class="vibrant-menu-layout flex gap-3 sm:gap-4">
                <aside class="vibrant-category-rail no-scrollbar">
                  <button
                    type="button"
                    title="All"
                    aria-label="All"
                    :class="[
                      'vibrant-cat-pill',
                      !selectedCategoryId ? 'is-active' : ''
                    ]"
                    @click="selectedCategoryId = null"
                  >
                    <span class="vibrant-cat-pill-text">All</span>
                  </button>
                  <button
                    v-for="cat in categories"
                    :key="`vibrant-cat-${cat.id}`"
                    type="button"
                    :title="cat.name"
                    :aria-label="cat.name"
                    :class="[
                      'vibrant-cat-pill',
                      selectedCategoryId === cat.id ? 'is-active' : ''
                    ]"
                    @click="selectedCategoryId = cat.id"
                  >
                    <span class="vibrant-cat-pill-text">{{ cat.name }}</span>
                  </button>
                </aside>

                <div class="vibrant-card-list flex-1 space-y-3">
                  <button
                    v-for="svc in filteredServices"
                    :key="`vibrant-svc-${svc.id}`"
                    class="vibrant-card w-full text-left"
                    @click="openDetail(svc)"
                  >
                    <div class="vibrant-card-media">
                      <img v-if="svc.imageUrl" :src="svc.imageUrl" :alt="svc.name" class="h-full w-full object-cover" />
                      <div v-else class="flex h-full w-full items-center justify-center text-2xl text-text-muted">🥤</div>
                    </div>

                    <div class="vibrant-card-body">
                      <p class="line-clamp-1 text-[20px] font-black leading-tight text-text-primary">{{ svc.name }}</p>
                      <p class="mt-1 text-lg font-black text-text-secondary">{{ getServiceDisplayPrice(svc) }}</p>
                    </div>
                  </button>

                  <div v-if="!filteredServices.length" class="vibrant-empty rounded-3xl py-12 text-center">
                    <p class="text-base font-semibold text-white/80">No services in this category</p>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <template v-else-if="isRoseTheme">
            <template v-if="!roseCategoryViewOpen">
              <div v-for="group in groupedByCategory" :key="`rose-group-${group.category?.id}`" class="space-y-3">
                <div class="flex items-center gap-3">
                  <h3 class="nl-group-title text-lg font-black uppercase tracking-tight text-text-primary">{{ group.category?.name }}</h3>
                  <span class="h-px flex-1 bg-border"></span>
                  <button
                    type="button"
                    class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-surface text-text-muted ring-1 ring-border transition-all hover:bg-surface-input"
                    @click="openRoseCategory(group.category?.id)"
                    aria-label="Open full category menu"
                    title="Open full category menu"
                  >
                    <ChevronRight class="h-3.5 w-3.5" />
                  </button>
                </div>

                <div class="rose-service-track no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1">
                  <button
                    v-for="svc in group.services"
                    :key="`rose-slide-${svc.id}`"
                    class="rose-service-slide group w-[78%] flex-shrink-0 snap-start overflow-hidden rounded-3xl bg-white p-3 text-left shadow-card ring-1 ring-border transition-all hover:shadow-elevated sm:w-[46%]"
                    @click="openDetail(svc)"
                  >
                    <div class="rose-slide-img h-36 w-full overflow-hidden rounded-2xl bg-surface-input">
                      <img v-if="svc.imageUrl" :src="svc.imageUrl" :alt="svc.name" class="h-full w-full object-cover" />
                      <div v-else class="flex h-full w-full items-center justify-center text-2xl text-text-muted">🧴</div>
                    </div>

                    <div class="rose-slide-info mt-3">
                      <p class="line-clamp-1 text-[18px] font-black text-text-primary">{{ svc.name }}</p>
                      <p class="mt-1 line-clamp-1 text-xs font-medium text-text-secondary">{{ svc.shortDescription || svc.description || 'Premium service' }}</p>
                      <div class="mt-2 flex flex-wrap gap-1.5">
                        <span
                          v-for="label in getServiceLabelItems(svc)"
                          :key="`rose-label-${svc.id}-${label.key}`"
                          :class="['rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider', getBadgeClasses(label.key)]"
                        >
                          {{ label.label }}
                        </span>
                      </div>
                      <p class="rose-slide-price mt-3 text-[30px] font-black text-primary-700">{{ getServiceDisplayPrice(svc) }}</p>
                    </div>
                  </button>
                </div>
              </div>
            </template>

            <template v-else>
              <div class="sticky top-0 z-20 -mx-6 border-b border-border bg-surface-page/95 px-6 py-4 backdrop-blur-lg">
                <button class="mb-3 inline-flex items-center gap-2 text-sm font-bold text-text-secondary" @click="closeRoseCategoryView">
                  <ArrowLeft class="h-4 w-4" /> Back
                </button>
                <div class="relative rounded-2xl">
                  <Search class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <input
                    v-model="searchQuery"
                    type="text"
                    placeholder="Search in selected category..."
                    class="w-full rounded-xl border border-border bg-white py-3 pl-11 pr-4 text-sm font-semibold text-text-primary outline-none placeholder:text-text-muted focus:border-primary-500"
                  />
                </div>
              </div>

              <div class="space-y-3">
                <div class="flex items-center gap-3">
                  <h3 class="nl-group-title text-lg font-black uppercase tracking-tight text-text-primary">{{ categories.find((c: any) => c.id === selectedCategoryId)?.name || 'Category' }}</h3>
                  <span class="h-px flex-1 bg-border"></span>
                  <button
                    type="button"
                    class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-surface text-text-muted ring-1 ring-border transition-all hover:bg-surface-input"
                    @click="switchToAllTab"
                    aria-label="View all menu"
                    title="View all menu"
                  >
                    <ChevronRight class="h-3.5 w-3.5" />
                  </button>
                </div>

                <div class="nl-service-grid grid grid-cols-1 gap-3 md:grid-cols-2">
                  <button
                    v-for="svc in filteredServices"
                    :key="`rose-full-${svc.id}`"
                    class="nl-service-card group flex items-stretch gap-3 overflow-hidden rounded-2xl bg-white p-2 text-left shadow-card ring-1 ring-border transition-all hover:-translate-y-0.5 hover:shadow-elevated"
                    @click="openDetail(svc)"
                  >
                    <div class="nl-service-img h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-surface-input">
                      <img v-if="svc.imageUrl" :src="svc.imageUrl" :alt="svc.name" class="h-full w-full object-cover" />
                      <div v-else class="flex h-full w-full items-center justify-center text-2xl text-text-muted">🧴</div>
                    </div>

                    <div class="nl-service-info flex min-w-0 flex-1 flex-col justify-between py-1">
                      <div>
                        <p class="line-clamp-1 text-[15px] font-black text-text-primary">{{ svc.name }}</p>
                        <p class="mt-1 line-clamp-2 text-xs font-medium text-text-secondary">{{ svc.shortDescription || svc.description || 'Premium service' }}</p>
                        <div class="mt-2 flex flex-wrap gap-1.5">
                          <span
                            v-for="label in getServiceLabelItems(svc)"
                            :key="`rose-full-label-${svc.id}-${label.key}`"
                            :class="['rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider', getBadgeClasses(label.key)]"
                          >
                            {{ label.label }}
                          </span>
                        </div>
                      </div>
                      <p class="nl-service-price mt-2 text-sm font-black text-primary-700">{{ getServiceDisplayPrice(svc) }}</p>
                    </div>
                  </button>
                </div>
              </div>
            </template>
          </template>

          <div v-else v-for="group in groupedByCategory" :key="`new-layout-group-${group.category?.id}`" class="space-y-3">
            <div class="flex items-center gap-3">
              <h3 class="nl-group-title text-lg font-black uppercase tracking-tight text-text-primary">{{ group.category?.name }}</h3>
              <span class="h-px flex-1 bg-border"></span>
              <span class="rounded-full bg-surface px-2.5 py-1 text-[10px] font-black text-text-muted">{{ group.services.length }} items</span>
            </div>

            <div class="nl-service-grid grid grid-cols-1 gap-3 md:grid-cols-2">
              <button
                v-for="svc in group.services"
                :key="`new-layout-service-${svc.id}`"
                class="nl-service-card group flex items-stretch gap-3 overflow-hidden rounded-2xl bg-white p-2 text-left shadow-card ring-1 ring-border transition-all hover:-translate-y-0.5 hover:shadow-elevated"
                @click="openDetail(svc)"
              >
                <div class="nl-service-img h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-surface-input">
                  <img v-if="svc.imageUrl" :src="svc.imageUrl" :alt="svc.name" class="h-full w-full object-cover" />
                  <div v-else class="flex h-full w-full items-center justify-center text-2xl text-text-muted">🧖</div>
                </div>

                <div class="nl-service-info flex min-w-0 flex-1 flex-col justify-between py-1">
                  <div>
                    <p class="line-clamp-1 text-[15px] font-black text-text-primary">{{ svc.name }}</p>
                    <p class="mt-1 line-clamp-2 text-xs font-medium text-text-secondary">{{ svc.shortDescription || svc.description || 'Premium service' }}</p>
                    <div class="mt-2 flex flex-wrap gap-1.5">
                      <span
                        v-for="label in getServiceLabelItems(svc)"
                        :key="`new-layout-label-${svc.id}-${label.key}`"
                        :class="['rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider', getBadgeClasses(label.key)]"
                      >
                        {{ label.label }}
                      </span>
                    </div>
                  </div>
                  <p class="nl-service-price mt-2 text-sm font-black text-primary-700">{{ getServiceDisplayPrice(svc) }}</p>
                </div>
              </button>
            </div>
          </div>

          <div v-if="!filteredServices.length" class="rounded-3xl bg-white py-14 text-center text-text-muted shadow-card ring-1 ring-border">
            <p class="text-3xl">🍽️</p>
            <p class="mt-3 text-sm font-semibold">No matching services</p>
          </div>
        </template>
      </section>
    </template>

    <!-- Full Screen Detail Detail (Figma Accurate) -->
    <Teleport to="body">
      <Transition name="slide-up">
        <div
          v-if="showDetail && selectedService"
          :class="[
            'menu-detail-root fixed inset-0 z-50 overflow-y-auto bg-surface-page',
            `theme-${themeId}`,
            `menu-size-${menuSize}`,
          ]"
          :style="customerInterfaceStyle"
        >
          <button
            @click="closeDetail"
            class="fixed right-5 top-5 z-[60] flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-all active:scale-90"
          >
            <X class="h-5 w-5" />
          </button>

          <!-- Full Width Hero Image -->
          <div class="relative w-full overflow-hidden h-[360px] shadow-lg bg-surface-input">
            <img
              v-if="selectedService.imageUrl"
              :src="selectedService.imageUrl"
              :alt="selectedService.name"
              class="h-full w-full object-cover"
            />
            <div v-else class="flex h-full w-full items-center justify-center text-6xl text-text-muted">🧖</div>
          </div>

          <!-- Content (Title and tags are no longer on image) -->
          <div class="relative -mt-6 rounded-t-[28px] bg-surface-page px-6 pt-6 pb-20">
            <h2 class="text-3xl font-black tracking-tight text-text-primary leading-tight">
              {{ selectedService.name }}
            </h2>

            <div v-if="getServiceLabelItems(selectedService).length" class="mt-4 flex flex-wrap gap-2">
              <span
                v-for="label in getServiceLabelItems(selectedService)"
                :key="label.key"
                :class="['inline-flex items-center rounded-full px-3 py-1 text-[11px] font-extrabold', getBadgeClasses(label.key)]"
              >
                {{ label.label }}
              </span>
            </div>

            <!-- Quick Info Pills -->
            <div class="mt-6 flex flex-wrap gap-3">
              <div class="flex items-center gap-2 rounded-2xl bg-surface-input px-5 py-3.5">
                <Clock class="h-4 w-4 text-primary-600" />
                <span class="text-sm font-black text-text-primary">{{ selectedService.duration || 60 }} mins</span>
              </div>
              <div v-if="getServiceDisplayPrice(selectedService)" class="flex items-center gap-2 rounded-2xl bg-surface-input px-5 py-3.5">
                <div class="flex h-5 w-5 items-center justify-center rounded-md bg-badge-bestseller-bg/20 text-[#B44CFF]">
                  <DollarSign class="h-3.5 w-3.5" />
                </div>
                <span class="text-sm font-black text-text-primary">{{ getServiceDisplayPrice(selectedService) }}</span>
              </div>
            </div>

            <!-- Description Section -->
            <div class="mt-10">
              <h3 class="mb-5 text-xs font-black uppercase tracking-[0.2em] text-text-muted">Description</h3>
              <p class="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-text-secondary font-medium">
                {{ selectedService.description || 'Our premium service is designed to provide you with the ultimate relaxation and wellness experience.' }}
              </p>
            </div>

            <!-- Options Section -->
            <div v-if="getDetailVariantOptions(selectedService).length" class="mt-8">
              <h3 class="mb-4 text-xs font-black uppercase tracking-[0.2em] text-text-muted">Options</h3>
              <div class="space-y-2">
                <div
                  v-for="(opt, index) in getDetailVariantOptions(selectedService)"
                  :key="`${opt.name}-${index}`"
                  class="flex items-center justify-between rounded-xl bg-surface-input px-4 py-3"
                >
                  <span class="text-sm font-bold text-text-primary">{{ opt.name }}</span>
                  <span class="text-sm font-black text-primary-700">{{ formatNumber(opt.price) }} đ</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}

/* Base Fade */
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Slide Up (Modal) */
.slide-up-enter-active { transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1); }
.slide-up-leave-active { transition: transform 0.25s ease-in; }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(100%); }

/* Article Slide Transition */
.slide-fade-enter-active, .slide-fade-leave-active {
  transition: all 0.8s ease-in-out;
  position: absolute;
}
.slide-fade-enter-from { opacity: 0; transform: translateX(20px); }
.slide-fade-leave-to { opacity: 0; transform: translateX(-20px); }

.menu-root,
.menu-root h1,
.menu-root h2,
.menu-root h3,
.menu-root h4,
.menu-root h5,
.menu-root h6,
.menu-root p,
.menu-root span,
.menu-root button,
.menu-root input,
.menu-root textarea,
.menu-root select,
.menu-detail-root,
.menu-detail-root h1,
.menu-detail-root h2,
.menu-detail-root h3,
.menu-detail-root h4,
.menu-detail-root h5,
.menu-detail-root h6,
.menu-detail-root p,
.menu-detail-root span,
.menu-detail-root button,
.menu-detail-root input,
.menu-detail-root textarea,
.menu-detail-root select {
  font-family: var(--menu-font-family), 'Inter', system-ui, sans-serif;
}

.menu-size-large .t-spa-name { font-size: 32px !important; }
.menu-size-large .t-cat-title { font-size: 22px !important; }
.menu-size-large .t-card-name { font-size: 17px !important; }
.menu-size-large .t-card-info p { font-size: 13px !important; }
.menu-size-large .t-card-price span { font-size: 19px !important; }
.menu-size-large .t-service-section { gap: 2.4rem !important; }
.menu-size-large input,
.menu-size-large button,
.menu-size-large textarea,
.menu-size-large select { font-size: 15px !important; }

.menu-size-normal .t-spa-name { font-size: 28px !important; }

.menu-size-compact .t-spa-name { font-size: 24px !important; }
.menu-size-compact .t-cat-title { font-size: 18px !important; }
.menu-size-compact .t-card-name { font-size: 14px !important; }
.menu-size-compact .t-card-info p { font-size: 11px !important; }
.menu-size-compact .t-card-price span { font-size: 15px !important; }
.menu-size-compact input,
.menu-size-compact button,
.menu-size-compact textarea,
.menu-size-compact select { font-size: 12px !important; }
</style>
