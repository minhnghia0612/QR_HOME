import { ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { qrConfigApi } from '@/api/qr-config.api'
import { useStoreManager } from '@/stores/store-manager.store'
import {
  normalizeText,
  normalizeEmail,
  isValidEmail,
  isValidPhone,
  getApiErrorMessage
} from '@/utils/settings.utils'

export type CurrencyUnit = 'VND' | 'USD' | 'EUR'

export function useSettingsForm(
  showToast: (message: string, type?: 'success' | 'danger' | 'warning') => void
) {
  const router = useRouter()
  const { t } = useI18n({ useScope: 'global' })
  const storeManager = useStoreManager()
  const queryClient = useQueryClient()

  const form = ref({
    spaName: '',
    spaAddress: '',
    spaPhone: '',
    spaEmail: '',
    spaLogo: '',
    bannerUrl: '',
    welcomeMessage: '',
    currencyUnit: 'VND' as CurrencyUnit,
    status: 'active',
  })

  const phoneError = ref('')

  const validatePhone = () => {
    const value = form.value.spaPhone.trim()
    if (!value) {
      phoneError.value = t('admin.settings.errors.phoneRequired')
      return
    }
    if (!isValidPhone(value)) {
      phoneError.value = t('admin.settings.errors.phoneFormat')
      return
    }
    phoneError.value = ''
  }

  const { data: config, isLoading: loadingConfig } = useQuery({
    queryKey: ['qr-config', computed(() => storeManager.currentStoreId)],
    queryFn: async () => {
      const { data } = await qrConfigApi.getConfig()
      return data.data
    },
  })

  watch(config, (val) => {
    if (val) {
      form.value = {
        spaName: val.spaName || storeManager.currentStore?.name || '',
        spaAddress: val.spaAddress || '',
        spaPhone: val.spaPhone || '',
        spaEmail: val.spaEmail || '',
        spaLogo: val.spaLogo || '',
        bannerUrl: val.bannerUrl || '',
        welcomeMessage: val.welcomeMessage || '',
        currencyUnit: (val.currencyUnit || 'VND') as CurrencyUnit,
        status: val.status || 'active',
      }
    }
  }, { immediate: true })

  const { mutate: saveConfig, isPending: saving } = useMutation({
    mutationFn: async () => {
      validatePhone()
      if (phoneError.value) {
        throw new Error(phoneError.value)
      }

      const payload = {
        spaName: normalizeText(form.value.spaName),
        spaAddress: normalizeText(form.value.spaAddress),
        spaPhone: normalizeText(form.value.spaPhone),
        spaEmail: normalizeEmail(form.value.spaEmail),
        spaLogo: String(form.value.spaLogo || '').trim(),
        bannerUrl: String(form.value.bannerUrl || '').trim(),
        welcomeMessage: normalizeText(form.value.welcomeMessage),
        currencyUnit: form.value.currencyUnit,
        status: normalizeText(form.value.status),
      }

      if (!payload.spaName) throw new Error(t('admin.settings.errors.storeNameRequired'))
      if (!payload.spaAddress) throw new Error(t('admin.settings.errors.addressRequired'))
      if (!payload.spaPhone) throw new Error(t('admin.settings.errors.phoneRequired'))
      if (!payload.spaEmail) throw new Error(t('admin.settings.errors.emailRequired'))
      if (!isValidEmail(payload.spaEmail)) throw new Error(t('admin.settings.errors.emailInvalid'))
      if (!payload.spaLogo) throw new Error(t('admin.settings.errors.logoRequired'))
      if (!payload.bannerUrl) throw new Error(t('admin.settings.errors.bannerRequired'))
      if (!payload.welcomeMessage) throw new Error(t('admin.settings.errors.welcomeRequired'))
      if (!payload.currencyUnit) throw new Error(t('admin.settings.errors.currencyRequired'))
      if (!payload.status) throw new Error(t('admin.settings.errors.statusRequired'))

      form.value = { ...payload }

      const { data } = await qrConfigApi.updateSettingsConfig(payload)
      return data
    },
    onSuccess: async () => {
      showToast(t('admin.settings.saved'), 'success')
      queryClient.invalidateQueries({ queryKey: ['qr-config'] })
      storeManager.fetchStores()
      
      setTimeout(() => {
        router.push('/admin/categories')
      }, 1500)
    },
    onError: (err: any) => {
      showToast(getApiErrorMessage(err, t('admin.settings.saveFailed')), 'danger')
    }
  })

  function cancelChanges() {
    if (config.value) {
      form.value = { 
        spaName: config.value.spaName || '',
        spaAddress: config.value.spaAddress || '',
        spaPhone: config.value.spaPhone || '',
        spaEmail: config.value.spaEmail || '',
        spaLogo: config.value.spaLogo || '',
        bannerUrl: config.value.bannerUrl || '',
        welcomeMessage: config.value.welcomeMessage || '',
        currencyUnit: (config.value.currencyUnit || 'VND') as CurrencyUnit,
        status: config.value.status || 'active'
      }
    }
  }

  return {
    form,
    config,
    loadingConfig,
    phoneError,
    validatePhone,
    saveConfig,
    saving,
    cancelChanges,
  }
}
