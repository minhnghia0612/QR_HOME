import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AppLocale } from '@/i18n'

export function useCategoryLocale() {
  const { locale } = useI18n({ useScope: 'global' })

  function getCategoryName(category: any): string {
    if (!category) return ''
    const current = category.locales?.[locale.value as AppLocale]
    if (current?.name?.trim()) return current.name.trim()
    
    // Fallback to English locale entry if present
    const en = category.locales?.['en']
    if (en?.name?.trim()) return en.name.trim()
    
    // Fallback to root name field
    return category.name || ''
  }

  return {
    locale: computed(() => locale.value as AppLocale),
    getCategoryName,
  }
}
