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

watch([spaConfig, loadingConfig], ([config, loading]) => {
  if (!loading && config && config.status && config.status !== 'active') {
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
    currentSlideIndex.value = (currentSlideIndex.value + 1) % newServices.value.length
  }, 5000)
}

function stopSlideTimer() {
  if (slideInterval) clearInterval(slideInterval)
}

watch(newServices, (val) => {
  if (val.length > 0) startSlideTimer()
}, { immediate: true })

onMounted(() => {
  if (newServices.value.length > 0) startSlideTimer()
})

onUnmounted(() => {
  stopSlideTimer()
})

const isInitialLoading = computed(() => loadingCats.value || loadingConfig.value || loadingServices.value)

const { mutate: logTraffic } = useMutation({
  mutationFn: (serviceId: string) => trafficApi.logVisit(serviceId),
})

const filteredServices = computed(() => {
  let list = allServices.value
  if (selectedCategoryId.value) {
    list = list.filter((s: any) => s.categoryId === selectedCategoryId.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter((s: any) =>
      s.name?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q)
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

function formatPrice(price: number) {
  return new Intl.NumberFormat('vi-VN').format(price) + '₫'
}

function openDetail(service: any) {
  selectedService.value = service
  showDetail.value = true
  logTraffic(service.id)
}

function closeDetail() {
  showDetail.value = false
  setTimeout(() => { selectedService.value = null }, 300)
}

function getBadgeLabel(item: any) {
  if (item.isBestSeller) return 'BEST SELLER'
  if (item.isNewService) return 'NEW SERVICE'
  if (item.isCombo) return 'COMBO'
  return null
}

function getBadgeClasses(label: string | null) {
  if (!label) return ''
  if (label === 'BEST SELLER') return 'bg-badge-bestseller-bg text-badge-bestseller-text'
  if (label === 'NEW SERVICE') return 'bg-badge-new-bg text-badge-new-text'
  return 'bg-primary-100 text-primary-600'
}
</script>

<template>
  <div class="min-h-screen bg-surface-page">
    <!-- Hero Section -->
    <div class="relative min-h-[320px] w-full overflow-hidden">
      <!-- SKELETON: Hero -->
      <div v-if="loadingConfig" class="skeleton h-full w-full"></div>
      <img
        v-else
        :src="spaConfig.bannerUrl || heroImg"
        alt="Spa Hero"
        class="h-full w-full object-cover"
      />
      <!-- Gradient Overlay -->
      <div class="absolute inset-0 bg-gradient-to-t from-surface-page via-[rgba(44,47,50,0.4)] to-transparent" />

      <!-- Logo & Search -->
      <div class="absolute bottom-0 left-0 right-0 px-6 pb-6">
        <div class="flex items-center gap-4">
          <!-- Logo Avatar -->
          <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-elevated overflow-hidden">
            <div v-if="loadingConfig" class="skeleton h-full w-full"></div>
            <img v-else-if="spaConfig.spaLogo" :src="spaConfig.spaLogo" class="h-full w-full object-cover" />
            <span v-else class="text-xl font-black text-primary-600">
              {{ (spaConfig.spaName || 'Q').charAt(0).toUpperCase() }}
            </span>
          </div>
          <div class="flex-1">
            <div v-if="loadingConfig" class="space-y-2">
              <div class="skeleton h-6 w-48"></div>
              <div class="skeleton h-4 w-32"></div>
            </div>
            <div v-else>
              <h1 class="text-2xl font-extrabold tracking-tight text-white drop-shadow-lg">
                {{ spaConfig.spaName || 'QR Home Spa' }}
              </h1>
              <p class="text-sm font-medium text-white/80 line-clamp-1">{{ spaConfig.welcomeMessage || 'Welcome to our wellness center' }}</p>
              
              <!-- Contact Info Grid -->
              <div class="mt-2.5 space-y-1.5 drop-shadow-md">
                <div v-if="spaConfig.spaPhone" class="flex items-center gap-2 text-[11px] font-bold text-white">
                  <div class="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white shadow-sm flex-shrink-0">
                    <Phone class="h-2.5 w-2.5 text-primary-600" />
                  </div>
                  {{ spaConfig.spaPhone }}
                </div>
                <div v-if="spaConfig.spaAddress" class="flex items-center gap-2 text-[11px] font-bold text-white">
                  <div class="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white shadow-sm flex-shrink-0">
                    <MapPin class="h-2.5 w-2.5 text-primary-600" />
                  </div>
                  <span class="line-clamp-1">{{ spaConfig.spaAddress }}</span>
                </div>
                <div v-if="spaConfig.spaEmail" class="flex items-center gap-2 text-[11px] font-bold text-white">
                  <div class="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white shadow-sm flex-shrink-0">
                    <Mail class="h-2.5 w-2.5 text-primary-600" />
                  </div>
                  {{ spaConfig.spaEmail }}
                </div>
              </div>
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
      
      <div class="relative group h-48 w-full overflow-hidden rounded-[32px] shadow-card">
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
                    <span class="text-sm font-medium text-white/90">{{ formatPrice(svc.price || 0) }}</span>
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
                : 'bg-white text-text-secondary ring-1 ring-border hover:bg-surface-input'
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
                : 'bg-white text-text-secondary ring-1 ring-border hover:bg-surface-input'
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
            class="w-full rounded-xl border-0 bg-white py-3 pl-11 pr-4 text-sm font-medium text-text-primary shadow-card outline-none ring-1 ring-border placeholder:text-text-muted focus:ring-2 focus:ring-primary-600"
          />
        </div>
      </div>
    </div>

    <!-- Services by Category -->
    <div class="space-y-8 px-6 pb-24">
      <!-- SKELETON: Services -->
      <template v-if="loadingServices">
        <div v-for="i in 2" :key="i" class="space-y-4">
          <div class="skeleton h-6 w-32"></div>
          <div class="space-y-3">
            <div v-for="j in 3" :key="j" class="flex gap-4 rounded-2xl bg-white p-2 shadow-card">
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
        <h2 class="text-xl font-extrabold tracking-tight text-text-primary">
          {{ group.category?.name }}
        </h2>

        <div class="space-y-3">
          <div
            v-for="svc in group.services"
            :key="svc.id"
            class="flex cursor-pointer gap-4 rounded-2xl bg-white p-2 shadow-card transition-all active:scale-[0.98] hover:shadow-elevated"
            @click="openDetail(svc)"
          >
            <!-- Thumbnail -->
            <div class="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-surface-input shadow-inner">
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
            <div class="flex flex-1 flex-col justify-between py-1 pr-2">
              <div>
                <h3 class="text-[15px] font-bold text-text-primary leading-tight line-clamp-1">{{ svc.name }}</h3>
                <p class="mt-1 text-xs text-text-secondary leading-normal line-clamp-2">{{ svc.description || 'Premium spa service' }}</p>
                
                <!-- Badge (Inside Info) -->
                <div
                  v-if="getBadgeLabel(svc)"
                  :class="['mt-2 inline-flex rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-wider', getBadgeClasses(getBadgeLabel(svc))]"
                >
                  {{ getBadgeLabel(svc) }}
                </div>
              </div>
              
              <div class="mt-1 flex items-center justify-between">
                <span class="text-base font-black text-text-primary">{{ formatPrice(svc.price || 0) }}</span>
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
        <div v-if="showDetail && selectedService" class="fixed inset-0 z-50 overflow-y-auto bg-white">
          <!-- Full Width Hero Image -->
          <div v-if="selectedService.imageUrl" class="relative w-full overflow-hidden h-[380px] shadow-lg">
            <img :src="selectedService.imageUrl" :alt="selectedService.name" class="h-full w-full object-cover" />
            
            <!-- Close Button Inside (Figma style) -->
            <button 
              @click="closeDetail"
              class="absolute right-5 top-5 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-all active:scale-90"
            >
              <X class="h-5 w-5" />
            </button>

            <!-- Bottom Content Overlay -->
            <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-8 pb-10">
              <div v-if="getBadgeLabel(selectedService)" class="mb-3">
                <span class="rounded-lg bg-badge-bestseller-bg/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#B44CFF]">
                  {{ getBadgeLabel(selectedService) }}
                </span>
              </div>
              <h2 class="text-3xl font-black tracking-tight text-white leading-tight">
                {{ selectedService.name }}
              </h2>
            </div>
          </div>

          <!-- Quick Info Pills -->
          <div class="mt-8 flex gap-3 px-6">
            <div class="flex items-center gap-2 rounded-2xl bg-surface-input px-5 py-3.5">
              <Clock class="h-4 w-4 text-primary-600" />
              <span class="text-sm font-black text-text-primary">{{ selectedService.duration || 60 }} mins</span>
            </div>
            <div class="flex items-center gap-2 rounded-2xl bg-surface-input px-5 py-3.5">
              <div class="flex h-5 w-5 items-center justify-center rounded-md bg-badge-bestseller-bg/20 text-[#B44CFF]">
                <DollarSign class="h-3.5 w-3.5" />
              </div>
              <span class="text-sm font-black text-text-primary">{{ formatPrice(selectedService.price || 0) }}</span>
            </div>
          </div>

          <!-- Description Section -->
          <div class="mt-10 px-6 pb-20">
            <h3 class="text-xs font-black uppercase tracking-[0.2em] text-text-muted mb-5">Description</h3>
            <p class="text-[15px] leading-relaxed text-text-secondary whitespace-pre-wrap font-medium">
              {{ selectedService.description || 'Our premium service is designed to provide you with the ultimate relaxation and wellness experience.' }}
            </p>
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
</style>
