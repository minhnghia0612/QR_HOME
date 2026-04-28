<script setup lang="ts">
import { Download } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  spaName: string | undefined
  isLoading: boolean
  canDownload: boolean
}>()

const emit = defineEmits<{
  (e: 'download'): void
}>()

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <div v-if="isLoading" class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <div class="h-10 w-72 rounded-lg bg-surface-input animate-pulse"></div>
    </div>
    <div class="h-12 w-40 rounded-xl bg-surface-input animate-pulse"></div>
  </div>
  <div v-else class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h2 class="text-4xl font-bold tracking-tight text-text-primary">
        {{ t('admin.dashboard.welcome') }}, {{ spaName }}
      </h2>
    </div>
    <button
      class="flex items-center gap-2 rounded-xl bg-surface-secondary px-6 py-3 text-sm font-bold text-text-dim transition-all hover:bg-surface-input disabled:opacity-50"
      :disabled="!canDownload"
      @click="emit('download')"
    >
      <Download class="h-4 w-4" />
      {{ t('admin.dashboard.downloadQr') }}
    </button>
  </div>
</template>
