import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { qrConfigApi } from '@/api/qr-config.api'
import { computed, ref } from 'vue'
import { useStoreManager } from '@/stores/store-manager.store'
import { useI18n } from 'vue-i18n'

export function useQrManagement() {
  const storeManager = useStoreManager()
  const queryClient = useQueryClient()
  const { t } = useI18n({ useScope: 'global' })

  const { data: qrConfig, isFetching: loadingQrConfig } = useQuery({
    queryKey: ['qr-config', computed(() => storeManager.currentStoreId)],
    queryFn: async () => {
      const { data } = await qrConfigApi.getConfig()
      return data.data
    },
    staleTime: 0,
    refetchOnMount: 'always',
  })

  const { data: qrImageRes, isFetching: loadingQrImage } = useQuery({
    queryKey: computed(() => ['qr-image', storeManager.currentStoreId, qrConfig.value?.status, qrConfig.value?.qrUrl]),
    queryFn: async () => {
      const { data } = await qrConfigApi.downloadQr()
      return data.data
    },
    enabled: computed(() => qrConfig.value?.status === 'active' && !!qrConfig.value?.qrUrl),
    staleTime: 0,
    refetchOnMount: 'always',
  })

  const { mutate: updateQrStatus, isPending: updatingStatus } = useMutation({
    mutationFn: async (status: 'active' | 'paused' | 'inactive') => {
      await qrConfigApi.updateStatus(status)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-config'] })
    },
  })

  const generating = ref(false)
  async function generateQr() {
    if (generating.value) return
    generating.value = true
    try {
      const { data } = await qrConfigApi.generate()
      if (data.data) {
        queryClient.invalidateQueries({ queryKey: ['qr-config'] })
      }
    } catch (error) {
      console.error('Failed to generate QR:', error)
    } finally {
      generating.value = false
    }
  }

  async function downloadQr() {
    try {
      const { data } = await qrConfigApi.downloadQr()
      const url = data.data
      if (url) {
        const a = document.createElement('a')
        a.href = url
        a.download = t('admin.dashboard.qrFilename')
        a.click()
      }
    } catch { /* skip */ }
  }

  return {
    qrConfig,
    loadingQrConfig,
    qrImageRes,
    loadingQrImage,
    updateQrStatus,
    updatingStatus,
    generateQr,
    downloadQr
  }
}
