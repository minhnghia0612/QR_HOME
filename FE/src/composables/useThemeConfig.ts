import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { qrConfigApi } from '@/api/qr-config.api'
import { useAuthStore } from '@/stores/auth.store'
import { useStoreManager } from '@/stores/store-manager.store'
import { setAdminPreviewSession } from '@/lib/admin-preview-session'
import { THEMES, FONT_OPTIONS, type CustomerUiSize } from '@/constants/theme.constant'

export function useThemeConfig() {
  const authStore = useAuthStore()
  const storeManager = useStoreManager()
  const queryClient = useQueryClient()
  const { t } = useI18n({ useScope: 'global' })

  const toast = ref({ show: false, message: '', type: 'success' as 'success' | 'danger' | 'warning' })

  function showToast(message: string, type: 'success' | 'danger' | 'warning' = 'success') {
    toast.value = { show: true, message, type }
  }

  const { data: config, isLoading: loadingConfig } = useQuery({
    queryKey: ['qr-config', computed(() => storeManager.currentStoreId)],
    queryFn: async () => {
      const { data } = await qrConfigApi.getConfig()
      return data.data
    },
  })

  const selectedTheme = ref('classic')
  const customerInterface = ref({
    primaryColor: '#0253CD',
    secondaryColor: '#5E0B61',
    fontFamily: 'Inter',
    customerUiSize: 'normal' as CustomerUiSize,
  })

  const previewCurrencyUnit = computed(() => String(config.value?.currencyUnit || 'VND'))

  const themeColorPresets = computed(() => {
    const theme = THEMES.find(t => t.id === selectedTheme.value)
    if (!theme) return { 
      primary: ['#0253CD', '#0EA5E9', '#16A34A', '#EA580C', '#7C3AED'], 
      secondary: ['#5E0B61', '#0F766E', '#374151', '#BE185D', '#92400E'] 
    }

    const others = THEMES.filter(t => t.id !== theme.id)

    const buildUnique = (selfColor: string, key: 'primaryColor' | 'secondaryColor') => {
      const seen = new Set([selfColor.toUpperCase()])
      const unique: string[] = [selfColor]
      for (const t of others) {
        if (unique.length >= 5) break
        const c = t[key]
        if (!seen.has(c.toUpperCase())) {
          seen.add(c.toUpperCase())
          unique.push(c)
        }
      }
      return unique
    }

    return {
      primary: buildUnique(theme.primaryColor, 'primaryColor'),
      secondary: buildUnique(theme.secondaryColor, 'secondaryColor'),
    }
  })

  watch(selectedTheme, (themeId) => {
    const theme = THEMES.find(t => t.id === themeId)
    if (theme) {
      customerInterface.value.primaryColor = theme.primaryColor
      customerInterface.value.secondaryColor = theme.secondaryColor
    }
  })

  watch(config, (val) => {
    if (val) {
      const savedFontFamily = String(val.fontFamily || 'Inter')
      const normalizedFontFamily = FONT_OPTIONS.includes(savedFontFamily)
        ? savedFontFamily
        : 'Inter'

      selectedTheme.value = val.themeId || 'classic'
      customerInterface.value = {
        primaryColor: val.primaryColor || '#0253CD',
        secondaryColor: val.secondaryColor || '#5E0B61',
        fontFamily: normalizedFontFamily,
        customerUiSize: (val.customerUiSize || 'normal') as CustomerUiSize,
      }
    }
  }, { immediate: true })

  const { mutate: saveTheme, isPending: saving } = useMutation({
    mutationFn: async () => {
      const { data } = await qrConfigApi.updateThemeConfig({
        themeId: selectedTheme.value,
        primaryColor: customerInterface.value.primaryColor,
        secondaryColor: customerInterface.value.secondaryColor,
        fontFamily: customerInterface.value.fontFamily,
        customerUiSize: customerInterface.value.customerUiSize,
      })
      return data
    },
    onSuccess: () => {
      showToast(t('admin.theme.saved'), 'success')
      queryClient.invalidateQueries({ queryKey: ['qr-config'] })
      queryClient.invalidateQueries({ queryKey: ['public-config'] })
    },
    onError: (err: any) => {
      showToast(err.message || t('admin.theme.saveFailed'), 'danger')
    }
  })

  const previewUrl = computed(() => {
    const storeId = storeManager.currentStoreId
    if (!storeId) return ''
    return `/menu/${storeId}`
  })

  const previewFrameKey = computed(() => {
    return [
      selectedTheme.value,
      previewCurrencyUnit.value,
      customerInterface.value.primaryColor,
      customerInterface.value.secondaryColor,
      customerInterface.value.fontFamily,
      customerInterface.value.customerUiSize,
    ].join('|')
  })

  watch(
    [
      () => config.value?.adminId || authStore.admin?.id,
      selectedTheme,
      previewCurrencyUnit,
      () => customerInterface.value.primaryColor,
      () => customerInterface.value.secondaryColor,
      () => customerInterface.value.fontFamily,
      () => customerInterface.value.customerUiSize,
    ],
    ([adminId]) => {
      const effectiveAdminId = String(adminId || '')
      if (!effectiveAdminId) return

      setAdminPreviewSession(effectiveAdminId, {
        themeId: selectedTheme.value,
        currencyUnit: previewCurrencyUnit.value,
        primaryColor: customerInterface.value.primaryColor,
        secondaryColor: customerInterface.value.secondaryColor,
        fontFamily: customerInterface.value.fontFamily,
        customerUiSize: customerInterface.value.customerUiSize,
      })
    },
    { immediate: true, deep: true },
  )

  return {
    t,
    toast,
    loadingConfig,
    selectedTheme,
    customerInterface,
    themeColorPresets,
    saveTheme,
    saving,
    previewUrl,
    previewFrameKey,
    authStore
  }
}
