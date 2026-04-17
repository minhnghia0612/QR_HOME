<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { useRouter } from 'vue-router'
import { servicesApi } from '@/api/services.api'
import { categoriesApi } from '@/api/categories.api'
import type { ServiceQuery } from '@/types/service.types'
import { formatPrice } from '@/lib/utils'
import { Plus, Search, Pencil, Trash2, Image, ArrowRight } from 'lucide-vue-next'

import { useStoreManager } from '@/stores/store-manager.store'

const storeManager = useStoreManager()
const router = useRouter()
const queryClient = useQueryClient()
const { t } = useI18n({ useScope: 'global' })

const search = ref('')
const categoryFilter = ref('')
const statusFilter = ref<string>('')
const page = ref(1)

const queryParams = computed<ServiceQuery>(() => ({
  page: page.value,
  limit: 15,
  ...(search.value ? { search: search.value } : {}),
  ...(categoryFilter.value ? { categoryId: categoryFilter.value } : {}),
  ...(statusFilter.value !== '' ? { isActive: statusFilter.value === 'active' } : {}),
}))

const { data: servicesData, isLoading } = useQuery({
  queryKey: ['services', computed(() => storeManager.currentStoreId), queryParams],
  queryFn: async () => {
    const { data } = await servicesApi.getAll(queryParams.value)
    return data.data
  },
})

const { data: categories } = useQuery({
  queryKey: ['categories', computed(() => storeManager.currentStoreId)],
  queryFn: async () => {
    const { data } = await categoriesApi.getAll()
    return data.data
  },
})

const deleteMutation = useMutation({
  mutationFn: (id: string) => servicesApi.delete(id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['services'] })
  },
})

function confirmDelete(id: string) {
  if (confirm(t('admin.services.confirmDelete'))) {
    deleteMutation.mutate(id)
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-2xl font-bold text-navy-900">{{ t('admin.services.title') }}</h2>
        <p class="text-sm text-text-muted">{{ t('admin.services.subtitle') }}</p>
      </div>
      <button
        class="flex items-center gap-2 rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-medium text-white shadow-card transition-all hover:bg-navy-800"
        @click="router.push('/admin/services/new')"
      >
        <Plus class="h-4 w-4" />
        {{ t('admin.services.addService') }}
      </button>
    </div>

    <!-- Filters -->
    <div class="flex flex-col gap-3 sm:flex-row">
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          v-model="search"
          type="text"
          :placeholder="t('admin.services.searchPlaceholder')"
          class="w-full rounded-xl border border-border bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-azure-400 focus:ring-2 focus:ring-azure-100"
        />
      </div>
      <select
        v-model="categoryFilter"
        class="rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-azure-400"
      >
        <option value="">{{ t('admin.services.allCategories') }}</option>
        <option v-for="cat in categories" :key="cat.id" :value="cat.id">
          {{ cat.name }}
        </option>
      </select>
      <select
        v-model="statusFilter"
        class="rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-azure-400"
      >
        <option value="">{{ t('admin.services.allStatus') }}</option>
        <option value="active">{{ t('admin.common.active') }}</option>
        <option value="inactive">{{ t('admin.common.inactive') }}</option>
      </select>
    </div>

    <!-- Table -->
    <div class="overflow-hidden overflow-x-auto rounded-xl border border-border bg-white shadow-card">
      <div v-if="isLoading" class="flex h-48 items-center justify-center text-text-muted">
        {{ t('admin.services.loading') }}
      </div>
      <table v-else class="w-full min-w-[700px] text-left text-sm">
        <thead class="border-b border-border bg-surface-dim">
          <tr>
            <th class="px-4 py-3 font-medium text-text-muted">{{ t('admin.services.columns.image') }}</th>
            <th class="px-4 py-3 font-medium text-text-muted">{{ t('admin.services.columns.name') }}</th>
            <th class="px-4 py-3 font-medium text-text-muted">{{ t('admin.services.columns.category') }}</th>
            <th class="px-4 py-3 font-medium text-text-muted">{{ t('admin.services.columns.price') }}</th>
            <th class="px-4 py-3 font-medium text-text-muted">{{ t('admin.services.columns.labels') }}</th>
            <th class="px-4 py-3 font-medium text-text-muted">{{ t('admin.services.columns.status') }}</th>
            <th class="px-4 py-3 text-right font-medium text-text-muted">{{ t('admin.services.columns.actions') }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          <tr
            v-for="svc in servicesData?.items"
            :key="svc.id"
            class="transition-colors hover:bg-surface-dim"
          >
            <td class="px-4 py-3">
              <div class="h-12 w-12 overflow-hidden rounded-lg bg-navy-50">
                <img
                  v-if="svc.imageUrl"
                  :src="svc.imageUrl"
                  :alt="svc.name"
                  class="h-full w-full object-cover"
                />
                <div v-else class="flex h-full w-full items-center justify-center">
                  <Image class="h-5 w-5 text-navy-300" />
                </div>
              </div>
            </td>
            <td class="px-4 py-3">
              <p class="font-medium text-navy-900">{{ svc.name }}</p>
              <p class="line-clamp-1 text-xs text-text-muted">{{ svc.description }}</p>
            </td>
            <td class="px-4 py-3 text-navy-600">
              {{ svc.category?.name || '—' }}
            </td>
            <td class="px-4 py-3 font-medium text-navy-900">
              {{ formatPrice(svc.price, svc.currency) }}
            </td>
            <td class="px-4 py-3">
              <div class="flex flex-wrap gap-1">
                <span
                  v-if="svc.isBestSeller"
                  class="rounded-full bg-gold-100 px-2 py-0.5 text-xs font-medium text-gold-700"
                >
                  {{ t('menu.badges.best_seller') }}
                </span>
                <span
                  v-if="svc.isNewService"
                  class="rounded-full bg-azure-100 px-2 py-0.5 text-xs font-medium text-azure-700"
                >
                  {{ t('menu.badges.new_service') }}
                </span>
                <span
                  v-if="svc.isCombo"
                  class="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700"
                >
                  Combo
                </span>
              </div>
            </td>
            <td class="px-4 py-3">
              <span
                :class="[
                  'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                  svc.isActive
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700',
                ]"
              >
                {{ svc.isActive ? t('admin.common.active') : t('admin.common.inactive') }}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex justify-end gap-1">
                <button
                  class="rounded-lg p-1.5 text-text-muted hover:bg-azure-50 hover:text-azure-600"
                  @click="router.push(`/admin/services/${svc.id}/edit`)"
                >
                  <Pencil class="h-4 w-4" />
                </button>
                <button
                  class="rounded-lg p-1.5 text-text-muted hover:bg-red-50 hover:text-red-600"
                  @click="confirmDelete(svc.id)"
                >
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!servicesData?.items?.length">
            <td colspan="7" class="px-4 py-12 text-center text-text-muted">
              {{ t('admin.services.empty') }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div
      v-if="servicesData && servicesData.totalPages > 1"
      class="flex items-center justify-between text-sm"
    >
      <p class="text-text-muted">
        Showing {{ (servicesData.page - 1) * servicesData.limit + 1 }} to
        {{ Math.min(servicesData.page * servicesData.limit, servicesData.total) }} of
        {{ servicesData.total }}
      </p>
      <div class="flex gap-2">
        <button
          :disabled="page <= 1"
          class="rounded-lg border border-border px-3 py-1.5 hover:bg-navy-50 disabled:opacity-50"
          @click="page--"
        >
          {{ t('admin.services.previous') }}
        </button>
        <button
          :disabled="page >= servicesData.totalPages"
          class="rounded-lg border border-border px-3 py-1.5 hover:bg-navy-50 disabled:opacity-50"
          @click="page++"
        >
          {{ t('admin.services.next') }}
        </button>
      </div>
    </div>
    <!-- Next Step Button (Onboarding) -->
    <div v-if="servicesData?.items?.length" class="mt-12 flex justify-end">
      <button
        @click="router.push('/admin/dashboard')"
        class="flex items-center gap-3 rounded-2xl bg-[#0048B5] px-10 py-5 text-base font-black text-white shadow-button transition-all hover:brightness-110 active:scale-95"
      >
        {{ t('admin.services.finishSetup') }}
        <ArrowRight class="h-5 w-5" />
      </button>
    </div>
  </div>
</template>
