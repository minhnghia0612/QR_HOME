import { ref, computed } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { servicesApi } from '@/api/services.api'
import { qrConfigApi } from '@/api/qr-config.api'
import type { AppLocale } from '@/i18n'
import { SUPPORTED_LOCALES } from '@/i18n'
import type { ServiceLocales } from '@/types/service.types'
import imgFallback from '@/assets/img_fallback.png'
import { parseOptionalNumber } from '@/utils/service.utils'
import { useServiceFormLocales } from './useServiceFormLocales'
import { useServiceFormUpload } from './useServiceFormUpload'

export function useServiceForm(showToast: (msg: string, type: 'success'|'danger'|'warning') => void, pageRef: any, selectedSortRef: any) {
  const queryClient = useQueryClient()
  const { t } = useI18n({ useScope: 'global' })

  const showForm = ref(false)
  const editingService = ref<any>(null)
  const formLoading = ref(false)
  const formError = ref('')
  const priceFromInput = ref('')
  const priceToInput = ref('')
  const newLabelInput = ref('')
  const newLabelError = ref('')
  const fieldErrors = ref({
    name: '',
    categoryId: '',
    price: '',
    imageUrl: '',
    variantOptions: '',
  })
  
  const showConflictDialog = ref(false)
  const existingService = ref<any>(null)

  const form = ref({
    name: '',
    shortDescription: '',
    categoryId: '',
    price: 0,
    priceFrom: undefined as number | undefined,
    priceTo: undefined as number | undefined,
    description: '',
    durationMinutes: 60,
    imageUrl: '',
    hasVariants: false,
    variantOptions: [] as Array<{ name: string; price: number }>,
    isBestSeller: false,
    isNewService: false,
    isCombo: false,
    specialTags: [] as string[],
    isActive: true,
    locales: {} as ServiceLocales,
  })

  const formLocaleLang = ref<AppLocale>('en')

  const {
    activeLocaleName,
    activeLocaleShortDesc,
    activeLocaleDescription,
    activeLocaleSpecialTags,
    getVariantName,
    setVariantName,
    addVariantOption,
    removeVariantOption,
    hasLocaleContent,
  } = useServiceFormLocales(form, formLocaleLang)

  const {
    uploadLoading,
    isDraggingImage,
    handleUpload,
    handleDrop,
  } = useServiceFormUpload(form, showToast, t)

  function getApiErrorMessage(err: any, fallback: string): string {
    const raw = err?.response?.data?.message
    if (Array.isArray(raw)) {
      const normalized = raw.map((item) => String(item || '').trim()).filter(Boolean)
      return normalized[0] || fallback
    }
    if (typeof raw === 'string' && raw.trim()) return raw
    if (typeof err?.message === 'string' && err.message.trim()) return err.message
    return fallback
  }

  function openCreate() {
    editingService.value = null
    formLoading.value = false
    formLocaleLang.value = 'en'
    form.value = {
      name: '',
      shortDescription: '',
      categoryId: '',
      price: 0,
      priceFrom: undefined,
      priceTo: undefined,
      description: '',
      durationMinutes: 60,
      imageUrl: '',
      hasVariants: false,
      variantOptions: [],
      isBestSeller: false,
      isNewService: false,
      isCombo: false,
      specialTags: [],
      isActive: true,
      locales: {},
    }
    priceFromInput.value = ''
    priceToInput.value = ''
    formError.value = ''
    newLabelInput.value = ''
    newLabelError.value = ''
    fieldErrors.value = { name: '', categoryId: '', price: '', imageUrl: '', variantOptions: '' }
    showForm.value = true
  }

  async function openEdit(svc: any) {
    editingService.value = svc
    formError.value = ''
    newLabelInput.value = ''
    newLabelError.value = ''
    fieldErrors.value = { name: '', categoryId: '', price: '', imageUrl: '', variantOptions: '' }
    formLoading.value = true
    showForm.value = true

    try {
      const { data } = await servicesApi.getOne(svc.id)
      const detail = (data as any).data || data

      form.value = {
        name: detail.name || '',
        shortDescription: detail.shortDescription || '',
        categoryId: detail.categoryId || '',
        price: detail.price ? Number(detail.price) : 0,
        priceFrom: detail.priceFrom != null ? Number(detail.priceFrom) : undefined,
        priceTo: detail.priceTo != null ? Number(detail.priceTo) : undefined,
        description: detail.description || '',
        durationMinutes: detail.durationMinutes || 60,
        imageUrl: detail.imageUrl || '',
        hasVariants: !!detail.hasVariants,
        variantOptions: Array.isArray(detail.variantOptions)
          ? detail.variantOptions.map((opt: any) => ({
              name: opt?.name || '',
              price: Number(opt?.price) || 0,
            }))
          : [],
        isBestSeller: !!detail.isBestSeller,
        isNewService: !!detail.isNewService,
        isCombo: false,
        specialTags: Array.isArray(detail.specialTags) ? detail.specialTags : [],
        isActive: detail.isActive !== undefined ? detail.isActive : true,
        locales: detail.locales && typeof detail.locales === 'object' ? detail.locales : {},
      }
      priceFromInput.value = form.value.priceFrom != null ? String(form.value.priceFrom) : ''
      priceToInput.value = form.value.priceTo != null ? String(form.value.priceTo) : ''
    } catch (err: any) {
      formError.value = err?.message || 'Failed to load service detail'
      showToast(formError.value, 'danger')
    } finally {
      formLoading.value = false
    }
  }

  function resetForm() {
    showForm.value = false
    editingService.value = null
    formError.value = ''
    newLabelInput.value = ''
    newLabelError.value = ''
    fieldErrors.value = { name: '', categoryId: '', price: '', imageUrl: '', variantOptions: '' }
    formLoading.value = false
  }

  const { mutate: saveService, isPending: saving } = useMutation({
    mutationFn: async () => {
      formError.value = ''
      fieldErrors.value = { name: '', categoryId: '', price: '', imageUrl: '', variantOptions: '' }

      if (!String(form.value.name || '').trim()) {
        fieldErrors.value.name = t('admin.serviceForm.errors.nameRequired')
        throw new Error(t('admin.serviceForm.errors.nameRequired'))
      }

      if (!form.value.categoryId) {
        fieldErrors.value.categoryId = t('admin.serviceForm.errors.categoryRequired')
        throw new Error(t('admin.serviceForm.errors.categoryRequired'))
      }

      const hasVariants = !!form.value.hasVariants
      const priceFrom = hasVariants ? undefined : parseOptionalNumber(priceFromInput.value)
      const priceTo = hasVariants ? undefined : parseOptionalNumber(priceToInput.value)

      let normalizedPrice = Number(form.value.price)

      if (hasVariants) {
        const options = (form.value.variantOptions || []).map((opt: any) => ({
          name: String(opt?.name || '').trim(),
          price: Number(opt?.price),
        }))

        if (!options.length) {
          fieldErrors.value.variantOptions = t('admin.serviceForm.errors.variantRequired')
          throw new Error(t('admin.serviceForm.errors.variantRequired'))
        }

        options.forEach((opt: any) => {
          if (!opt.name) {
            fieldErrors.value.variantOptions = t('admin.serviceForm.errors.variantNameRequired')
            throw new Error(t('admin.serviceForm.errors.variantNameRequired'))
          }
          if (!Number.isFinite(opt.price) || opt.price <= 0) {
            fieldErrors.value.variantOptions = t('admin.serviceForm.errors.variantPriceRequired')
            throw new Error(t('admin.serviceForm.errors.variantPriceRequired'))
          }
        })

        normalizedPrice = Math.min(...options.map((opt: any) => opt.price))
        form.value.variantOptions = options
      } else {
        if (priceFrom === undefined) {
          fieldErrors.value.price = t('admin.serviceForm.errors.priceRequired')
          throw new Error(t('admin.serviceForm.errors.priceRequired'))
        }

        if (Number(priceFrom) <= 0) {
          fieldErrors.value.price = t('admin.serviceForm.errors.priceMin')
          throw new Error(t('admin.serviceForm.errors.priceMin'))
        }

        if (priceTo !== undefined && Number(priceTo) <= 0) {
          fieldErrors.value.price = t('admin.serviceForm.errors.priceMin')
          throw new Error(t('admin.serviceForm.errors.priceMin'))
        }

        if (priceTo !== undefined && Number(priceFrom) >= Number(priceTo)) {
          fieldErrors.value.price = t('admin.serviceForm.errors.priceFromToOrder')
          throw new Error(t('admin.serviceForm.errors.priceFromToOrder'))
        }

        normalizedPrice = Number(priceFrom)
      }

      const cleanLocales: ServiceLocales = {}
      for (const loc of SUPPORTED_LOCALES) {
        if (loc === 'en') continue
        const entry = form.value.locales?.[loc]
        if (entry?.name?.trim()) {
          const cleanVariants = (entry.variantOptions || []).filter((o: any) => o.name?.trim() && Number.isFinite(o.price) && o.price > 0)
          
          cleanLocales[loc] = {
            name: entry.name.trim(),
            description: entry.description?.trim() || undefined,
            shortDescription: entry.shortDescription?.trim() || undefined,
            variantOptions: cleanVariants.length > 0 ? cleanVariants : undefined,
            specialTags: entry.specialTags?.length ? entry.specialTags : undefined,
          }
        }
      }

      const payload = {
        ...form.value,
        isCombo: false,
        price: normalizedPrice,
        priceFrom,
        priceTo,
        imageUrl: form.value.imageUrl || imgFallback,
        variantOptions: hasVariants ? form.value.variantOptions : undefined,
        locales: Object.keys(cleanLocales).length > 0 ? cleanLocales : undefined,
      }

      if (editingService.value) {
        const { data } = await servicesApi.update(editingService.value.id, payload)
        return data
      } else {
        const { data } = await servicesApi.create(payload)
        return data
      }
    },
    onSuccess: async () => {
      const justCreated = !editingService.value

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['services'] }),
        queryClient.invalidateQueries({ queryKey: ['nav-services-count'] }),
        queryClient.invalidateQueries({ queryKey: ['public-services'] }),
        queryClient.invalidateQueries({ queryKey: ['public-categories'] }),
      ])

      if (justCreated && selectedSortRef) {
        if (selectedSortRef.value === 'oldest') {
          selectedSortRef.value = 'newest'
        }
      }
      if (justCreated && pageRef) {
        pageRef.value = 1
      }

      showToast('Service saved successfully', 'success')
      resetForm()
      
      const { data: servicesData } = await servicesApi.getAll({ limit: 1 })
      const items = (servicesData as any).data?.items || servicesData.data
      const total = (servicesData as any).data?.total || items?.length || 0
      
      if (total >= 1) { 
        try {
          await qrConfigApi.generate()
        } catch (err) {
          console.error('Auto QR failed:', err)
        }
      }
    },
    onError: (err: any) => {
      const errorData = err.response?.data
      if (err.response?.status === 409 && errorData?.existingService) {
        existingService.value = errorData.existingService
        showConflictDialog.value = true
        return
      }
      const message = getApiErrorMessage(err, 'Failed to save service')
      formError.value = message
      showToast(message, 'danger')
    },
  })

  function handleConflictYes() {
    if (existingService.value) {
      openEdit(existingService.value)
    }
    showConflictDialog.value = false
  }

  function handleConflictNo() {
    showConflictDialog.value = false
  }

  return {
    form,
    showForm,
    editingService,
    formLoading,
    formError,
    priceFromInput,
    priceToInput,
    newLabelInput,
    newLabelError,
    fieldErrors,
    showConflictDialog,
    existingService,
    uploadLoading,
    isDraggingImage,
    formLocaleLang,
    activeLocaleName,
    activeLocaleShortDesc,
    activeLocaleDescription,
    activeLocaleSpecialTags,
    getVariantName,
    setVariantName,
    addVariantOption,
    removeVariantOption,
    hasLocaleContent,
    openCreate,
    openEdit,
    resetForm,
    saveService,
    saving,
    handleUpload,
    handleDrop,
    handleConflictYes,
    handleConflictNo,
  }
}
