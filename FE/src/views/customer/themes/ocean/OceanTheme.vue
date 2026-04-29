<script setup lang="ts">
/**
 * OceanTheme.vue
 * Layout: Hero card → Horizontal scroll service tracks grouped by category
 * No search bar, no category filter — pure horizontal scrolling per group
 */
import { useI18n } from 'vue-i18n'
import { MapPin, Phone, Mail } from 'lucide-vue-next'
import { imgFallback as imgFallbackAsset, handleImgError } from '@/utils/image.utils'

interface Props {
  spaConfig: any
  oceanGroups: { category: any; services: any[] }[]
  loadingConfig: boolean
  loadingServices: boolean
  getServiceName: (svc: any) => string
  getServiceDisplayPrice: (svc: any) => string
  getOceanServiceLabelItems: (svc: any) => { key: string; label: string }[]
  getOceanBadgeClasses: (key: string) => string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'open-detail', svc: any): void
}>()

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <!-- Hero Card -->
  <section class="nl-hero-shell relative overflow-hidden px-6 pb-6 pt-8">
    <div class="ocean-hero-card rounded-[28px] p-5">
      <div class="flex items-center gap-4">
        <div class="ocean-hero-logo h-14 w-14 flex-shrink-0 overflow-hidden rounded-2xl">
          <img v-if="spaConfig.spaLogo" :src="spaConfig.spaLogo" class="h-full w-full object-cover" />
          <div v-else class="flex h-full w-full items-center justify-center text-lg font-black text-white">
            {{ (spaConfig.spaName || 'Q').charAt(0).toUpperCase() }}
          </div>
        </div>
        <div class="min-w-0 flex-1">
          <p class="line-clamp-1 text-2xl font-black text-white">{{ spaConfig.spaName || t('menu.defaultQrHome') }}</p>
          <p v-if="spaConfig.welcomeMessage" class="line-clamp-2 mt-1 text-sm font-semibold text-white/80">{{ spaConfig.welcomeMessage }}</p>
        </div>
      </div>
      <div v-if="spaConfig.spaAddress || spaConfig.spaPhone || spaConfig.spaEmail" class="mt-4 grid gap-2 text-xs font-semibold text-white/80 sm:grid-cols-3">
        <div v-if="spaConfig.spaAddress" class="rounded-xl bg-white/10 px-3 py-2 flex items-center gap-1.5">
          <MapPin class="h-3.5 w-3.5 flex-shrink-0" /><span class="line-clamp-2">{{ spaConfig.spaAddress }}</span>
        </div>
        <div v-if="spaConfig.spaPhone" class="rounded-xl bg-white/10 px-3 py-2 flex items-center gap-1.5">
          <Phone class="h-3.5 w-3.5 flex-shrink-0" /><span class="line-clamp-1">{{ spaConfig.spaPhone }}</span>
        </div>
        <div v-if="spaConfig.spaEmail" class="rounded-xl bg-white/10 px-3 py-2 flex items-center gap-1.5">
          <Mail class="h-3.5 w-3.5 flex-shrink-0" /><span class="line-clamp-1">{{ spaConfig.spaEmail }}</span>
        </div>
      </div>
    </div>
  </section>

  <!-- Service groups: horizontal scroll per category -->
  <section class="nl-services space-y-8 px-6 pb-24 pt-6">
    <div class="ocean-menu-shell space-y-7">
      <div v-for="group in oceanGroups" :key="`ocean-group-${group.category?.id}`" class="ocean-menu-group">
        <div class="ocean-menu-head flex items-center gap-2">
          <span class="ocean-menu-dot" aria-hidden="true"></span>
          <h3 class="line-clamp-1 text-[23px] font-black text-text-primary">{{ group.category?.name }}</h3>
        </div>

        <div class="ocean-service-track no-scrollbar mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1">
          <button
            v-for="svc in group.services"
            :key="`ocean-svc-${svc.id}`"
            class="ocean-service-card h-[244px] w-[178px] flex-shrink-0 snap-start text-left"
            @click="emit('open-detail', svc)"
          >
            <div class="ocean-service-media h-36 w-full overflow-hidden bg-surface-input">
              <img :src="svc.imageUrl || imgFallbackAsset" :alt="svc.name" class="h-full w-full object-cover" @error="handleImgError" />
            </div>
            <div class="ocean-service-body flex h-[100px] flex-col px-3 py-2.5">
              <p class="line-clamp-2 text-[13px] font-black text-white">{{ getServiceName(svc) }}</p>
              <div v-if="getOceanServiceLabelItems(svc).length" class="mt-1.5 flex min-h-[20px] flex-wrap gap-1 overflow-hidden">
                <span
                  v-for="label in getOceanServiceLabelItems(svc)"
                  :key="`ocean-label-${svc.id}-${label.key}`"
                  :class="['rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider', getOceanBadgeClasses(label.key)]"
                >
                  {{ label.label }}
                </span>
              </div>
              <p class="mt-auto line-clamp-1 text-sm font-black text-white/90">{{ getServiceDisplayPrice(svc) }}</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* .no-scrollbar utility is global — see style.css */
</style>
