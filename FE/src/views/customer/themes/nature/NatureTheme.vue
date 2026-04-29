<script setup lang="ts">
/**
 * NatureTheme.vue
 * Layout: Hero card → Article slider → Inline category filter → Service grid
 * (Category filter is inside the services section, NOT sticky)
 */
import { useI18n } from 'vue-i18n'
import { MapPin, Phone, Mail } from 'lucide-vue-next'
import { imgFallback as imgFallbackAsset, handleImgError } from '@/utils/image.utils'

interface Props {
  spaConfig: any
  articleSlides: any[]
  filteredServices: any[]
  groupedByCategory: { category: any; services: any[] }[]
  categories: any[]
  selectedCategoryId: string | null
  currentSlideIndex: number
  loadingConfig: boolean
  loadingServices: boolean
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
  (e: 'slide-touch-start', event: TouchEvent): void
  (e: 'slide-touch-end', event: TouchEvent): void
}>()

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <!-- Hero Card -->
  <section class="nl-hero-shell relative overflow-hidden px-6 pb-6 pt-8">
    <div class="absolute -right-12 -top-10 h-40 w-40 rounded-full bg-primary-100/70 blur-2xl"></div>
    <div class="absolute -left-16 bottom-0 h-44 w-44 rounded-full bg-surface-secondary blur-2xl"></div>
    <div class="nl-hero-card relative rounded-[28px] bg-white/90 p-5 shadow-card ring-1 ring-border backdrop-blur-md">
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0 flex-1">
          <p class="mt-2 text-3xl font-black leading-tight text-text-primary line-clamp-1">
            {{ spaConfig.spaName || t('menu.defaultQrHome') }}
          </p>
          <p v-if="spaConfig.welcomeMessage" class="mt-2 text-sm font-medium text-text-secondary line-clamp-2">
            {{ spaConfig.welcomeMessage }}
          </p>
        </div>
        <div class="w-[85px] aspect-square overflow-hidden rounded-full bg-surface-input shadow-inner ring-1 ring-border">
          <img v-if="spaConfig.spaLogo" :src="spaConfig.spaLogo" class="h-full w-full object-cover rounded-full" />
          <div v-else class="flex h-full w-full items-center justify-center text-xl font-black text-primary-600">
            {{ (spaConfig.spaName || 'Q').charAt(0).toUpperCase() }}
          </div>
        </div>
      </div>
      <div v-if="spaConfig.spaAddress || spaConfig.spaPhone || spaConfig.spaEmail" class="mt-4 grid gap-2 text-xs font-semibold text-text-secondary sm:grid-cols-3">
        <div v-if="spaConfig.spaAddress" class="rounded-xl bg-surface px-3 py-2 flex items-center gap-1.5">
          <MapPin class="h-3.5 w-3.5 flex-shrink-0" /><span class="line-clamp-2">{{ spaConfig.spaAddress }}</span>
        </div>
        <div v-if="spaConfig.spaPhone" class="rounded-xl bg-surface px-3 py-2 flex items-center gap-1.5">
          <Phone class="h-3.5 w-3.5 flex-shrink-0" /><span class="line-clamp-1">{{ spaConfig.spaPhone }}</span>
        </div>
        <div v-if="spaConfig.spaEmail" class="rounded-xl bg-surface px-3 py-2 flex items-center gap-1.5">
          <Mail class="h-3.5 w-3.5 flex-shrink-0" /><span class="line-clamp-1">{{ spaConfig.spaEmail }}</span>
        </div>
      </div>
    </div>
  </section>

  <!-- Article Slider -->
  <section class="nl-feature-shell px-6">
    <div class="overflow-hidden rounded-[30px] shadow-card">
      <div v-if="loadingServices" class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div v-for="i in 4" :key="`nature-skeleton-${i}`" class="h-28 rounded-2xl bg-surface-input animate-pulse"></div>
      </div>
      <div
        v-else
        class="relative h-56 overflow-hidden rounded-2xl"
        @touchstart="emit('slide-touch-start', $event)"
        @touchend="emit('slide-touch-end', $event)"
      >
        <TransitionGroup name="slide-fade">
          <button
            v-for="(svc, index) in articleSlides"
            v-show="index === currentSlideIndex"
            :key="`nature-article-${svc.id}`"
            @click="emit('open-detail', svc)"
            class="absolute inset-0 text-left"
          >
            <img :src="svc.imageUrl || imgFallbackAsset" :alt="svc.name" class="h-full w-full object-cover" @error="handleImgError" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
            <div class="absolute bottom-0 left-0 right-0 p-4">
              <p class="line-clamp-1 text-2xl font-black text-white">{{ getServiceName(svc) }}</p>
              <p class="text-base font-bold text-white/90">{{ getServiceDisplayPrice(svc) }}</p>
            </div>
          </button>
        </TransitionGroup>
        <div v-if="articleSlides.length > 1" class="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
          <span
            v-for="(_, i) in articleSlides"
            :key="`nature-dot-${i}`"
            class="h-1.5 rounded-full transition-all"
            :class="i === currentSlideIndex ? 'w-6 bg-white' : 'w-2 bg-white/45'"
          />
        </div>
      </div>
    </div>
  </section>

  <!-- Services Section: inline category filter + grid -->
  <section class="nl-services space-y-8 px-6 pb-24 pt-6">
    <!-- Inline category filter (NOT sticky for nature) -->
    <div class="nl-controls nl-controls-nature z-30">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          <button
            :class="['whitespace-nowrap rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wider transition-all',
              !selectedCategoryId ? 'bg-primary-600 text-white' : 'bg-white text-text-secondary ring-1 ring-border hover:bg-surface']"
            @click="emit('select-category', null)"
          >
            {{ t('menu.allMenu') }}
          </button>
          <button
            v-for="cat in categories"
            :key="`nature-body-cat-${cat.id}`"
            :class="['whitespace-nowrap rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wider transition-all',
              selectedCategoryId === cat.id ? 'bg-primary-600 text-white' : 'bg-white text-text-secondary ring-1 ring-border hover:bg-surface']"
            @click="emit('select-category', cat.id)"
          >
            {{ cat.name }}
          </button>
        </div>
      </div>
    </div>

    <!-- Skeleton -->
    <template v-if="loadingServices">
      <div v-for="i in 2" :key="`nature-list-skeleton-${i}`" class="space-y-4">
        <div class="h-6 w-32 rounded bg-surface-input animate-pulse"></div>
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div v-for="j in 4" :key="`nature-card-skeleton-${i}-${j}`" class="h-28 rounded-2xl bg-surface-input animate-pulse"></div>
        </div>
      </div>
    </template>

    <!-- Service grid by category -->
    <div v-else v-for="group in groupedByCategory" :key="`nature-group-${group.category?.id}`" class="space-y-3">
      <div class="flex items-center gap-3">
        <h3 class="nl-group-title text-lg font-black uppercase tracking-tight text-text-primary">{{ group.category?.name }}</h3>
        <span class="h-px flex-1 bg-border"></span>
      </div>
      <div class="nl-service-grid grid grid-cols-1 gap-3 md:grid-cols-2">
        <button
          v-for="svc in group.services"
          :key="`nature-service-${svc.id}`"
          class="nl-service-card group flex items-stretch gap-3 overflow-hidden rounded-2xl bg-white p-2 text-left shadow-card ring-1 ring-border transition-all hover:-translate-y-0.5 hover:shadow-elevated"
          @click="emit('open-detail', svc)"
        >
          <div class="nl-service-img h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-surface-input">
            <img :src="svc.imageUrl || imgFallbackAsset" :alt="svc.name" class="h-full w-full object-cover" @error="handleImgError" />
          </div>
          <div class="nl-service-info flex min-w-0 flex-1 flex-col justify-between py-1">
            <div>
              <p class="line-clamp-1 text-[15px] font-black text-text-primary">{{ getServiceName(svc) }}</p>
              <p class="mt-1 line-clamp-2 text-xs font-medium text-text-secondary">{{ getServiceShortDescription(svc) }}</p>
              <div class="mt-2 flex flex-wrap gap-1.5">
                <span
                  v-for="label in getServiceLabelItems(svc)"
                  :key="`nature-label-${svc.id}-${label.key}`"
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
      <p class="mt-3 text-sm font-semibold">{{ t('menu.noMatchingServices') }}</p>
    </div>
  </section>
</template>

<style scoped>
/* .no-scrollbar and .slide-fade-* are global — see style.css */
</style>
