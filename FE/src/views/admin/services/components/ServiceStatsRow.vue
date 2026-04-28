<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  pageLoading: boolean
  totalServices: number
  todayViews: number
  formattedGrowth: { text: string; class: string }
  growthTone: { bg: string; icon: string }
}>()

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <div v-if="pageLoading" class="mb-10 grid gap-6 grid-cols-1 sm:grid-cols-3">
    <div v-for="i in 3" :key="`stats-skeleton-${i}`" class="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <div class="h-4 w-24 rounded bg-surface-input animate-pulse"></div>
      <div class="mt-4 h-8 w-16 rounded bg-surface-input animate-pulse"></div>
    </div>
  </div>
  <div v-else class="mb-10 grid gap-6 grid-cols-1 sm:grid-cols-3">
    <div class="flex items-center gap-4 rounded-2xl border border-border bg-white p-6 shadow-sm transition-shadow hover:shadow-card">
      <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E8F0FF]">
        <svg class="h-8 w-8 text-[#0048B5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 8V21H3V8" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M23 3H1V8H23V3Z" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M10 12H14" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div>
        <p class="text-[11px] font-bold uppercase tracking-wider text-text-secondary">{{ t('admin.serviceManager.totalServices') }}</p>
        <p class="text-3xl font-black text-text-primary">{{ totalServices || 0 }}</p>
      </div>
    </div>

    <div class="flex items-center gap-4 rounded-2xl border border-border bg-white p-6 shadow-sm transition-shadow hover:shadow-card">
      <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100">
        <svg class="h-8 w-8 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="12" cy="12" r="3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div>
        <p class="text-[11px] font-bold uppercase tracking-wider text-text-secondary">{{ t('admin.serviceManager.todayViews') }}</p>
        <p class="text-3xl font-black text-text-primary">{{ todayViews.toLocaleString() }}</p>
      </div>
    </div>

    <div class="flex items-center gap-4 rounded-2xl border border-border bg-white p-6 shadow-sm transition-shadow hover:shadow-card">
      <div :class="['flex h-16 w-16 items-center justify-center rounded-2xl', growthTone.bg]">
        <svg :class="['h-8 w-8', growthTone.icon]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M23 6l-9.5 9.5-5-5L1 18" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M17 6h6v6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div>
        <p class="text-[11px] font-bold uppercase tracking-wider text-text-secondary">{{ t('admin.serviceManager.growth') }}</p>
        <p :class="['text-3xl font-black', formattedGrowth.class]">{{ formattedGrowth.text }}</p>
      </div>
    </div>
  </div>
</template>
