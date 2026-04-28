<script setup lang="ts">
import { computed, watch } from 'vue'
import { useStoreManager } from '@/stores/store-manager.store'
import { useI18n } from 'vue-i18n'
import Toast from '@/components/Toast.vue'

// Composables
import { useServiceFilters } from '@/composables/useServiceFilters'
import { useServicesData } from '@/composables/useServicesData'
import { useServiceForm } from '@/composables/useServiceForm'
import { useDashboardTraffic } from '@/composables/useDashboardTraffic'
import { LABEL_STYLE_MAP, formatTagLabel } from '@/utils/service.utils'

// Child Components
import ServiceHeader from './services/components/ServiceHeader.vue'
import ServiceStatsRow from './services/components/ServiceStatsRow.vue'
import ServiceFilters from './services/components/ServiceFilters.vue'
import ServiceGrid from './services/components/ServiceGrid.vue'
import ServicePagination from './services/components/ServicePagination.vue'
import ServiceFormDialog from './services/components/ServiceFormDialog.vue'
import ServiceConflictDialog from './services/components/ServiceConflictDialog.vue'

const { t } = useI18n({ useScope: 'global' })
const storeManager = useStoreManager()

const PAGE_SIZE = 20

// 1. Filters State
const {
  searchInput,
  searchQuery,
  selectedStatus,
  selectedCategory,
  selectedSort,
  openFilter,
  page,
  toggleFilter,
  setStatusFilter,
  setCategoryFilter,
  setSortFilter,
} = useServiceFilters(PAGE_SIZE)

// 2. Data Fetching
const {
  servicesView,
  loadingServices,
  categories,
  loadingCategories,
  deleteService,
  toggleStatus,
} = useServicesData(searchQuery, selectedStatus, selectedCategory, selectedSort, page, PAGE_SIZE)

// 3. Form State & Actions
import { ref } from 'vue'
const toast = ref({ show: false, message: '', type: 'success' as 'success' | 'danger' | 'warning' })
function showToast(msg: string, type: 'success' | 'danger' | 'warning' = 'success') {
  toast.value = { show: true, message: msg, type }
  setTimeout(() => { toast.value.show = false }, 3000)
}

const formHandlers = useServiceForm(showToast, page, selectedSort)

// 4. Dashboard Traffic (Socket)
const { dashboard, loadingDashboard } = useDashboardTraffic()

const pageLoading = computed(() => loadingServices.value && !servicesView.value.items.length)
const totalServices = computed(() => servicesView.value.total)
const todayViews = computed(() => dashboard.value?.growth?.todayViews || dashboard.value?.todayTotalViews || 0)

const formattedGrowth = computed(() => {
  const g = dashboard.value?.growth?.growthPercent || 0
  const isPos = g >= 0
  const val = Math.abs(g).toFixed(1)
  return {
    text: `${isPos ? '+' : '-'}${val}%`,
    class: isPos ? 'text-success' : 'text-danger'
  }
})

const growthTone = computed(() => {
  const isPos = (dashboard.value?.growth?.growthPercent || 0) >= 0
  return {
    bg: isPos ? 'bg-success/10' : 'bg-danger/10',
    icon: isPos ? 'text-success' : 'text-danger'
  }
})

const previewUrl = computed(() => {
  if (!storeManager.currentStoreId) return '#'
  return `/menu/${storeManager.currentStoreId}`
})

// Pagination logic
const displayedPages = computed(() => {
  const total = servicesView.value.totalPages
  const current = page.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total]
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '...', current - 1, current, current + 1, '...', total]
})

function getLocaleCategoryName(cat: any) {
  // Try to use app's language matching logic if available.
  // For simplicity here, fallback to cat.name
  return cat.name || ''
}

// Special labels logic
const dynamicFormLabelOptions = computed(() => {
  const base = [
    { value: 'best_seller', label: t('menu.badges.best_seller') },
    { value: 'new_service', label: t('menu.badges.new_service') },
    { value: 'must_try', label: t('menu.badges.must_try') },
    { value: 'limited_edition', label: t('menu.badges.limited_edition') },
    { value: 'summer_special', label: t('menu.badges.summer_special') },
    { value: 'happy_hour', label: t('menu.badges.happy_hour') }
  ]
  const existingValues = new Set(base.map(x => x.value))
  
  formHandlers.activeLocaleSpecialTags.value.forEach((tag: string) => {
    if (!existingValues.has(tag)) {
      base.push({ value: tag, label: formatTagLabel(tag) })
      existingValues.add(tag)
    }
  })
  return base
})

function getLabelChipClass(val: string) {
  const isSelected = formHandlers.activeLocaleSpecialTags.value.includes(val) || 
                     (val === 'best_seller' && formHandlers.form.value.isBestSeller) ||
                     (val === 'new_service' && formHandlers.form.value.isNewService)
                     
  if (isSelected) return LABEL_STYLE_MAP[val]?.chip || 'bg-primary-100 text-primary-700 ring-2 ring-primary-300'
  return 'bg-surface-input text-text-muted hover:bg-border'
}

function handleAddLabel() {
  const val = formHandlers.newLabelInput.value.trim()
  if (!val) {
    formHandlers.newLabelError.value = t('admin.serviceManager.errors.emptyLabel')
    return
  }
  const formatted = val.toLowerCase().replace(/\s+/g, '_')
  
  const tags = [...formHandlers.activeLocaleSpecialTags.value]
  if (tags.includes(formatted)) {
    formHandlers.newLabelError.value = t('admin.serviceManager.errors.duplicateLabel')
    return
  }
  
  if (formatted === 'best_seller' || formatted === 'new_service') {
    handleToggleLabel(formatted)
  } else {
    tags.push(formatted)
    formHandlers.activeLocaleSpecialTags.value = tags
  }
  
  formHandlers.newLabelInput.value = ''
  formHandlers.newLabelError.value = ''
}

function handleToggleLabel(val: string) {
  if (val === 'best_seller') {
    formHandlers.form.value.isBestSeller = !formHandlers.form.value.isBestSeller
    return
  }
  if (val === 'new_service') {
    formHandlers.form.value.isNewService = !formHandlers.form.value.isNewService
    return
  }

  const tags = [...formHandlers.activeLocaleSpecialTags.value]
  const idx = tags.indexOf(val)
  if (idx !== -1) {
    tags.splice(idx, 1)
  } else {
    tags.push(val)
  }
  formHandlers.activeLocaleSpecialTags.value = tags
}
</script>

<template>
  <div class="min-h-screen bg-[#F8FAFC] px-4 py-8 sm:px-6 lg:px-8" @click="openFilter = null">
    <div class="mx-auto max-w-7xl">
      <!-- Header -->
      <ServiceHeader :preview-url="previewUrl" @open-create="formHandlers.openCreate" />

      <!-- Stats Row -->
      <ServiceStatsRow
        :page-loading="pageLoading"
        :total-services="totalServices"
        :today-views="todayViews"
        :formatted-growth="formattedGrowth"
        :growth-tone="growthTone"
      />

      <!-- Main Content -->
      <div class="rounded-[32px] bg-white p-6 shadow-card sm:p-8">
        <!-- Filters -->
        <ServiceFilters
          v-model:search-input="searchInput"
          v-model:selected-status="selectedStatus"
          v-model:selected-category="selectedCategory"
          v-model:selected-sort="selectedSort"
          :categories="categories"
          :get-locale-category-name="getLocaleCategoryName"
          :open-filter="openFilter"
          @toggle-filter="toggleFilter"
          @set-status="setStatusFilter"
          @set-category="setCategoryFilter"
          @set-sort="setSortFilter"
        />

        <!-- List -->
        <ServiceGrid
          :services="servicesView.items"
          :loading="pageLoading"
          @toggle-status="toggleStatus"
          @open-edit="formHandlers.openEdit"
          @delete="deleteService"
        />

        <!-- Pagination -->
        <ServicePagination
          v-model:page="page"
          :total-pages="servicesView.totalPages"
          :displayed-pages="displayedPages"
        />
      </div>
    </div>

    <!-- Form Dialog -->
    <ServiceFormDialog
      :show="formHandlers.showForm.value"
      :form="formHandlers.form.value"
      :editing-service="formHandlers.editingService.value"
      :form-loading="formHandlers.formLoading.value"
      :saving="formHandlers.saving.value"
      :upload-loading="formHandlers.uploadLoading.value"
      :is-dragging-image="formHandlers.isDraggingImage.value"
      :form-error="formHandlers.formError.value"
      :field-errors="formHandlers.fieldErrors.value"
      :categories="categories"
      :get-locale-category-name="getLocaleCategoryName"
      :has-locale-content="formHandlers.hasLocaleContent"
      :form-label-options="dynamicFormLabelOptions"
      :get-label-chip-class="getLabelChipClass"
      :get-variant-name="formHandlers.getVariantName"
      v-model:form-locale-lang="formHandlers.formLocaleLang.value"
      v-model:active-locale-name="formHandlers.activeLocaleName.value"
      v-model:active-locale-short-desc="formHandlers.activeLocaleShortDesc.value"
      v-model:active-locale-description="formHandlers.activeLocaleDescription.value"
      v-model:price-from-input="formHandlers.priceFromInput.value"
      v-model:price-to-input="formHandlers.priceToInput.value"
      v-model:new-label-input="formHandlers.newLabelInput.value"
      v-model:new-label-error="formHandlers.newLabelError.value"
      @close="formHandlers.resetForm"
      @save="formHandlers.saveService"
      @upload="formHandlers.handleUpload"
      @drop="formHandlers.handleDrop"
      @dragover="formHandlers.isDraggingImage.value = true"
      @dragleave="formHandlers.isDraggingImage.value = false"
      @add-label="handleAddLabel"
      @toggle-label="handleToggleLabel"
      @add-variant="formHandlers.addVariantOption"
      @remove-variant="formHandlers.removeVariantOption"
      @set-variant-name="formHandlers.setVariantName"
    />

    <!-- Conflict Dialog -->
    <ServiceConflictDialog
      :show="formHandlers.showConflictDialog.value"
      :service-name="formHandlers.form.value.name"
      @yes="formHandlers.handleConflictYes"
      @no="formHandlers.handleConflictNo"
    />

    <Toast
      :show="toast.show"
      :message="toast.message"
      :type="toast.type"
      @close="toast.show = false"
    />
  </div>
</template>
