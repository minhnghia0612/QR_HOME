<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery, useMutation } from '@tanstack/vue-query'
import { categoriesApi } from '@/api/categories.api'
import { servicesApi } from '@/api/services.api'
import { trafficApi } from '@/api/traffic.api'
import apiClient from '@/api/client'
import { Search, Clock, X, ChevronDown, ChevronLeft, ChevronRight, Phone, Mail, MapPin, ArrowLeft, Share2, DollarSign } from 'lucide-vue-next'
import heroImg from '@/assets/hero_customer.png'

const route = useRoute()
const adminId = computed(() => route.params.id as string)

const searchQuery = ref('')
const selectedCategoryId = ref<string | null>(null)
const selectedService = ref<any>(null)
const showDetail = ref(false)

// Article Slide State
const currentSlideIndex = ref(0)
let slideInterval: any = null
const touchStartX = ref<number | null>(null)
const SWIPE_THRESHOLD_PX = 40

const { data: categoriesRes, isLoading: loadingCats } = useQuery({
  queryKey: ['public-categories', adminId],
  queryFn: async () => {
    const { data } = await categoriesApi.getActive({ adminId: adminId.value })
    return (data as any).data || data
  },
})

const { data: configRes, isLoading: loadingConfig } = useQuery({
  queryKey: ['public-config', adminId],
  queryFn: async () => {
    const { data } = await apiClient.get(`/qr-config/public?adminId=${adminId.value}`)
    return (data as any).data || data
  },
})

const router = useRouter()
const spaConfig = computed(() => {
  const raw = configRes.value
  return (raw as any)?.status ? raw : (raw as any)?.data || raw || {}
})

const themeId = computed(() => {
  return route.query.previewTheme || spaConfig.value?.themeId || 'classic'
})

const isAdminPreview = computed(() => route.query.isAdmin === 'true')

function getPreviewValue<T extends string>(key: string, fallback: T): string | T {
  if (!isAdminPreview.value) return fallback
  const value = route.query[key]
  if (typeof value === 'string' && value.trim()) return value
  return fallback
}

const currencyUnit = computed<'VND' | 'USD' | 'EUR'>(() => {
  const unit = String(
    getPreviewValue('previewCurrencyUnit', spaConfig.value?.currencyUnit || spaConfig.value?.currency || 'VND'),
  ).toUpperCase()
  if (unit === 'USD' || unit === 'DOLLAR') return 'USD'
  if (unit === 'EUR' || unit === 'EURO') return 'EUR'
  return 'VND'
})

const menuSize = computed<'large' | 'normal' | 'compact'>(() => {
  const size = String(
    getPreviewValue('previewSize', spaConfig.value?.customerUiSize || 'normal'),
  ).toLowerCase()
  if (size === 'large' || size === 'compact') return size
  return 'normal'
})

const menuFontFamily = computed(() =>
  String(getPreviewValue('previewFontFamily', spaConfig.value?.fontFamily || 'Inter')),
)

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
  const primary = String(getPreviewValue('previewPrimaryColor', spaConfig.value?.primaryColor || '#0253CD'))
  const secondary = String(getPreviewValue('previewSecondaryColor', spaConfig.value?.secondaryColor || '#5E0B61'))
  const secondarySoft = hexToRgba(secondary, 0.12)
  const secondaryMuted = hexToRgba(secondary, 0.75)
  return {
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
    '--menu-font-family': menuFontFamily.value,
  }
})

watch([spaConfig, loadingConfig], ([config, loading]) => {
  const isAdmin = route.query.isAdmin === 'true'
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
  queryKey: ['public-services', adminId],
  queryFn: async () => {
    const { data } = await servicesApi.getPublic({ adminId: adminId.value } as any)
    return (data as any).data?.items || (data as any).data || []
  },
})

const newServices = computed(() => {
  return allServices.value
    .filter((s: any) => s.isNewService)
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
})

// Auto Slide Logic
function startSlideTimer() {
  stopSlideTimer()
  if (newServices.value.length <= 1) return
  slideInterval = setInterval(() => {
    goToNextSlide()
  }, 5000)
}

function stopSlideTimer() {
  if (slideInterval) clearInterval(slideInterval)
}

function goToNextSlide() {
  if (!newServices.value.length) return
  currentSlideIndex.value = (currentSlideIndex.value + 1) % newServices.value.length
}

function goToPrevSlide() {
  if (!newServices.value.length) return
  currentSlideIndex.value =
    (currentSlideIndex.value - 1 + newServices.value.length) % newServices.value.length
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

watch(newServices, (val) => {
  if (val.length > 0) startSlideTimer()
}, { immediate: true })

onMounted(() => {
  if (newServices.value.length > 0) startSlideTimer()
})

const { mutate: logTraffic } = useMutation({
  mutationFn: (params: { serviceId?: string; adminId: string }) => trafficApi.logVisit(params),
})

// Log overall page visit when adminId becomes available
watch(adminId, (newId) => {
  const isAdmin = route.query.isAdmin === 'true'
  if (newId && !isAdmin) {
    logTraffic({ adminId: newId })
  }
}, { immediate: true })

onUnmounted(() => {
  stopSlideTimer()
})

const isInitialLoading = computed(() => loadingCats.value || loadingConfig.value || loadingServices.value)

const filteredServices = computed(() => {
  let list = allServices.value
  if (selectedCategoryId.value) {
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
  return list
})

const groupedByCategory = computed(() => {
  if (selectedCategoryId.value) {
    const cat = categories.value.find((c: any) => c.id === selectedCategoryId.value)
    return [{ category: cat, services: filteredServices.value }]
  }
  return categories.value.map((cat: any) => ({
    category: cat,
    services: filteredServices.value.filter((s: any) => s.categoryId === cat.id),
  })).filter((g: any) => g.services.length > 0)
})

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
  const isAdmin = route.query.isAdmin === 'true'
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
    <!-- Hero Section -->
    <div class="t-hero-wrap relative w-full">
      <!-- Banner Background (Darkened to make logo pop) -->
      <div class="relative h-[240px] w-full overflow-hidden">
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
          <p v-if="spaConfig.welcomeMessage" class="t-hero-welcome mt-1 text-[13px] font-bold text-text-secondary">
            {{ spaConfig.welcomeMessage }}
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
    <div v-if="newServices.length > 0 || loadingServices" class="mt-8 mb-8 overflow-hidden px-6">
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
    <div class="sticky top-0 z-30 bg-surface-page/95 backdrop-blur-xl">
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
        <h2 class="t-cat-title text-xl font-extrabold tracking-tight text-text-primary">
          {{ group.category?.name }}
        </h2>

        <div class="t-card-grid space-y-3">
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

    <!-- Full Screen Detail Detail (Figma Accurate) -->
    <Teleport to="body">
      <Transition name="slide-up">
        <div v-if="showDetail && selectedService" :class="['fixed inset-0 z-50 overflow-y-auto bg-surface-page', `theme-${themeId}`]">
          <!-- Full Width Hero Image -->
          <div class="relative w-full overflow-hidden h-[360px] shadow-lg bg-surface-input">
            <img
              v-if="selectedService.imageUrl"
              :src="selectedService.imageUrl"
              :alt="selectedService.name"
              class="h-full w-full object-cover"
            />
            <div v-else class="flex h-full w-full items-center justify-center text-6xl text-text-muted">🧖</div>

            <!-- Close Button -->
            <button
              @click="closeDetail"
              class="absolute right-5 top-5 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-all active:scale-90"
            >
              <X class="h-5 w-5" />
            </button>
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
              <p class="line-clamp-6 break-all text-[15px] leading-relaxed text-text-secondary font-medium">
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
.menu-root select {
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
