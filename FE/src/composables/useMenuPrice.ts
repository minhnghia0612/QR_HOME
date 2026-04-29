import { type ComputedRef } from 'vue'
import { useI18n } from 'vue-i18n'

/**
 * useMenuPrice
 * Handles all currency/price formatting for the customer menu.
 * Extracted from MenuPage.vue to keep formatting logic centralized.
 */
export function useMenuPrice(currencyUnit: ComputedRef<'VND' | 'USD' | 'EUR'>) {
  const { locale } = useI18n({ useScope: 'global' })

  function formatNumber(price: number): string {
    const numberLocale =
      locale.value === 'vi' ? 'vi-VN' : locale.value === 'de' ? 'de-DE' : 'en-US'
    return new Intl.NumberFormat(numberLocale).format(price)
  }

  function formatCurrencySingle(value: number): string {
    if (currencyUnit.value === 'USD') return `$${formatNumber(value)}`
    if (currencyUnit.value === 'EUR') return `€${formatNumber(value)}`
    return `${formatNumber(value)} VND`
  }

  function formatCurrencyRange(from: number, to: number): string {
    if (currencyUnit.value === 'USD') return `$${formatNumber(from)} - $${formatNumber(to)}`
    if (currencyUnit.value === 'EUR') return `€${formatNumber(from)} - €${formatNumber(to)}`
    return `${formatNumber(from)} - ${formatNumber(to)} VND`
  }

  function parseOptionalNumber(value: unknown): number | undefined {
    const parsed = Number(value)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
  }

  function getServiceDisplayPrice(service: any): string {
    if (
      service?.hasVariants &&
      Array.isArray(service?.variantOptions) &&
      service.variantOptions.length
    ) {
      const prices = service.variantOptions
        .map((opt: any) => Number(opt?.price))
        .filter((p: number) => Number.isFinite(p) && p > 0)

      if (prices.length) {
        const min = Math.min(...prices)
        const max = Math.max(...prices)
        if (min !== max) return formatCurrencyRange(min, max)
        return formatCurrencySingle(min)
      }
    }

    const from = parseOptionalNumber(service?.priceFrom)
    const to = parseOptionalNumber(service?.priceTo)

    if (from !== undefined && to !== undefined) return formatCurrencyRange(from, to)
    if (from !== undefined) return formatCurrencySingle(from)
    if (to !== undefined) return formatCurrencySingle(to)

    const singlePrice = Number(service?.price)
    if (Number.isFinite(singlePrice) && singlePrice > 0) return formatCurrencySingle(singlePrice)
    return ''
  }

  return {
    formatNumber,
    formatCurrencySingle,
    formatCurrencyRange,
    getServiceDisplayPrice,
  }
}
