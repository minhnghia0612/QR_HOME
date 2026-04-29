<script setup lang="ts">
/**
 * ModernMinimalTheme.vue
 * Hero card → Article slider → Sticky tab filter + search → Masonry 2-column grid
 */
import { useI18n } from 'vue-i18n'
import { Search, MapPin, Phone, Mail } from 'lucide-vue-next'
import { imgFallback as imgFallbackAsset, handleImgError } from '@/utils/image.utils'

interface Props {
  spaConfig: any
  articleSlides: any[]
  modernMinimalColumns: { left: any[]; right: any[] }
  filteredServices: any[]
  categories: any[]
  selectedCategoryId: string | null
  currentSlideIndex: number
  loadingConfig: boolean
  loadingServices: boolean
  searchQuery: string
  getServiceName: (svc: any) => string
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
          <MapPin class="h-3.5 w-3.5 flex-shrink-0" />
          <span class="line-clamp-2">{{ spaConfig.spaAddress }}</span>
        </div>
        <div v-if="spaConfig.spaPhone" class="rounded-xl bg-surface px-3 py-2 flex items-center gap-1.5">
          <Phone class="h-3.5 w-3.5 flex-shrink-0" />
          <span class="line-clamp-1">{{ spaConfig.spaPhone }}</span>
        </div>
        <div v-if="spaConfig.spaEmail" class="rounded-xl bg-surface px-3 py-2 flex items-center gap-1.5">
          <Mail class="h-3.5 w-3.5 flex-shrink-0" />
          <span class="line-clamp-1">{{ spaConfig.spaEmail }}</span>
        </div>
      </div>
    </div>
  </section>

  <!-- Article Slider -->
  <section class="nl-feature-shell px-6">
    <div class="overflow-hidden rounded-[30px] shadow-card">
      <div v-if="loadingServices" class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div v-for="i in 4" :key="`mm-skeleton-${i}`" class="h-28 rounded-2xl bg-surface-input animate-pulse"></div>
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
            :key="`modern-article-${svc.id}`"
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
            :key="`modern-dot-${i}`"
            class="h-1.5 rounded-full transition-all"
            :class="i === currentSlideIndex ? 'w-6 bg-white' : 'w-2 bg-white/45'"
          />
        </div>
      </div>
    </div>
  </section>

  <!-- Sticky Controls: Search + Tab filter -->
  <section class="nl-controls sticky top-0 z-30 mt-6 border-y border-border bg-surface-page/95 px-6 py-3 backdrop-blur-lg">
    <div class="space-y-3">
      <div class="relative w-full">
        <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          :value="searchQuery"
          @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
          type="text"
          :placeholder="t('menu.findYourService')"
          class="w-full rounded-xl border-0 bg-white py-2.5 pl-10 pr-3 text-sm font-semibold text-text-primary ring-1 ring-border outline-none focus:ring-2 focus:ring-primary-600"
        />
      </div>
      <div class="no-scrollbar flex items-center gap-5 overflow-x-auto pb-0.5">
        <button
          :class="['whitespace-nowrap border-b-2 pb-1 text-base font-medium transition-colors',
            !selectedCategoryId ? 'border-text-primary text-text-primary' : 'border-transparent text-text-secondary hover:text-text-primary']"
          @click="emit('select-category', null)"
        >
          {{ t('menu.all') }}
        </button>
        <button
          v-for="cat in categories"
          :key="`modern-tab-cat-${cat.id}`"
          :class="['whitespace-nowrap border-b-2 pb-1 text-base font-medium transition-colors',
            selectedCategoryId === cat.id ? 'border-text-primary text-text-primary' : 'border-transparent text-text-secondary hover:text-text-primary']"
          @click="emit('select-category', cat.id)"
        >
          {{ cat.name }}
        </button>
      </div>
    </div>
  </section>

  <!-- Masonry 2-column Services -->
  <section class="nl-services space-y-8 px-6 pb-24 pt-6">
    <template v-if="loadingServices">
      <div v-for="i in 2" :key="`mm-list-skeleton-${i}`" class="space-y-4">
        <div class="h-6 w-32 rounded bg-surface-input animate-pulse"></div>
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div v-for="j in 4" :key="`mm-card-skeleton-${i}-${j}`" class="h-28 rounded-2xl bg-surface-input animate-pulse"></div>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="grid grid-cols-2 gap-3">
        <!-- Left column -->
        <div class="space-y-3">
          <button
            v-for="(svc, idx) in modernMinimalColumns.left"
            :key="`modern-left-${svc.id}`"
            class="w-full overflow-hidden rounded-[22px] bg-white text-left shadow-card transition-all hover:shadow-elevated"
            @click="emit('open-detail', svc)"
          >
            <div class="relative overflow-hidden" :class="idx === 0 ? 'h-56' : 'h-44'">
              <img :src="svc.imageUrl || imgFallbackAsset" :alt="svc.name" class="h-full w-full object-cover" @error="handleImgError" />
            </div>
            <div class="p-3">
              <p class="line-clamp-1 text-sm font-black text-text-primary">{{ getServiceName(svc) }}</p>
              <div class="mt-2 flex flex-wrap gap-1.5">
                <span
                  v-for="label in getServiceLabelItems(svc)"
                  :key="`modern-left-label-${svc.id}-${label.key}`"
                  :class="['rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider', getBadgeClasses(label.key)]"
                >
                  {{ label.label }}
                </span>
              </div>
              <p class="mt-1 text-xs font-semibold text-primary-700">{{ getServiceDisplayPrice(svc) }}</p>
            </div>
          </button>
        </div>

        <!-- Right column (offset by pt-6) -->
        <div class="space-y-3 pt-6">
          <button
            v-for="(svc, idx) in modernMinimalColumns.right"
            :key="`modern-right-${svc.id}`"
            class="w-full overflow-hidden rounded-[22px] bg-white text-left shadow-card transition-all hover:shadow-elevated"
            @click="emit('open-detail', svc)"
          >
            <div class="relative overflow-hidden" :class="idx === 0 ? 'h-44' : 'h-52'">
              <img :src="svc.imageUrl || imgFallbackAsset" :alt="svc.name" class="h-full w-full object-cover" @error="handleImgError" />
            </div>
            <div class="p-3">
              <p class="line-clamp-1 text-sm font-black text-text-primary">{{ getServiceName(svc) }}</p>
              <div class="mt-2 flex flex-wrap gap-1.5">
                <span
                  v-for="label in getServiceLabelItems(svc)"
                  :key="`modern-right-label-${svc.id}-${label.key}`"
                  :class="['rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider', getBadgeClasses(label.key)]"
                >
                  {{ label.label }}
                </span>
              </div>
              <p class="mt-1 text-xs font-semibold text-primary-700">{{ getServiceDisplayPrice(svc) }}</p>
            </div>
          </button>
        </div>
      </div>

      <div v-if="!filteredServices.length" class="rounded-3xl bg-white py-14 text-center text-text-muted shadow-card ring-1 ring-border">
        <p class="text-3xl">🍽️</p>
        <p class="mt-3 text-sm font-semibold">{{ t('menu.noMatchingServices') }}</p>
      </div>
    </template>
  </section>
</template>

<style scoped>
/* .no-scrollbar and .slide-fade-* are global — see style.css */
</style>
