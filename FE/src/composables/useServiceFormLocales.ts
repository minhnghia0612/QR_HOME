import { computed, type Ref } from 'vue'
import type { AppLocale } from '@/i18n'
import type { ServiceLocales } from '@/types/service.types'

export function useServiceFormLocales(form: Ref<any>, formLocaleLang: Ref<AppLocale>) {
  const activeLocaleName = computed({
    get: () => formLocaleLang.value === 'en' ? form.value.name : form.value.locales?.[formLocaleLang.value]?.name ?? '',
    set: (val: string) => {
      if (formLocaleLang.value === 'en') {
        form.value.name = val
        return
      }
      const entry = { ...(form.value.locales?.[formLocaleLang.value] || { name: '' }) }
      entry.name = val
      form.value.locales = { ...form.value.locales, [formLocaleLang.value]: entry }
    },
  })

  const activeLocaleShortDesc = computed({
    get: () => formLocaleLang.value === 'en' ? form.value.shortDescription ?? '' : form.value.locales?.[formLocaleLang.value]?.shortDescription ?? '',
    set: (val: string) => {
      if (formLocaleLang.value === 'en') {
        form.value.shortDescription = val
        return
      }
      const entry = { ...(form.value.locales?.[formLocaleLang.value] || { name: '' }) }
      entry.shortDescription = val
      form.value.locales = { ...form.value.locales, [formLocaleLang.value]: entry }
    },
  })

  const activeLocaleDescription = computed({
    get: () => formLocaleLang.value === 'en' ? form.value.description : form.value.locales?.[formLocaleLang.value]?.description ?? '',
    set: (val: string) => {
      if (formLocaleLang.value === 'en') {
        form.value.description = val
        return
      }
      const entry = { ...(form.value.locales?.[formLocaleLang.value] || { name: '' }) }
      entry.description = val
      form.value.locales = { ...form.value.locales, [formLocaleLang.value]: entry }
    },
  })

  const activeLocaleSpecialTags = computed({
    get: () => formLocaleLang.value === 'en' ? form.value.specialTags || [] : form.value.locales?.[formLocaleLang.value]?.specialTags || [],
    set: (val: string[]) => {
      if (formLocaleLang.value === 'en') {
        form.value.specialTags = val
        return
      }
      if (!form.value.locales) form.value.locales = {}
      const entry = { ...(form.value.locales![formLocaleLang.value] || { name: form.value.name || '' }) }
      entry.specialTags = val
      form.value.locales = { ...form.value.locales, [formLocaleLang.value]: entry }
    },
  })

  function getVariantName(idx: number): string {
    if (formLocaleLang.value === 'en') return form.value.variantOptions?.[idx]?.name || ''
    return form.value.locales?.[formLocaleLang.value]?.variantOptions?.[idx]?.name || form.value.variantOptions?.[idx]?.name || ''
  }

  function setVariantName(idx: number, val: string) {
    if (formLocaleLang.value === 'en') {
      if (form.value.variantOptions?.[idx]) {
        form.value.variantOptions[idx].name = val
      }
    } else {
      if (!form.value.locales) form.value.locales = {}
      if (!form.value.locales[formLocaleLang.value]) form.value.locales[formLocaleLang.value] = { name: form.value.name || '' }
      if (!form.value.locales[formLocaleLang.value]!.variantOptions) {
        form.value.locales[formLocaleLang.value]!.variantOptions = (form.value.variantOptions || []).map((o: any) => ({ ...o }))
      }
      const target = form.value.locales[formLocaleLang.value]!.variantOptions!
      if (!target[idx]) target[idx] = { name: '', price: 0 }
      target[idx].name = val
    }
  }

  function addVariantOption() {
    if (!form.value.variantOptions) form.value.variantOptions = []
    form.value.variantOptions.push({ name: '', price: 0 })
    if (form.value.locales) {
      for (const lang of Object.keys(form.value.locales)) {
        if (form.value.locales[lang as AppLocale]?.variantOptions) {
          form.value.locales[lang as AppLocale]!.variantOptions!.push({ name: '', price: 0 })
        }
      }
    }
  }

  function removeVariantOption(idx: number) {
    form.value.variantOptions?.splice(idx, 1)
    if (form.value.locales) {
      for (const lang of Object.keys(form.value.locales)) {
        form.value.locales[lang as AppLocale]?.variantOptions?.splice(idx, 1)
      }
    }
  }

  function hasLocaleContent(loc: string): boolean {
    if (loc === 'en') return !!form.value.name?.trim()
    return !!form.value.locales?.[loc as AppLocale]?.name?.trim()
  }

  return {
    activeLocaleName,
    activeLocaleShortDesc,
    activeLocaleDescription,
    activeLocaleSpecialTags,
    getVariantName,
    setVariantName,
    addVariantOption,
    removeVariantOption,
    hasLocaleContent,
  }
}
