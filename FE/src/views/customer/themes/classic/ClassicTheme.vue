<script setup lang="ts">
/**
 * ClassicTheme.vue
 * Handles the "classic" and "rustic" theme variants.
 * Layout: Hero banner → Logo → Spa info → Article carousel → Category pills → Search → Service list
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Search, Phone, Mail, MapPin } from 'lucide-vue-next'
import heroImg from '@/assets/hero_customer.png'
import { imgFallback as imgFallbackAsset, handleImgError } from '@/utils/image.utils'

interface Props {
  spaConfig: any
  categories: any[]
  articleSlides: any[]
  newServices: any[]
  filteredServices: any[]
  groupedByCategory: { category: any; services: any[] }[]
  selectedCategoryId: string | null
  currentSlideIndex: number
  loadingConfig: boolean
  loadingCats: boolean
  loadingServices: boolean
  searchQuery: string
  // helpers
  getServiceName: (svc: any) => string
  getServiceShortDescription: (svc: any) => string
  getServiceDisplayPrice: (svc: any) => string
  getServiceLabelItems: (svc: any) => { key: string; label: string }[]
  getBadgeClasses: (key: string) => string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'open-detail', svc: any): void
  (e: 'select-category', id: string | null): void
  (e: 'update:searchQuery', val: string): void
  (e: 'slide-touch-start', event: TouchEvent): void
  (e: 'slide-touch-end', event: TouchEvent): void
}>()

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <!-- Hero Section -->
  <div class="t-hero-wrap relative w-full">
    <!-- Banner Background -->
    <div class="t-hero-banner relative h-[240px] w-full overflow-hidden">
      <div v-if="loadingConfig" class="skeleton h-full w-full"></div>
      <img
        v-else
        :src="spaConfig.bannerUrl || heroImg"
        alt="Spa Hero"
        class="h-full w-full object-cover brightness-[0.75] object-center"
      />
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
          {{ spaConfig.spaName || t('menu.defaultSpaName') }}
        </h1>
        <p v-if="spaConfig.welcomeMessage" class="t-hero-welcome mt-1 text-[13px] font-bold text-text-secondary">
          {{ spaConfig.welcomeMessage || t('menu.defaultWelcome') }}
        </p>

        <!-- Address Pill -->
        <div v-if="spaConfig.spaAddress" class="t-hero-address mt-4 mx-auto inline-flex max-w-full items-center justify-center gap-2 rounded-full bg-surface-input px-5 py-2.5 text-[13px] font-bold text-text-secondary">
          <MapPin class="h-4 w-4 flex-shrink-0 opacity-70" />
          <span class="truncate">{{ spaConfig.spaAddress }}</span>
        </div>

        <!-- Phone & Email -->
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

  <!-- Article Slide: New Services -->
  <div v-if="newServices.length > 0 || loadingServices" class="t-featured-section mt-8 mb-8 overflow-hidden px-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-black tracking-tight text-text-primary">{{ t('menu.featuredServices') }}</h2>
      <span class="text-[10px] font-bold uppercase tracking-widest text-primary-600">{{ t('menu.newArrivals') }}</span>
    </div>

    <div
      class="relative group h-48 w-full overflow-hidden rounded-[32px] shadow-card"
      @touchstart="emit('slide-touch-start', $event)"
      @touchend="emit('slide-touch-end', $event)"
    >
      <template v-if="loadingServices">
        <div class="skeleton h-full w-full"></div>
      </template>
      <template v-else>
        <div class="h-full w-full relative">
          <TransitionGroup name="slide-fade">
            <div
              v-for="(svc, index) in newServices"
              v-show="index === currentSlideIndex"
              :key="svc.id"
              @click="emit('open-detail', svc)"
              class="absolute inset-0 cursor-pointer overflow-hidden"
            >
              <img :src="svc.imageUrl || imgFallbackAsset" :alt="svc.name" class="h-full w-full object-cover" @error="handleImgError" />
              <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-5">
                <h3 class="text-white font-bold text-lg leading-tight">{{ getServiceName(svc) }}</h3>
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

  <!-- Sticky Navigation: Category Pills + Search -->
  <div class="t-controls-sticky sticky top-0 z-30 bg-surface-page/95 backdrop-blur-xl">
    <!-- Category Pills -->
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
              : 'bg-surface text-text-secondary ring-1 ring-border hover:bg-surface-input',
          ]"
          @click="emit('select-category', null)"
        >
          {{ t('menu.all') }}
        </button>
        <button
          v-for="cat in categories"
          :key="cat.id"
          :class="[
            'max-w-[120px] truncate flex-shrink-0 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide transition-all',
            selectedCategoryId === cat.id
              ? 'bg-primary-600 text-white shadow-card'
              : 'bg-surface text-text-secondary ring-1 ring-border hover:bg-surface-input',
          ]"
          @click="emit('select-category', cat.id)"
        >
          {{ cat.name }}
        </button>
      </template>
    </div>

    <!-- Search Bar -->
    <div class="px-6 pb-4">
      <div class="relative">
        <Search class="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          :value="searchQuery"
          @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
          type="text"
          :placeholder="t('menu.searchServices')"
          class="w-full rounded-xl border-0 bg-surface py-3 pl-11 pr-4 text-sm font-medium text-text-primary shadow-card outline-none ring-1 ring-border placeholder:text-text-muted focus:ring-2 focus:ring-primary-600"
        />
      </div>
    </div>
  </div>

  <!-- Services by Category -->
  <div class="t-service-section space-y-8 px-6 pb-24">
    <!-- Skeleton -->
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
        class="t-cat-title select-none text-xl font-extrabold tracking-tight text-text-primary leading-tight break-all"
        style="margin-bottom: 2rem !important;"
      >
        {{ group.category?.name }}
      </h2>

      <div v-if="group.services.length" class="t-card-grid space-y-3">
        <div
          v-for="svc in group.services"
          :key="svc.id"
          class="t-card flex cursor-pointer gap-4 rounded-2xl bg-surface p-2 shadow-card transition-all active:scale-[0.98] hover:shadow-elevated"
          @click="emit('open-detail', svc)"
        >
          <!-- Thumbnail -->
          <div class="t-card-img relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-surface-input shadow-inner">
            <img
              :src="svc.imageUrl || imgFallbackAsset"
              :alt="svc.name"
              class="h-full w-full object-cover"
              @error="handleImgError"
            />
          </div>

          <!-- Info -->
          <div class="t-card-info flex flex-1 flex-col justify-between py-1 pr-2">
            <div>
              <h3 class="t-card-name text-[15px] font-bold text-text-primary leading-tight line-clamp-2 break-all">{{ getServiceName(svc) }}</h3>
              <p class="mt-1 text-xs text-text-secondary leading-normal line-clamp-2">{{ getServiceShortDescription(svc) }}</p>
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
      <p class="mt-4 text-sm font-medium">{{ t('menu.noServicesFound') }}</p>
    </div>
  </div>
</template>

<style scoped>
/* Transitions (.slide-fade-*) and utilities (.no-scrollbar) are global — see style.css */
</style>
