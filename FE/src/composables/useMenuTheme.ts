import { computed, type ComputedRef } from 'vue'
import { type AdminPreviewPayload } from '@/lib/admin-preview-session'

const MENU_FONT_STACK_MAP: Record<string, string> = {
  Inter: "'Inter', sans-serif",
  Montserrat: "'Montserrat', sans-serif",
  'Dancing Script': "'Dancing Script', cursive",
  Pacifico: "'Pacifico', cursive",
}

const LEGACY_THEME_IDS = new Set(['classic', 'rustic', 'stitch'])

/**
 * useMenuTheme
 * Derives theme identity flags, CSS custom properties, font & size settings
 * from spaConfig + admin preview session overrides.
 */
export function useMenuTheme(
  spaConfig: ComputedRef<any>,
  isAdminPreview: ComputedRef<boolean>,
  getPreviewValue: <T extends string>(key: keyof AdminPreviewPayload, fallback: T) => string | T,
) {
  // ─── Theme ID ───────────────────────────────────────────────────────────────
  const themeId = computed(() =>
    String(getPreviewValue('themeId', spaConfig.value?.themeId || 'classic')),
  )

  // ─── Theme identity flags ────────────────────────────────────────────────────
  const isLegacyTheme = computed(() => LEGACY_THEME_IDS.has(String(themeId.value)))
  const isStitchTheme = computed(() => String(themeId.value) === 'stitch')
  const isDarkEleganceTheme = computed(() => String(themeId.value) === 'dark-elegance')
  const isModernMinimalTheme = computed(() => String(themeId.value) === 'modern-minimal')
  const isNatureTheme = computed(() => String(themeId.value) === 'nature')
  const isRoseTheme = computed(() => String(themeId.value) === 'rose')
  const isVibrantTheme = computed(() => String(themeId.value) === 'vibrant')
  const isOceanTheme = computed(() => String(themeId.value) === 'ocean')
  const isNeonTheme = computed(() => String(themeId.value) === 'neon')

  // ─── Currency ───────────────────────────────────────────────────────────────
  const currencyUnit = computed<'VND' | 'USD' | 'EUR'>(() => {
    const unit = String(
      getPreviewValue(
        'currencyUnit',
        spaConfig.value?.currencyUnit || spaConfig.value?.currency || 'VND',
      ),
    ).toUpperCase()
    if (unit === 'USD' || unit === 'DOLLAR') return 'USD'
    if (unit === 'EUR' || unit === 'EURO') return 'EUR'
    return 'VND'
  })

  // ─── UI Size ────────────────────────────────────────────────────────────────
  const menuSize = computed<'large' | 'normal' | 'compact'>(() => {
    const size = String(
      getPreviewValue('customerUiSize', spaConfig.value?.customerUiSize || 'normal'),
    ).toLowerCase()
    if (size === 'large' || size === 'compact') return size
    return 'normal'
  })

  // ─── Font ───────────────────────────────────────────────────────────────────
  const menuFontFamily = computed(() =>
    String(getPreviewValue('fontFamily', spaConfig.value?.fontFamily || 'Inter')),
  )

  const resolvedMenuFontFamily = computed(() => {
    const selected = menuFontFamily.value
    return MENU_FONT_STACK_MAP[selected] || MENU_FONT_STACK_MAP.Inter
  })

  // ─── Hex → RGBA helper ──────────────────────────────────────────────────────
  function hexToRgba(hexColor: string, alpha: number): string {
    const hex = String(hexColor || '').replace('#', '').trim()
    const normalized =
      hex.length === 3
        ? `${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`
        : hex
    if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return `rgba(2, 83, 205, ${alpha})`
    const r = parseInt(normalized.slice(0, 2), 16)
    const g = parseInt(normalized.slice(2, 4), 16)
    const b = parseInt(normalized.slice(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  // ─── CSS custom properties object ───────────────────────────────────────────
  const customerInterfaceStyle = computed<Record<string, string>>(() => {
    const primary = String(
      getPreviewValue('primaryColor', spaConfig.value?.primaryColor || '#0253CD'),
    )
    const secondary = String(
      getPreviewValue('secondaryColor', spaConfig.value?.secondaryColor || '#5E0B61'),
    )
    const secondarySoft = hexToRgba(secondary, 0.12)
    const secondaryMuted = hexToRgba(secondary, 0.75)
    const family = resolvedMenuFontFamily.value

    const style: Record<string, string> = {
      '--color-primary-600': primary,
      '--color-primary-500': primary,
      '--color-primary-400': primary,
      '--color-primary-100': hexToRgba(primary, 0.15),
      '--color-text-secondary': secondary,
      '--color-text-muted': secondaryMuted,
      '--color-surface-secondary': secondarySoft,
      '--color-badge-new-bg': hexToRgba(primary, 0.2),
      '--color-badge-new-text': primary,
      '--color-badge-bestseller-bg': hexToRgba(secondary, 0.2),
      '--color-badge-bestseller-text': secondary,
      '--menu-font-family': family,
    }

    // Pacifico only has weight 400 — prevent synthetic bold rendering issues
    style['--menu-title-weight'] = menuFontFamily.value === 'Pacifico' ? '400' : 'inherit'

    return style
  })

  return {
    themeId,
    isLegacyTheme,
    isStitchTheme,
    isDarkEleganceTheme,
    isModernMinimalTheme,
    isNatureTheme,
    isRoseTheme,
    isVibrantTheme,
    isOceanTheme,
    isNeonTheme,
    currencyUnit,
    menuSize,
    menuFontFamily,
    resolvedMenuFontFamily,
    hexToRgba,
    customerInterfaceStyle,
  }
}
