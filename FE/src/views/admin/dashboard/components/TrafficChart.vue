<script setup lang="ts">
import { BarChart3 } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  weeklyData: any[]
  maxBarValue: number
  isLoading: boolean
}>()

const { t } = useI18n({ useScope: 'global' })

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}
</script>

<template>
  <div class="flex-1 rounded-4xl bg-white p-8 shadow-card">
    <div class="mb-6 flex items-center justify-between">
      <h3 class="text-2xl font-bold tracking-tight text-text-primary">{{ t('admin.dashboard.trafficView') }}</h3>
      <span v-if="weeklyData.length" class="text-[10px] font-black uppercase tracking-widest text-primary-600">{{ t('admin.dashboard.last7Days') }}</span>
    </div>

    <div v-if="isLoading" class="grid h-[220px] grid-cols-7 items-end gap-4 px-2 sm:px-4">
      <div v-for="i in 7" :key="`chart-skeleton-${i}`" class="flex flex-col items-center gap-3">
        <div class="w-10 rounded-t-lg bg-surface-input animate-pulse" :style="{ height: `${30 + (i % 4) * 20}px` }"></div>
        <div class="h-3 w-10 rounded bg-surface-input animate-pulse"></div>
      </div>
    </div>
    <div v-else-if="weeklyData.length" class="flex items-end justify-start h-[220px] w-full px-2 sm:px-4 gap-6 overflow-x-auto overflow-y-visible no-scrollbar pt-14 pb-2">
      <div
        v-for="(day, i) in weeklyData"
        :key="i"
        class="flex h-full flex-col items-center justify-end group gap-3 min-w-[70px]"
      >
        <!-- Bar -->
        <div
          class="relative w-12 cursor-pointer rounded-t-lg transition-all duration-300 bg-primary-600 shadow-[0_4px_12px_rgba(37,99,235,0.3)] hover:brightness-110"
          :style="{ height: Math.max((day.count / maxBarValue) * 100, 18) + '%' }"
        >
          <!-- Tooltip -->
          <div class="absolute -top-12 left-1/2 -translate-x-1/2 rounded-lg bg-text-primary px-3 py-2 text-[11px] font-black text-white opacity-0 transition-all group-hover:opacity-100 group-hover:-translate-y-2 pointer-events-none shadow-xl z-30 flex flex-col items-center min-w-[50px]">
            {{ day.count }}
            <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-text-primary rotate-45"></div>
          </div>
        </div>
        
        <span class="text-[11px] font-black text-primary-600 uppercase tracking-widest whitespace-nowrap">
          {{ formatDate(day.date) }}
        </span>
      </div>
    </div>
    
    <!-- Empty State for Chart -->
    <div v-else class="flex h-[200px] flex-col items-center justify-center text-text-muted gap-4">
      <div class="rounded-full bg-surface-input p-6">
        <BarChart3 class="h-10 w-10 opacity-20" />
      </div>
      <p class="text-sm font-bold uppercase tracking-widest opacity-60">{{ t('admin.dashboard.noTraffic7Days') }}</p>
    </div>
  </div>
</template>
