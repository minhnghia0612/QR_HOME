const AUTH_TOKEN_KEY = 'qr_home_token'
const QUERY_CACHE_KEY = 'qr-home-query-cache-v1'
const PREVIEW_SESSION_PREFIX = 'qr_home_admin_preview_v1:'

function removeByPrefix(storage: Storage, prefix: string) {
  for (let i = storage.length - 1; i >= 0; i -= 1) {
    const key = storage.key(i)
    if (key?.startsWith(prefix)) {
      storage.removeItem(key)
    }
  }
}

export function clearAuthBrowserState() {
  if (typeof window === 'undefined') return

  window.localStorage.removeItem(AUTH_TOKEN_KEY)
  window.localStorage.removeItem(QUERY_CACHE_KEY)
  window.localStorage.removeItem('qr_home_store_id')

  removeByPrefix(window.sessionStorage, PREVIEW_SESSION_PREFIX)
}
