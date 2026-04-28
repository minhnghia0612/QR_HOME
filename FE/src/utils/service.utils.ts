export const LABEL_STYLE_MAP: Record<string, { badge: string; chip: string }> = {
  best_seller: { badge: 'bg-primary-100 text-primary-700', chip: 'bg-primary-100 text-primary-700 ring-2 ring-primary-300' },
  new_service: { badge: 'bg-primary-100 text-primary-700', chip: 'bg-primary-100 text-primary-700 ring-2 ring-primary-300' },
  must_try: { badge: 'bg-primary-100 text-primary-700', chip: 'bg-primary-100 text-primary-700 ring-2 ring-primary-300' },
  limited_edition: { badge: 'bg-primary-100 text-primary-700', chip: 'bg-primary-100 text-primary-700 ring-2 ring-primary-300' },
  summer_special: { badge: 'bg-primary-100 text-primary-700', chip: 'bg-primary-100 text-primary-700 ring-2 ring-primary-300' },
  happy_hour: { badge: 'bg-primary-100 text-primary-700', chip: 'bg-primary-100 text-primary-700 ring-2 ring-primary-300' },
}

export function formatTagLabel(tag: string) {
  return tag.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

export function getLabelBadgeClass(value: string) {
  return LABEL_STYLE_MAP[value]?.badge || 'bg-primary-100 text-primary-700'
}

export function parseOptionalNumber(value: string | number | null | undefined): number | undefined {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return undefined
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function formatPrice(p: number, currencyUnit: string) {
  const value = Number(p || 0)
  const locale = currencyUnit === 'VND' ? 'vi-VN' : 'en-US'
  const formatted = new Intl.NumberFormat(locale).format(value)
  if (currencyUnit === 'USD') return `$${formatted}`
  if (currencyUnit === 'EUR') return `€${formatted}`
  return `${formatted} VND`
}

export function formatPriceRange(from: number, to: number, currencyUnit: string) {
  if (currencyUnit === 'USD') return `$${new Intl.NumberFormat('en-US').format(from)} - $${new Intl.NumberFormat('en-US').format(to)}`
  if (currencyUnit === 'EUR') return `€${new Intl.NumberFormat('en-US').format(from)} - €${new Intl.NumberFormat('en-US').format(to)}`
  return `${new Intl.NumberFormat('vi-VN').format(from)} - ${new Intl.NumberFormat('vi-VN').format(to)} VND`
}

export function getServiceDisplayPrice(svc: any) {
  const curr = svc?.currency || 'VND'
  
  if (svc?.hasVariants && Array.isArray(svc?.variantOptions) && svc.variantOptions.length) {
    const prices = svc.variantOptions
      .map((opt: any) => Number(opt?.price))
      .filter((p: number) => Number.isFinite(p) && p > 0)

    if (prices.length) {
      const min = Math.min(...prices)
      const max = Math.max(...prices)
      if (min !== max) return formatPriceRange(min, max, curr)
      return formatPrice(min, curr)
    }
  }

  const from = parseOptionalNumber(svc?.priceFrom)
  const to = parseOptionalNumber(svc?.priceTo)

  if (from !== undefined && to !== undefined) return formatPriceRange(from, to, curr)
  if (from !== undefined) return formatPrice(from, curr)
  if (to !== undefined) return formatPrice(to, curr)

  return formatPrice(Number(svc?.price || 0), curr)
}

export function getServiceLabelItems(svc: any, getServiceSpecialTags: Function, t: Function) {
  const labels: Array<{ key: string; label: string }> = []
  if (svc?.isBestSeller) labels.push({ key: 'best_seller', label: t('menu.badges.best_seller') })
  if (svc?.isNewService) labels.push({ key: 'new_service', label: t('menu.badges.new_service') })
  const tags = getServiceSpecialTags(svc)
  if (tags.length > 0) {
    tags.forEach((tag: string) => {
      const normalizedTag = String(tag || '').trim()
      if (normalizedTag) labels.push({ key: normalizedTag, label: formatTagLabel(normalizedTag) })
    })
  }
  const seen = new Set<string>()
  return labels.filter((item) => {
    if (seen.has(item.key)) return false
    seen.add(item.key)
    return true
  })
}
