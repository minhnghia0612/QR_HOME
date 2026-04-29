<script setup lang="ts">
/**
 * NeonTheme.vue
 * Cyber/Neon layout:
 * - Hero card (neon style)
 * - Feature article slider
 * - Search bar
 * - Bento grid service list
 * - Fixed bottom dock with category tab navigation
 */
import { useI18n } from 'vue-i18n'
import { Search, MapPin, Phone, Mail } from 'lucide-vue-next'
import { imgFallback as imgFallbackAsset, handleImgError } from '@/utils/image.utils'

interface Props {
  spaConfig: any
  articleSlides: any[]
  filteredServices: any[]
  categories: any[]
  selectedCategoryId: string | null
  currentSlideIndex: number
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
  <!-- Neon Hero Card -->
  <section class="nl-hero-shell relative overflow-hidden px-6 pb-6 pt-8">
    <div class="neon-hero-card rounded-[30px] p-5 sm:p-6">
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0 flex-1">
          <p class="line-clamp-1 text-3xl font-black text-white">{{ spaConfig.spaName || t('menu.defaultNeonSpaName') }}</p>
          <p class="mt-1 line-clamp-2 text-sm font-semibold text-cyan-100/85">
            {{ spaConfig.welcomeMessage || t('menu.defaultNeonWelcome') }}
          </p>
        </div>
        <div class="neon-hero-logo h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl">
          <img v-if="spaConfig.spaLogo" :src="spaConfig.spaLogo" class="h-full w-full object-cover" />
          <div v-else class="flex h-full w-full items-center justify-center text-xl font-black text-cyan-100">
            {{ (spaConfig.spaName || 'Q').charAt(0).toUpperCase() }}
          </div>
        </div>
      </div>
      <div v-if="spaConfig.spaAddress || spaConfig.spaPhone || spaConfig.spaEmail" class="mt-4 grid gap-2 text-xs font-semibold text-cyan-100/85 sm:grid-cols-3">
        <div v-if="spaConfig.spaAddress" class="neon-hero-chip rounded-xl px-3 py-2 flex items-center gap-1.5">
          <MapPin class="h-3.5 w-3.5 flex-shrink-0" /><span class="line-clamp-2">{{ spaConfig.spaAddress }}</span>
        </div>
        <div v-if="spaConfig.spaPhone" class="neon-hero-chip rounded-xl px-3 py-2 flex items-center gap-1.5">
          <Phone class="h-3.5 w-3.5 flex-shrink-0" /><span class="line-clamp-1">{{ spaConfig.spaPhone }}</span>
        </div>
        <div v-if="spaConfig.spaEmail" class="neon-hero-chip rounded-xl px-3 py-2 flex items-center gap-1.5">
          <Mail class="h-3.5 w-3.5 flex-shrink-0" /><span class="line-clamp-1">{{ spaConfig.spaEmail }}</span>
        </div>
      </div>
    </div>
  </section>

  <!-- Feature Article Slider -->
  <section class="neon-feature-shell px-6">
    <div class="neon-feature-card rounded-[28px] p-4 sm:p-5">
      <div
        class="relative h-56 overflow-hidden rounded-3xl"
        @touchstart="emit('slide-touch-start', $event)"
        @touchend="emit('slide-touch-end', $event)"
      >
        <TransitionGroup name="slide-fade">
          <button
            v-for="(svc, index) in articleSlides"
            v-show="index === currentSlideIndex"
            :key="`neon-article-${svc.id}`"
            @click="emit('open-detail', svc)"
            class="absolute inset-0 text-left"
          >
            <img :src="svc.imageUrl || imgFallbackAsset" :alt="svc.name" class="h-full w-full object-cover" @error="handleImgError" />
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/30 to-transparent"></div>
            <div class="absolute bottom-0 left-0 right-0 p-4">
              <p class="line-clamp-1 text-2xl font-black text-white">{{ getServiceName(svc) }}</p>
              <p class="text-sm font-semibold text-cyan-100/90">{{ getServiceDisplayPrice(svc) }}</p>
            </div>
          </button>
        </TransitionGroup>
        <div v-if="articleSlides.length > 1" class="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
          <span v-for="(_, i) in articleSlides" :key="`neon-dot-${i}`"
            class="h-1.5 rounded-full transition-all"
            :class="i === currentSlideIndex ? 'w-6 bg-cyan-300' : 'w-2 bg-cyan-300/45'" />
        </div>
      </div>
    </div>
  </section>

  <!-- Search Bar -->
  <section class="neon-search-shell px-6 mt-4">
    <div class="relative">
      <Search class="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cyan-300/60" />
      <input
        :value="searchQuery"
        @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
        type="text"
        :placeholder="t('menu.searchCyberServices')"
        class="w-full rounded-[20px] border border-cyan-500/30 bg-slate-900/60 py-3.5 pl-12 pr-4 text-sm font-bold text-white shadow-inner outline-none placeholder:text-cyan-100/50 focus:border-cyan-400/80 focus:ring-1 focus:ring-cyan-500/50"
      />
    </div>
  </section>

  <!-- Bento Grid Service List -->
  <section class="nl-services space-y-8 px-6 pb-24 pt-6">
    <div class="neon-menu-shell">
      <div class="neon-bento-grid mt-4">
        <button
          v-for="(svc, index) in filteredServices"
          :key="`neon-svc-${svc.id}`"
          :class="[
            'neon-bento-item text-left relative overflow-hidden transition-all duration-300 hover:scale-[0.98]',
            index % 5 === 0 ? 'neon-bento-large' : 'neon-bento-small',
          ]"
          @click="emit('open-detail', svc)"
        >
          <div class="absolute inset-0 bg-slate-900 border border-white/5 rounded-[24px]"></div>
          <div class="absolute inset-0 overflow-hidden rounded-[24px]">
            <img :src="svc.imageUrl || imgFallbackAsset" :alt="svc.name" class="h-full w-full object-cover transition-transform duration-500 hover:scale-105" @error="handleImgError" />
          </div>
          <div :class="['absolute inset-0 bg-gradient-to-t rounded-[24px]', index % 5 === 0 ? 'from-slate-950 via-slate-900/60 to-transparent' : 'from-slate-950 to-transparent']"></div>
          <div class="absolute inset-x-0 bottom-0 p-4">
            <p :class="[index % 5 === 0 ? 'text-[32px]' : 'text-lg', 'font-black leading-none text-white line-clamp-2']">{{ getServiceName(svc) }}</p>
            <p v-if="index % 5 === 0" class="mt-1 line-clamp-1 text-sm font-medium text-cyan-100/70">{{ svc.shortDescription || svc.description || t('menu.defaultHyperService') }}</p>
            <div class="mt-2 flex flex-wrap gap-1.5">
              <span v-for="label in getServiceLabelItems(svc)" :key="`neon-label-${svc.id}-${label.key}`"
                :class="['rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider backdrop-blur-sm', getBadgeClasses(label.key)]">
                {{ label.label }}
              </span>
            </div>
            <p :class="[index % 5 === 0 ? 'mt-3 text-lg' : 'mt-1 text-sm', 'font-black text-cyan-300']">{{ getServiceDisplayPrice(svc) }}</p>
          </div>
        </button>
      </div>

      <div v-if="!filteredServices.length" class="mt-6 rounded-3xl border border-cyan-300/25 bg-slate-900/45 py-12 text-center text-cyan-100/75">
        <p class="text-base font-semibold">{{ t('menu.noServicesInMode') }}</p>
      </div>
    </div>
  </section>

  <!-- Fixed Bottom Dock: Category Navigation -->
  <section class="neon-dock fixed bottom-5 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2">
    <div class="neon-dock-card shadow-2xl backdrop-blur-xl rounded-[28px] p-2 border border-cyan-500/30 bg-slate-950/85">
      <div class="neon-mode-tabs no-scrollbar flex gap-2 overflow-x-auto p-1">
        <button
          :class="['neon-mode-tab flex-shrink-0 flex flex-col items-center justify-center p-2 rounded-2xl transition-all min-w-[72px]',
            !selectedCategoryId ? 'bg-cyan-500/20 text-cyan-50 ring-1 ring-cyan-400/50' : 'text-slate-400 hover:text-cyan-200']"
          @click="emit('select-category', null)"
        >
          <span class="text-[10px] font-black uppercase tracking-wider">{{ t('menu.all') }}</span>
        </button>
        <button
          v-for="cat in categories"
          :key="`neon-tab-${cat.id}`"
          :class="['neon-mode-tab flex-shrink-0 flex flex-col items-center justify-center p-2 rounded-2xl transition-all min-w-[72px]',
            selectedCategoryId === cat.id ? 'bg-cyan-500/20 text-cyan-50 ring-1 ring-cyan-400/50' : 'text-slate-400 hover:text-cyan-200']"
          @click="emit('select-category', cat.id)"
        >
          <span class="line-clamp-1 w-full text-center text-[10px] font-black uppercase tracking-wider">{{ cat.name }}</span>
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* .no-scrollbar and .slide-fade-* are global — see style.css */
</style>
