import { defineStore } from 'pinia'
import { storesApi } from '@/api/stores.api'

interface StoreInfo {
  id: string;
  name: string;
  adminId: string;
  createdAt: string;
  updatedAt: string;
}

export const useStoreManager = defineStore('store-manager', {
  state: () => ({
    stores: [] as StoreInfo[],
    currentStoreId: localStorage.getItem('qr_home_store_id') || null as string | null,
    isLoading: false,
  }),
  
  getters: {
    currentStore: (state) => state.stores.find((s) => s.id === state.currentStoreId) || state.stores[0] || null,
  },

  actions: {
    async fetchStores() {
      try {
        this.isLoading = true
        const res = await storesApi.getAll()
        const data = res.data
        this.stores = Array.isArray(data) ? data : (data?.data || [])
        
        // Auto-select first store if nothing selected or selection is stale
        if (this.stores.length > 0) {
          const valid = this.stores.some((s) => s.id === this.currentStoreId)
          if (!valid) {
            this._setCurrentStore(this.stores[0].id)
          }
        }
      } catch (err) {
        console.error('Failed to fetch stores', err)
      } finally {
        this.isLoading = false
      }
    },

    /** Switch store and refresh the current page data via queryClient invalidation */
    setCurrentStore(storeId: string, queryClient?: any) {
      this._setCurrentStore(storeId)
      if (queryClient) {
        queryClient.invalidateQueries()
      } else {
        window.location.reload()
      }
    },

    /** Internal: persist without triggering a refresh */
    _setCurrentStore(storeId: string) {
      this.currentStoreId = storeId
      localStorage.setItem('qr_home_store_id', storeId)
    },
    
    async createStore(name: string) {
      const res = await storesApi.create({ name })
      const newStore: StoreInfo = res.data?.data || res.data
      this.stores.push(newStore)
      return newStore
    },

    async updateStore(id: string, name: string) {
      const res = await storesApi.update(id, { name })
      const updated: StoreInfo = res.data?.data || res.data
      const idx = this.stores.findIndex((s) => s.id === id)
      if (idx !== -1) this.stores[idx] = updated
      return updated
    },

    async deleteStore(id: string) {
      await storesApi.delete(id)
      this.stores = this.stores.filter((s) => s.id !== id)
      if (this.currentStoreId === id && this.stores.length > 0) {
        this._setCurrentStore(this.stores[0].id)
        window.location.reload()
      }
    }
  }
})
