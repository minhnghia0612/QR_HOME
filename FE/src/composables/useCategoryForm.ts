import { ref, computed } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { categoriesApi } from '@/api/categories.api'
import { useI18n } from 'vue-i18n'
import { SUPPORTED_LOCALES, type AppLocale } from '@/i18n'

export function useCategoryForm(showToast: (msg: string, type: 'success' | 'danger' | 'warning') => void) {
  const queryClient = useQueryClient()
  const { t } = useI18n({ useScope: 'global' })

  const showForm = ref(false)
  const editingCategory = ref<any>(null)
  const showConflictDialog = ref(false)
  const existingCategory = ref<any>(null)

  const form = ref({ 
    name: '', 
    isActive: true,
    locales: {} as Record<string, { name: string }>
  })

  const formLocaleLang = ref<AppLocale>('en')

  const activeLocaleName = computed({
    get: () => {
      if (formLocaleLang.value === 'en') return form.value.name
      return form.value.locales?.[formLocaleLang.value]?.name ?? ''
    },
    set: (val: string) => {
      if (formLocaleLang.value === 'en') {
        form.value.name = val
        return
      }
      const locales = { ...form.value.locales }
      if (!locales[formLocaleLang.value]) {
        locales[formLocaleLang.value] = { name: '' }
      }
      locales[formLocaleLang.value].name = val
      form.value.locales = locales
    },
  })

  function hasLocaleContent(loc: AppLocale): boolean {
    if (loc === 'en') return !!form.value.name?.trim()
    return !!form.value.locales?.[loc]?.name?.trim()
  }

  function openCreate() {
    editingCategory.value = null
    form.value = { name: '', isActive: true, locales: {} }
    formLocaleLang.value = 'en'
    showForm.value = true
  }

  function openEdit(cat: any) {
    editingCategory.value = cat
    form.value = { 
      name: cat.name || '', 
      isActive: cat.isActive !== undefined ? cat.isActive : true,
      locales: cat.locales || {}
    }
    formLocaleLang.value = 'en'
    showForm.value = true
  }

  function resetForm() {
    showForm.value = false
    editingCategory.value = null
  }

  const { mutate: saveCategory, isPending: saving } = useMutation({
    mutationFn: async () => {
      const cleanLocales: Record<string, { name: string }> = {}
      for (const loc of SUPPORTED_LOCALES) {
        if (loc === 'en') continue
        const entry = form.value.locales?.[loc]
        if (entry?.name?.trim()) {
          cleanLocales[loc] = { name: entry.name.trim() }
        }
      }

      const payload = { 
        ...form.value,
        name: form.value.name.trim(),
        locales: cleanLocales
      }

      if (editingCategory.value) {
        const { data } = await categoriesApi.update(editingCategory.value.id, payload)
        return data
      } else {
        const { data } = await categoriesApi.create(payload)
        return data
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['categories'] })
      showToast(t('admin.categories.saved'), 'success')
      resetForm()
    },
    onError: (err: any) => {
      const errorData = err.response?.data
      if (err.response?.status === 409 && errorData?.existingCategory) {
        existingCategory.value = errorData.existingCategory
        showConflictDialog.value = true
        return
      }
      const message = errorData?.message || err.message || t('admin.categories.saveFailed')
      showToast(message, 'danger')
    },
  })

  function handleConflictYes() {
    if (existingCategory.value) {
      openEdit(existingCategory.value)
    }
    showConflictDialog.value = false
  }

  function handleConflictNo() {
    showConflictDialog.value = false
  }

  return {
    form,
    showForm,
    editingCategory,
    formLocaleLang,
    activeLocaleName,
    hasLocaleContent,
    openCreate,
    openEdit,
    resetForm,
    saveCategory,
    saving,
    showConflictDialog,
    existingCategory,
    handleConflictYes,
    handleConflictNo,
  }
}
