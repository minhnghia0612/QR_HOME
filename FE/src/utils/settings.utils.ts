export function getApiErrorMessage(err: any, fallback: string): string {
  const raw = err?.response?.data?.message
  if (Array.isArray(raw)) {
    const normalized = raw.map((item) => String(item || '').trim()).filter(Boolean)
    return normalized[0] || fallback
  }
  if (typeof raw === 'string' && raw.trim()) return raw
  if (typeof err?.message === 'string' && err.message.trim()) return err.message
  return fallback
}

export function normalizeText(value: string) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizeEmail(value: string) {
  return String(value || '').trim().toLowerCase()
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function isValidPhone(value: string) {
  // 0987654321 hoặc 098 765 4321
  const phoneRegex = /^(0\d{9}|0\d{2}\s\d{3}\s\d{4})$/
  return phoneRegex.test(value)
}
