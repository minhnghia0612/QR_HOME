export type AdminPreviewPayload = {
  themeId: string
  currencyUnit: string
  primaryColor: string
  secondaryColor: string
  fontFamily: string
  customerUiSize: string
}

type StoredAdminPreviewPayload = {
  adminId: string
  updatedAt: number
  expiresAt: number
  payload: AdminPreviewPayload
}

const STORAGE_KEY_PREFIX = 'qr_home_admin_preview_v1:'
const DEFAULT_TTL_MS = 6 * 60 * 60 * 1000

function getStorageKey(adminId: string) {
  return `${STORAGE_KEY_PREFIX}${adminId}`
}

export function setAdminPreviewSession(
  adminId: string,
  payload: AdminPreviewPayload,
  ttlMs: number = DEFAULT_TTL_MS,
) {
  if (typeof window === 'undefined' || !adminId) return

  const now = Date.now()
  const data: StoredAdminPreviewPayload = {
    adminId,
    updatedAt: now,
    expiresAt: now + ttlMs,
    payload,
  }

  window.sessionStorage.setItem(getStorageKey(adminId), JSON.stringify(data))
}

export function getAdminPreviewSession(adminId: string): AdminPreviewPayload | null {
  if (typeof window === 'undefined' || !adminId) return null

  const raw = window.sessionStorage.getItem(getStorageKey(adminId))
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as StoredAdminPreviewPayload
    if (!parsed?.payload || parsed.adminId !== adminId) {
      window.sessionStorage.removeItem(getStorageKey(adminId))
      return null
    }

    if (!parsed.expiresAt || parsed.expiresAt < Date.now()) {
      window.sessionStorage.removeItem(getStorageKey(adminId))
      return null
    }

    return parsed.payload
  } catch {
    window.sessionStorage.removeItem(getStorageKey(adminId))
    return null
  }
}
