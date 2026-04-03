import { QueryClient } from '@tanstack/vue-query'
import { persistQueryClient } from '@tanstack/query-persist-client-core'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'

const QUERY_CACHE_KEY = 'qr-home-query-cache-v1'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      retry: 1,
    },
  },
})

export function setupQueryPersistence() {
  if (typeof window === 'undefined') return

  const persister = createSyncStoragePersister({
    storage: window.localStorage,
    key: QUERY_CACHE_KEY,
  })

  persistQueryClient({
    queryClient,
    persister,
    maxAge: 24 * 60 * 60 * 1000,
    dehydrateOptions: {
      shouldDehydrateQuery: (query) => query.state.status === 'success',
    },
  })
}
