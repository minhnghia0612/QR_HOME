<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { qrConfigApi } from '@/api/qr-config.api'
import type { QrStatus } from '@/types/qr-config.types'
import { QrCode, Play, Pause, Download, AlertCircle, CheckCircle2 } from 'lucide-vue-next'
import { useStoreManager } from '@/stores/store-manager.store'

const storeManager = useStoreManager()
const queryClient = useQueryClient()
const { t } = useI18n({ useScope: 'global' })

const { data: config, isLoading } = useQuery({
  queryKey: ['qr-config', computed(() => storeManager.currentStoreId)],
  queryFn: async () => {
    const { data } = await qrConfigApi.getConfig()
    return data.data
  },
})

const generateMutation = useMutation({
  mutationFn: () => qrConfigApi.generate(),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['qr-config'] }),
})

const statusMutation = useMutation({
  mutationFn: (status: QrStatus) => qrConfigApi.updateStatus(status),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['qr-config'] }),
})

const statusColor = computed(() => {
  switch (config.value?.status) {
    case 'active': return { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' }
    case 'paused': return { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' }
    default: return { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' }
  }
})

async function downloadQr() {
  try {
    const { data } = await qrConfigApi.downloadQr()
    const dataUrl = data.data

    // Create download link
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = t('admin.dashboard.qrFilename')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (err: any) {
    alert(err.response?.data?.message || t('admin.qr.errors.downloadFailed'))
  }
}
</script>

<template>
  <div class="mx-auto max-w-2xl space-y-6">
    <div>
      <h2 class="text-2xl font-bold text-navy-900">{{ t('admin.qr.title') }}</h2>
      <p class="text-sm text-text-muted">{{ t('admin.qr.subtitle') }}</p>
    </div>

    <div v-if="isLoading" class="flex h-48 items-center justify-center text-text-muted">
      {{ t('admin.qr.loading') }}
    </div>

    <div v-else class="space-y-6">
      <!-- Status card -->
      <div class="rounded-xl border border-border bg-white p-6 shadow-card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-text-muted">{{ t('admin.qr.currentStatus') }}</p>
            <div class="mt-1 flex items-center gap-2">
              <div
                :class="['h-2.5 w-2.5 rounded-full', statusColor.dot]"
              />
              <span
                :class="['text-lg font-semibold capitalize', statusColor.text]"
              >
                {{ config?.status || t('admin.common.inactive') }}
              </span>
            </div>
          </div>
          <div
            :class="[
              'flex h-16 w-16 items-center justify-center rounded-2xl',
              statusColor.bg,
            ]"
          >
            <QrCode :class="['h-8 w-8', statusColor.text]" />
          </div>
        </div>

        <!-- URL -->
        <div v-if="config?.qrUrl" class="mt-4 rounded-lg bg-surface-dim px-4 py-3">
          <p class="text-xs text-text-muted">{{ t('admin.qr.qrUrl') }}</p>
          <p class="mt-0.5 break-all font-mono text-sm text-navy-700">{{ config.qrUrl }}</p>
        </div>

        <!-- Dates -->
        <div v-if="config?.generatedAt" class="mt-3 flex gap-6 text-xs text-text-muted">
          <span>{{ t('admin.qr.generated') }}: {{ new Date(config.generatedAt).toLocaleString() }}</span>
          <span v-if="config.updatedAt">{{ t('admin.qr.updated') }}: {{ new Date(config.updatedAt).toLocaleString() }}</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <!-- Generate / Re-generate -->
        <button
          class="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-navy-900 to-navy-800 px-6 py-3 text-sm font-medium text-white shadow-card transition-all hover:from-navy-800 hover:to-navy-700 disabled:opacity-50"
          :disabled="generateMutation.isPending.value"
          @click="generateMutation.mutate()"
        >
          <QrCode class="h-4 w-4" />
          {{ config?.generatedAt ? t('admin.qr.regenerate') : t('admin.qr.generate') }}
        </button>

        <!-- Pause / Resume -->
        <button
          v-if="config?.status === 'active'"
          class="flex items-center justify-center gap-2 rounded-xl border border-yellow-200 bg-yellow-50 px-6 py-3 text-sm font-medium text-yellow-700 transition-all hover:bg-yellow-100"
          @click="statusMutation.mutate('paused')"
        >
          <Pause class="h-4 w-4" />
          {{ t('admin.qr.pause') }}
        </button>
        <button
          v-else-if="config?.status === 'paused'"
          class="flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 px-6 py-3 text-sm font-medium text-green-700 transition-all hover:bg-green-100"
          @click="statusMutation.mutate('active')"
        >
          <Play class="h-4 w-4" />
          {{ t('admin.qr.resume') }}
        </button>

        <!-- Download -->
        <button
          v-if="config?.status === 'active'"
          class="flex items-center justify-center gap-2 rounded-xl border border-azure-200 bg-azure-50 px-6 py-3 text-sm font-medium text-azure-700 transition-all hover:bg-azure-100 sm:col-span-2"
          @click="downloadQr"
        >
          <Download class="h-4 w-4" />
          {{ t('admin.qr.downloadImage') }}
        </button>
      </div>

      <!-- Error messages -->
      <div
        v-if="generateMutation.isError.value"
        class="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
      >
        <AlertCircle class="mt-0.5 h-4 w-4 flex-shrink-0" />
        {{ (generateMutation.error.value as any)?.response?.data?.message || t('admin.qr.errors.generateFailed') }}
      </div>

      <div
        v-if="statusMutation.isError.value"
        class="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
      >
        <AlertCircle class="mt-0.5 h-4 w-4 flex-shrink-0" />
        {{ (statusMutation.error.value as any)?.response?.data?.message || t('admin.qr.errors.statusFailed') }}
      </div>

      <!-- Info -->
      <div
        class="flex items-start gap-3 rounded-xl border border-azure-200 bg-azure-50 p-4 text-sm text-azure-700"
      >
        <CheckCircle2 class="mt-0.5 h-4 w-4 flex-shrink-0" />
        <div>
          <p class="font-medium">{{ t('admin.qr.howItWorks') }}</p>
          <ul class="mt-1 list-inside list-disc space-y-0.5 text-azure-600">
            <li>{{ t('admin.qr.steps.generate') }}</li>
            <li>{{ t('admin.qr.steps.pause') }}</li>
            <li>{{ t('admin.qr.steps.requirement') }}</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
