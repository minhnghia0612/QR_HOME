<script setup lang="ts">
/**
 * VibrantTheme.vue
 * Layout: Full-bleed header card (spa info + article slider) →
 *         Split view: sidebar category rail (left) + card list (right)
 */
import { useI18n } from 'vue-i18n'
import { MapPin, Phone, Mail } from 'lucide-vue-next'
import { imgFallback as imgFallbackAsset, handleImgError } from '@/utils/image.utils'

interface Props {
  spaConfig: any
  articleSlides: any[]
  filteredServices: any[]
  categories: any[]
  selectedCategoryId: string | null
  currentSlideIndex: number
  loadingServices: boolean
  getServiceName: (svc: any) => string
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
  <section class="nl-services space-y-8 px-6 pb-24 pt-6">
    <!-- Header + Slider -->
    <div class="vibrant-header-shell mb-4 rounded-[26px] p-4 sm:p-5">
      <div class="vibrant-header-top flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="line-clamp-1 text-2xl font-black text-white">{{ spaConfig.spaName || t('menu.defaultSpaName') }}</p>
          <p v-if="spaConfig.welcomeMessage" class="mt-1 line-clamp-2 text-sm font-semibold text-white/80">{{ spaConfig.welcomeMessage }}</p>
          <p v-if="spaConfig.spaAddress" class="mt-1 flex items-center gap-1.5 text-sm font-semibold text-white/80">
            <MapPin class="h-3.5 w-3.5 flex-shrink-0" /><span class="line-clamp-2">{{ spaConfig.spaAddress }}</span>
          </p>
          <p v-if="spaConfig.spaPhone" class="mt-1 flex items-center gap-1.5 text-sm font-semibold text-white/80">
            <Phone class="h-3.5 w-3.5 flex-shrink-0" /><span class="line-clamp-1">{{ spaConfig.spaPhone }}</span>
          </p>
          <p v-if="spaConfig.spaEmail" class="mt-1 flex items-center gap-1.5 text-sm font-semibold text-white/80">
            <Mail class="h-3.5 w-3.5 flex-shrink-0" /><span class="line-clamp-1">{{ spaConfig.spaEmail }}</span>
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
        @touchstart="emit('slide-touch-start', $event)"
        @touchend="emit('slide-touch-end', $event)"
      >
        <TransitionGroup name="slide-fade">
          <button
            v-for="(svc, index) in articleSlides"
            v-show="index === currentSlideIndex"
            :key="`vibrant-article-${svc.id}`"
            class="absolute inset-0 text-left"
            @click="emit('open-detail', svc)"
          >
            <img :src="svc.imageUrl || imgFallbackAsset" :alt="svc.name" class="h-full w-full object-cover" @error="handleImgError" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent"></div>
            <div class="absolute bottom-0 left-0 right-0 p-3">
              <p class="line-clamp-1 text-lg font-black text-white">{{ getServiceName(svc) }}</p>
              <p class="text-sm font-bold text-white/90">{{ getServiceDisplayPrice(svc) }}</p>
            </div>
          </button>
        </TransitionGroup>
        <div v-if="articleSlides.length > 1" class="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
          <span v-for="(_, i) in articleSlides" :key="`vibrant-dot-${i}`"
            class="h-1.5 rounded-full transition-all"
            :class="i === currentSlideIndex ? 'w-6 bg-white' : 'w-2 bg-white/50'" />
        </div>
      </div>
    </div>

    <!-- Split menu: category rail + service list -->
    <div class="vibrant-menu-shell rounded-[30px] p-3 sm:p-4">
      <div class="vibrant-menu-layout flex gap-3 sm:gap-4">
        <aside class="vibrant-category-rail no-scrollbar">
          <button
            type="button" :title="t('menu.all')" :aria-label="t('menu.all')"
            :class="['vibrant-cat-pill', !selectedCategoryId ? 'is-active' : '']"
            @click="emit('select-category', null)"
          >
            <span class="vibrant-cat-pill-text">{{ t('menu.all') }}</span>
          </button>
          <button
            v-for="cat in categories" :key="`vibrant-cat-${cat.id}`"
            type="button" :title="cat.name" :aria-label="cat.name"
            :class="['vibrant-cat-pill', selectedCategoryId === cat.id ? 'is-active' : '']"
            @click="emit('select-category', cat.id)"
          >
            <span class="vibrant-cat-pill-text">{{ cat.name }}</span>
          </button>
        </aside>

        <div class="vibrant-card-list flex-1 space-y-3">
          <button
            v-for="svc in filteredServices" :key="`vibrant-svc-${svc.id}`"
            class="vibrant-card w-full text-left"
            @click="emit('open-detail', svc)"
          >
            <div class="vibrant-card-media">
              <img :src="svc.imageUrl || imgFallbackAsset" :alt="svc.name" class="h-full w-full object-cover" @error="handleImgError" />
            </div>
            <div class="vibrant-card-body">
              <p class="line-clamp-2 break-all text-[20px] font-black leading-tight text-text-primary">{{ getServiceName(svc) }}</p>
              <div class="mt-2 flex flex-wrap gap-1.5">
                <span v-for="label in getServiceLabelItems(svc)" :key="`vibrant-label-${svc.id}-${label.key}`"
                  :class="['rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider', getBadgeClasses(label.key)]">
                  {{ label.label }}
                </span>
              </div>
              <p class="mt-1 text-lg font-black text-text-secondary">{{ getServiceDisplayPrice(svc) }}</p>
            </div>
          </button>

          <div v-if="!filteredServices.length" class="vibrant-empty rounded-3xl py-12 text-center">
            <p class="text-base font-semibold text-white/80">{{ t('menu.noServicesInCategory') }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* .no-scrollbar and .slide-fade-* are global — see style.css */
</style>
