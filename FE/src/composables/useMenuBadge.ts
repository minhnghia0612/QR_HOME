import { useI18n } from 'vue-i18n'
import { useServiceLocale } from '@/composables/useServiceLocale'

/**
 * useMenuBadge
 * Handles badge/label rendering helpers for the customer menu.
 * Covers both generic badges and Ocean-theme-specific badge variants.
 */
export function useMenuBadge() {
  const { t, te } = useI18n({ useScope: 'global' })
  const { getServiceSpecialTags } = useServiceLocale()

  const BADGE_STYLE_MAP: Record<string, string> = {
    best_seller: 'bg-badge-bestseller-bg text-badge-bestseller-text',
    new_service: 'bg-badge-new-bg text-badge-new-text',
    must_try: 'bg-emerald-100 text-emerald-700',
    limited_edition: 'bg-amber-100 text-amber-700',
    summer_special: 'bg-orange-100 text-orange-700',
    happy_hour: 'bg-pink-100 text-pink-700',
  }

  function formatTagLabel(tag: string): string {
    const key = `menu.badges.${tag}`
    if (te(key)) return t(key)
    return tag
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  function getServiceLabelItems(item: any): Array<{ key: string; label: string }> {
    const labels: Array<{ key: string; label: string }> = []
    if (item?.isBestSeller) labels.push({ key: 'best_seller', label: t('menu.badges.best_seller') })
    if (item?.isNewService) labels.push({ key: 'new_service', label: t('menu.badges.new_service') })

    const tags = getServiceSpecialTags(item)
    if (tags.length > 0) {
      tags.forEach((tag: string) => {
        const normalizedTag = String(tag || '').trim()
        if (normalizedTag) labels.push({ key: normalizedTag, label: formatTagLabel(normalizedTag) })
      })
    }

    const seen = new Set<string>()
    return labels.filter((label) => {
      if (seen.has(label.key)) return false
      seen.add(label.key)
      return true
    })
  }

  function getBadgeClasses(key: string): string {
    if (key === 'must_try') return 'bg-primary-100 text-primary-600'
    if (key === 'limited_edition') return 'bg-surface-secondary text-text-secondary'
    return BADGE_STYLE_MAP[key] || 'bg-primary-100 text-primary-600'
  }

  function getOceanBadgeClasses(key: string): string {
    if (key === 'best_seller') return 'bg-[#FDE68A] text-[#92400E]'
    if (key === 'new_service') return 'bg-[#A5F3FC] text-[#155E75]'
    if (key === 'must_try') return 'bg-[#A7F3D0] text-[#065F46]'
    if (key === 'limited_edition') return 'bg-[#DDD6FE] text-[#5B21B6]'
    if (key === 'summer_special') return 'bg-[#FED7AA] text-[#9A3412]'
    if (key === 'happy_hour') return 'bg-[#FBCFE8] text-[#9D174D]'
    if (key === 'more_labels') return 'bg-white/80 text-[#0C4A6E]'
    return 'bg-[#E0F2FE] text-[#0C4A6E]'
  }

  function getOceanServiceLabelItems(item: any): Array<{ key: string; label: string }> {
    const labels = getServiceLabelItems(item)
    if (labels.length <= 2) return labels
    return [...labels.slice(0, 2), { key: 'more_labels', label: `+${labels.length - 2}` }]
  }

  return {
    getServiceLabelItems,
    getBadgeClasses,
    getOceanBadgeClasses,
    getOceanServiceLabelItems,
  }
}
