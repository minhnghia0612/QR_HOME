import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AppLocale } from '@/i18n'
import type { Service, ServiceLocales, ServiceLocaleEntry } from '@/types/service.types'

/**
 * Returns a helper that resolves the right locale value for a service text field.
 *
 * Priority: current locale → 'en' fallback → root field on the service object
 */
export function useServiceLocale() {
  const { locale } = useI18n({ useScope: 'global' })

  /**
   * Get the locale entry for a service, resolving in priority order:
   * 1. Current active locale
   * 2. English ('en') fallback
   * 3. undefined → caller will use the root field (service.name / service.description)
   */
  function getLocaleEntry(
    locales: ServiceLocales | undefined,
  ): ServiceLocaleEntry | undefined {
    if (!locales) return undefined
    const current = locales[locale.value as AppLocale]
    if (current?.name?.trim()) return current
    // Only fall back to explicit 'en' entry (which may not exist if admin used root fields for English)
    const en = locales['en']
    if (en?.name?.trim()) return en
    return undefined
  }

  /** Resolve display name for a service */
  function getServiceName(service: Pick<Service, 'name' | 'locales'>): string {
    return getLocaleEntry(service.locales)?.name?.trim() || service.name || ''
  }

  /** Resolve display description for a service */
  function getServiceDescription(service: Pick<Service, 'description' | 'locales'>): string {
    return (
      getLocaleEntry(service.locales)?.description?.trim() || service.description || ''
    )
  }

  /** Resolve short description for a service */
  function getServiceShortDescription(
    service: Pick<Service, 'shortDescription' | 'locales'>,
  ): string {
    return (
      getLocaleEntry(service.locales)?.shortDescription?.trim() ||
      service.shortDescription ||
      ''
    )
  }

  /** Resolve variant name for a service */
  function getVariantName(service: Pick<Service, 'variantOptions' | 'locales'>, index: number): string {
    const localeEntry = getLocaleEntry(service.locales)
    const variantName = localeEntry?.variantNames?.[index]
    if (variantName?.trim()) return variantName.trim()
    
    return service.variantOptions?.[index]?.name || ''
  }

  /** Resolve special tags for a service */
  function getServiceSpecialTags(service: Pick<Service, 'specialTags' | 'locales'>): string[] {
    return (
      getLocaleEntry(service.locales)?.specialTags || service.specialTags || []
    )
  }

  return {
    locale: computed(() => locale.value as AppLocale),
    getLocaleEntry,
    getServiceName,
    getServiceDescription,
    getServiceShortDescription,
    getServiceSpecialTags,
    getVariantName,
  }
}
