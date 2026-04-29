<script setup lang="ts">
/**
 * DarkEleganceTheme.vue
 * Dark Elegance theme: All-black layout
 * Home view: Spa header → Article slider → Category grid tiles
 * Category view: Search bar → Service 2-col grid
 */
import { useI18n } from 'vue-i18n'
import { Search, ArrowLeft } from 'lucide-vue-next'
import { imgFallback as imgFallbackAsset, handleImgError } from '@/utils/image.utils'

interface Props {
  spaConfig: any
  articleSlides: any[]
  darkCategoryTiles: any[]
  darkSelectedServices: any[]
  darkCategoryViewOpen: boolean
  selectedCategoryId: string | null
  currentSlideIndex: number
  loadingConfig: boolean
  loadingServices: boolean
  searchQuery: string
  getServiceName: (svc: any) => string
  getServiceShortDescription: (svc: any) => string
  getServiceDisplayPrice: (svc: any) => string
  getServiceLabelItems: (svc: any) => { key: string; label: string }[]
  getBadgeClasses: (key: string) => string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'open-detail', svc: any): void
  (e: 'open-dark-category', id: string): void
  (e: 'close-dark-category-view'): void
  (e: 'update:searchQuery', val: string): void
  (e: 'slide-touch-start', event: TouchEvent): void
  (e: 'slide-touch-end', event: TouchEvent): void
}>()

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <section class="min-h-screen bg-black px-6 pb-24 pt-8 text-white">
    <div class="mx-auto max-w-5xl">

      <!-- HOME VIEW: Spa info + Slider + Category grid -->
      <template v-if="!darkCategoryViewOpen">
        <!-- Spa Header -->
        <div class="rounded-2xl px-5 py-6">
          <div class="flex items-start gap-4">
            <div class="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl">
              <img v-if="spaConfig.spaLogo" :src="spaConfig.spaLogo" class="h-full w-full object-cover" />
              <div v-else class="flex h-full w-full items-center justify-center text-2xl font-black text-[#F57C00]">
                {{ (spaConfig.spaName || 'Q').charAt(0).toUpperCase() }}
              </div>
            </div>
            <div class="min-w-0 flex-1">
              <p class="line-clamp-1 text-3xl font-black text-white">{{ spaConfig.spaName || t('menu.defaultSpaName') }}</p>
              <p v-if="spaConfig.welcomeMessage" class="mt-1 line-clamp-2 text-sm font-medium text-white/70">{{ spaConfig.welcomeMessage }}</p>
            </div>
          </div>

          <!-- Contact info -->
          <div class="mt-5 grid gap-2 text-sm text-white/80 sm:grid-cols-2">
            <div class="rounded-xl px-3 py-2 flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin-house-icon lucide-map-pin-house"><path d="M15 22a1 1 0 0 1-1-1v-4a1 1 0 0 1 .445-.832l3-2a1 1 0 0 1 1.11 0l3 2A1 1 0 0 1 22 17v4a1 1 0 0 1-1 1z"/><path d="M18 10a8 8 0 0 0-16 0c0 4.993 5.539 10.193 7.399 11.799a1 1 0 0 0 .601.2"/><path d="M18 22v-3"/><circle cx="10" cy="10" r="3"/></svg>
              <p class="line-clamp-2 font-semibold">{{ spaConfig.spaAddress || t('menu.updatingAddress') }}</p>
            </div>
            <div class="rounded-xl px-3 py-2 flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-phone"><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"/></svg>
              <p class="line-clamp-1 font-semibold">{{ spaConfig.spaPhone || t('menu.updatingPhone') }}</p>
            </div>
            <div class="rounded-xl px-3 py-2 flex items-start gap-2 sm:col-span-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mail"><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"/><rect x="2" y="4" width="20" height="16" rx="2"/></svg>
              <p class="line-clamp-1 font-semibold">{{ spaConfig.spaEmail || t('menu.updatingEmail') }}</p>
            </div>
          </div>
        </div>

        <!-- Article Slider -->
        <div
          class="relative mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#17191F]"
          @touchstart="emit('slide-touch-start', $event)"
          @touchend="emit('slide-touch-end', $event)"
        >
          <div class="relative h-44 w-full">
            <TransitionGroup name="slide-fade">
              <button
                v-for="(svc, index) in articleSlides"
                v-show="index === currentSlideIndex"
                :key="`dark-article-${svc.id}`"
                class="absolute inset-0 text-left"
                @click="emit('open-detail', svc)"
              >
                <img :src="svc.imageUrl || imgFallbackAsset" :alt="svc.name" class="h-full w-full object-cover opacity-80" @error="handleImgError" />
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent"></div>
                <div class="absolute bottom-0 left-0 right-0 p-4">
                  <p class="line-clamp-1 text-xl font-black text-white">{{ getServiceName(svc) }}</p>
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

        <!-- Category Grid -->
        <div class="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            v-for="cat in darkCategoryTiles"
            :key="`dark-cat-${cat.id}`"
            class="relative min-h-[180px] p-5 text-left transition-all bg-[#23252B] hover:bg-[#F57C00]/10 rounded-2xl"
            @click="emit('open-dark-category', cat.id)"
          >
            <p class="text-[22px] font-semibold leading-tight">{{ cat.name }}</p>
          </button>
        </div>
      </template>

      <!-- CATEGORY VIEW: Search + Service grid -->
      <template v-else>
        <div class="sticky top-0 z-20 -mx-6 border-b border-white/10 bg-black/95 px-6 py-4 backdrop-blur-lg">
          <button class="mb-3 inline-flex items-center gap-2 text-sm font-bold text-white/80" @click="emit('close-dark-category-view')">
            <ArrowLeft class="h-4 w-4" /> {{ t('menu.back') }}
          </button>
          <div class="relative rounded-2xl">
            <Search class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55" />
            <input
              :value="searchQuery"
              @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
              type="text"
              :placeholder="t('menu.searchInCategory')"
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
            @click="emit('open-detail', svc)"
          >
            <div class="h-24 w-24 flex-shrink-0 overflow-hidden bg-[#121317] rounded-2xl">
              <img :src="svc.imageUrl || imgFallbackAsset" :alt="svc.name" class="h-full w-full object-cover rounded-2xl" @error="handleImgError" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="line-clamp-2 break-all text-lg font-black text-white leading-tight">{{ getServiceName(svc) }}</p>
              <p class="mt-1 line-clamp-2 text-xs font-medium text-white/60">{{ getServiceShortDescription(svc) }}</p>
              <div class="mt-2 flex flex-wrap gap-1.5">
                <span
                  v-for="label in getServiceLabelItems(svc)"
                  :key="`dark-label-${svc.id}-${label.key}`"
                  :class="['rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider', getBadgeClasses(label.key)]"
                >
                  {{ label.label }}
                </span>
              </div>
              <p class="mt-2 text-sm font-black text-[#F57C00]">{{ getServiceDisplayPrice(svc) }}</p>
            </div>
          </button>
        </div>

        <div v-if="!darkSelectedServices.length" class="mt-10 border border-white/10 bg-[#1B1D23] py-12 text-center text-white/60">
          <p class="text-base font-semibold">{{ t('menu.noServicesInCategory') }}</p>
        </div>
      </template>

    </div>
  </section>
</template>

<style scoped>
/* .slide-fade-* transitions are global — see style.css */
</style>
