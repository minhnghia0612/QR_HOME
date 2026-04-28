<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  qrConfig: any
  qrImageRes: string | undefined
  isLoading: boolean
  isImageLoading: boolean
  isUpdating: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle-status'): void
}>()

const { t } = useI18n({ useScope: 'global' })

function formatLastUpdated(dateStr: string) {
  const d = new Date(dateStr)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const mth = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${hh}:${mm} ${dd}/${mth}/${yyyy}`
}
</script>

<template>
  <div class="w-full rounded-4xl bg-white p-8 shadow-card lg:w-80">
    <p class="text-xs font-bold uppercase tracking-widest text-text-secondary">
      {{ t('admin.dashboard.qrStatus') }}
    </p>
    
    <div v-if="isLoading || !qrConfig" class="mt-4 flex items-center gap-3">
      <div class="skeleton h-4 w-4 rounded-full"></div>
      <div class="skeleton h-8 w-24"></div>
    </div>
    <div v-else class="mt-4 flex items-center gap-3">
      <span :class="['inline-block h-4 w-4 rounded-full', qrConfig?.status === 'active' ? 'bg-success' : 'bg-danger']" />
      <span class="text-2xl font-bold text-text-primary">
        {{ qrConfig?.status === 'active' ? t('admin.common.active') : (qrConfig?.status === 'paused' ? t('admin.common.paused') : t('admin.common.inactive')) }}
      </span>
    </div>

    <div class="mt-6 flex justify-center">
      <div class="flex h-48 w-48 items-center justify-center rounded-3xl bg-surface-input overflow-hidden ring-1 ring-border shadow-inner p-4">
        <template v-if="isLoading || (qrConfig?.status === 'active' && (isImageLoading || !qrImageRes))">
          <div class="h-full w-full rounded-2xl bg-white/80 animate-pulse"></div>
        </template>
        <template v-else-if="qrConfig?.status === 'active' && qrImageRes">
           <img :src="qrImageRes" alt="QR Code" class="h-full w-full object-contain mix-blend-multiply" />
        </template>
        <div v-else class="text-center p-4">
          <span class="text-4xl opacity-20">📵</span>
        </div>
      </div>
    </div>

    <button
      v-if="!isLoading && qrConfig?.status !== 'inactive'"
      @click="emit('toggle-status')"
      :disabled="isUpdating"
      class="mt-6 w-full rounded-xl py-3 text-sm font-bold transition-all"
      :class="qrConfig?.status === 'active' ? 'bg-danger/10 text-danger hover:bg-danger/20' : 'bg-success/10 text-success hover:bg-success/20'"
    >
      {{ qrConfig?.status === 'active' ? t('admin.dashboard.pauseService') : t('admin.dashboard.resumeService') }}
    </button>
    <div v-else-if="isLoading" class="mt-6 h-11 w-full rounded-xl bg-surface-input animate-pulse"></div>

    <p v-if="!isLoading" class="mt-4 text-center text-[10px] text-text-muted">
      {{ t('admin.dashboard.lastUpdated') }}: {{ qrConfig?.updatedAt ? formatLastUpdated(qrConfig.updatedAt) : '—' }}
    </p>
    <div v-else class="mx-auto mt-4 h-3 w-36 rounded bg-surface-input animate-pulse"></div>
  </div>
</template>
