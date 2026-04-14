import { createI18n } from 'vue-i18n'
import en from './locales/en'
import vi from './locales/vi'
import de from './locales/de'

export const SUPPORTED_LOCALES = ['en', 'vi', 'de'] as const
export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

const DEFAULT_LOCALE: AppLocale = 'en'
const LOCALE_STORAGE_KEY = 'qr-home-locale'

const messages = {
  en,
  vi,
  de,
}

function resolveInitialLocale(): AppLocale {
  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY)
    if (stored && SUPPORTED_LOCALES.includes(stored as AppLocale)) {
      return stored as AppLocale
    }

    const browserLocale = window.navigator.language.split('-')[0] as AppLocale
    if (SUPPORTED_LOCALES.includes(browserLocale)) {
      return browserLocale
    }
  }

  return DEFAULT_LOCALE
}

const i18n = createI18n({
  legacy: false,
  locale: resolveInitialLocale(),
  fallbackLocale: DEFAULT_LOCALE,
  messages,
})

export function setLocale(locale: AppLocale) {
  i18n.global.locale.value = locale

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
    document.documentElement.lang = locale
  }
}

// Ensure the locale is synchronized with the initial value
if (typeof window !== 'undefined') {
  setLocale(i18n.global.locale.value as AppLocale)
}

export default i18n
