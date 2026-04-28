<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import imgFallback from '@/assets/img_fallback.png'

const props = defineProps<{
  top5List: any[]
  isLoading: boolean
}>()

const { t } = useI18n({ useScope: 'global' })

function handleImgError(e: Event) {
  const target = e.target as HTMLImageElement
  if (target.src !== imgFallback) {
    target.src = imgFallback
  }
}
</script>

<template>
  <div>
    <h3 class="mb-6 text-xl font-bold tracking-tight text-text-primary">
      {{ t('admin.dashboard.top5') }}
    </h3>

    <div v-if="isLoading" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <div v-for="i in 5" :key="`top5-skeleton-${i}`" class="overflow-hidden rounded-3xl bg-white p-3 shadow-card">
        <div class="h-28 w-full rounded-2xl bg-surface-input animate-pulse"></div>
        <div class="mt-3 h-4 w-3/4 rounded bg-surface-input animate-pulse"></div>
        <div class="mt-2 h-3 w-1/2 rounded bg-surface-input animate-pulse"></div>
      </div>
    </div>
    
    <div v-else-if="top5List.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <div
        v-for="(svc, i) in top5List"
        :key="svc.serviceId"
        class="overflow-hidden rounded-3xl bg-white shadow-card transition-shadow hover:shadow-elevated"
      >
        <div class="relative h-28 w-full overflow-hidden rounded-2xl bg-surface-input">
          <img :src="svc.imageUrl || imgFallback" :alt="svc.serviceName" class="h-full w-full object-cover" @error="handleImgError" />
          <div class="absolute left-2 top-2 rounded-lg bg-white/60 px-2 py-0.5 text-xs font-bold text-text-primary backdrop-blur-sm">
            #{{ i + 1 }}
          </div>
        </div>
        <div class="p-3">
          <h4 class="truncate text-sm font-bold text-text-primary">{{ svc.serviceName }}</h4>
          <p class="mt-1 text-xs text-text-secondary">{{ svc.viewCount?.toLocaleString() }} {{ t('admin.dashboard.views') }}</p>
        </div>
      </div>
    </div>
    <div v-else class="col-span-full rounded-3xl bg-white p-12 text-center text-text-muted shadow-card">
      {{ t('admin.dashboard.noTrafficYet') }}
    </div>
  </div>
</template>
