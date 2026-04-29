<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useServiceLocale } from '@/composables/useServiceLocale'
import { useMenuData } from '@/composables/useMenuData'
import { useMenuTheme } from '@/composables/useMenuTheme'
import { useMenuFilter } from '@/composables/useMenuFilter'
import { useMenuSlider } from '@/composables/useMenuSlider'
import { useMenuPrice } from '@/composables/useMenuPrice'
import { useMenuBadge } from '@/composables/useMenuBadge'
import { handleImgError } from '@/utils/image.utils'

// ── Theme Components ──────────────────────────────────────────────────────────
import MaintenanceState from './components/MaintenanceState.vue'
import MenuServiceDetail from './components/MenuServiceDetail.vue'
import ClassicTheme from './themes/classic/ClassicTheme.vue'
import StitchTheme from './themes/stitch/StitchTheme.vue'
import DarkEleganceTheme from './themes/dark-elegance/DarkEleganceTheme.vue'
import ModernMinimalTheme from './themes/modern-minimal/ModernMinimalTheme.vue'
import NatureTheme from './themes/nature/NatureTheme.vue'
import RoseTheme from './themes/rose/RoseTheme.vue'
import VibrantTheme from './themes/vibrant/VibrantTheme.vue'
import OceanTheme from './themes/ocean/OceanTheme.vue'
import NeonTheme from './themes/neon/NeonTheme.vue'

// ── Route ─────────────────────────────────────────────────────────────────────
const route = useRoute()
const targetId = computed(() => route.params.id as string)

// ── Data ──────────────────────────────────────────────────────────────────────
const {
  spaConfig,
  loadingConfig,
  resolvedStoreId,
  resolvedAdminId,
  isAdminPreview,
  hasPendingAdminSession,
  getPreviewValue,
  categories,
  loadingCats,
  allServices,
  loadingServices,
  newServices,
  articleSlides,
  isInitialLoading,
  logTraffic,
} = useMenuData(targetId)

// ── Theme ─────────────────────────────────────────────────────────────────────
const {
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
  customerInterfaceStyle,
} = useMenuTheme(spaConfig, isAdminPreview, getPreviewValue)

// ── Filter ────────────────────────────────────────────────────────────────────
const {
  searchQuery,
  selectedCategoryId,
  allTabAnchorRef,
  darkCategoryViewOpen,
  stitchCategoryViewOpen,
  roseCategoryViewOpen,
  filteredServices,
  groupedByCategory,
  modernMinimalColumns,
  oceanGroups,
  darkCategoryTiles,
  darkSelectedServices,
  openDarkCategory,
  closeDarkCategoryView,
  closeStitchCategoryView,
  toggleLegacyCategory,
  openRoseCategory,
  closeRoseCategoryView,
  switchToAllTab,
} = useMenuFilter(allServices, categories, {
  isStitchTheme,
  isDarkEleganceTheme,
  isVibrantTheme,
  isOceanTheme,
  isNeonTheme,
  isRoseTheme,
})

// ── Slider ────────────────────────────────────────────────────────────────────
const { currentSlideIndex, onSlideTouchStart, onSlideTouchEnd } = useMenuSlider(articleSlides)

// ── Price ─────────────────────────────────────────────────────────────────────
const { formatCurrencySingle, getServiceDisplayPrice } = useMenuPrice(currencyUnit)

// ── Badge ─────────────────────────────────────────────────────────────────────
const {
  getServiceLabelItems,
  getBadgeClasses,
  getOceanBadgeClasses,
  getOceanServiceLabelItems,
} = useMenuBadge()

// ── Locale helpers ────────────────────────────────────────────────────────────
const { getServiceName, getServiceDescription, getServiceShortDescription, getVariantName } =
  useServiceLocale()

// ── Service Detail ────────────────────────────────────────────────────────────
const selectedService = ref<any>(null)
const showDetail = ref(false)

function openDetail(service: any) {
  selectedService.value = service
  showDetail.value = true
  if (hasPendingAdminSession.value) return
  if (!isAdminPreview.value && resolvedAdminId.value && resolvedStoreId.value) {
    logTraffic({
      serviceId: service.id,
      adminId: resolvedAdminId.value,
      storeId: resolvedStoreId.value,
    })
  }
}

function closeDetail() {
  showDetail.value = false
  setTimeout(() => { selectedService.value = null }, 300)
}

// Sync selectedService when services refetch in background
watch(
  allServices,
  (services) => {
    if (!showDetail.value || !selectedService.value?.id) return
    const latest = services.find((svc: any) => svc.id === selectedService.value.id)
    if (latest) selectedService.value = latest
  },
  { deep: true },
)

// ── Helpers ───────────────────────────────────────────────────────────────────
// handleImgError imported from @/utils/image.utils

function getDetailVariantOptions(service: any) {
  if (!service?.hasVariants || !Array.isArray(service?.variantOptions)) return []
  return service.variantOptions
    .map((opt: any, index: number) => ({
      name: getVariantName(service, index),
      price: Number(opt?.price),
    }))
    .filter((opt: any) => opt.name && Number.isFinite(opt.price) && opt.price > 0)
}

// ── Shared props helper ───────────────────────────────────────────────────────
const sharedThemeProps = computed(() => ({
  spaConfig: spaConfig.value,
  categories: categories.value,
  articleSlides: articleSlides.value,
  newServices: newServices.value,
  filteredServices: filteredServices.value,
  groupedByCategory: groupedByCategory.value,
  selectedCategoryId: selectedCategoryId.value,
  currentSlideIndex: currentSlideIndex.value,
  loadingConfig: loadingConfig.value,
  loadingCats: loadingCats.value,
  loadingServices: loadingServices.value,
  searchQuery: searchQuery.value,
  getServiceName,
  getServiceShortDescription,
  getServiceDisplayPrice,
  getServiceLabelItems,
  getBadgeClasses,
}))
</script>

<template>
  <div
    :class="['min-h-screen flex justify-center items-start bg-surface-page', `theme-${themeId}`]"
    :style="customerInterfaceStyle"
  >
    <div
      :class="['menu-root w-full max-w-[800px] min-h-screen bg-surface-page relative', `theme-${themeId}`, `menu-size-${menuSize}`]"
      :style="customerInterfaceStyle"
    >
      <!-- Maintenance overlay -->
      <MaintenanceState
        v-if="!loadingConfig && spaConfig?.status !== 'active' && !isAdminPreview"
        :spa-name="spaConfig?.spaName"
      />

      <!-- ── CLASSIC / RUSTIC ────────────────────────────────────────────────── -->
      <ClassicTheme
        v-if="isLegacyTheme && !isStitchTheme"
        v-bind="sharedThemeProps"
        @open-detail="openDetail"
        @select-category="selectedCategoryId = $event"
        @update:search-query="searchQuery = $event"
        @slide-touch-start="onSlideTouchStart"
        @slide-touch-end="onSlideTouchEnd"
      />

      <!-- ── STITCH ──────────────────────────────────────────────────────────── -->
      <StitchTheme
        v-else-if="isStitchTheme"
        v-bind="sharedThemeProps"
        :stitch-category-view-open="stitchCategoryViewOpen"
        @open-detail="openDetail"
        @select-category="selectedCategoryId = $event"
        @toggle-category="toggleLegacyCategory($event)"
        @close-category-view="closeStitchCategoryView"
        @update:search-query="searchQuery = $event"
      />

      <!-- ── DARK ELEGANCE ───────────────────────────────────────────────────── -->
      <DarkEleganceTheme
        v-else-if="isDarkEleganceTheme"
        :spa-config="spaConfig"
        :article-slides="articleSlides"
        :dark-category-tiles="darkCategoryTiles"
        :dark-selected-services="darkSelectedServices"
        :dark-category-view-open="darkCategoryViewOpen"
        :selected-category-id="selectedCategoryId"
        :current-slide-index="currentSlideIndex"
        :loading-config="loadingConfig"
        :loading-services="loadingServices"
        :search-query="searchQuery"
        :get-service-name="getServiceName"
        :get-service-short-description="getServiceShortDescription"
        :get-service-display-price="getServiceDisplayPrice"
        :get-service-label-items="getServiceLabelItems"
        :get-badge-classes="getBadgeClasses"
        @open-detail="openDetail"
        @open-dark-category="openDarkCategory($event)"
        @close-dark-category-view="closeDarkCategoryView"
        @update:search-query="searchQuery = $event"
        @slide-touch-start="onSlideTouchStart"
        @slide-touch-end="onSlideTouchEnd"
      />

      <!-- ── MODERN MINIMAL ──────────────────────────────────────────────────── -->
      <ModernMinimalTheme
        v-else-if="isModernMinimalTheme"
        :spa-config="spaConfig"
        :article-slides="articleSlides"
        :modern-minimal-columns="modernMinimalColumns"
        :filtered-services="filteredServices"
        :categories="categories"
        :selected-category-id="selectedCategoryId"
        :current-slide-index="currentSlideIndex"
        :loading-config="loadingConfig"
        :loading-services="loadingServices"
        :search-query="searchQuery"
        :get-service-name="getServiceName"
        :get-service-display-price="getServiceDisplayPrice"
        :get-service-label-items="getServiceLabelItems"
        :get-badge-classes="getBadgeClasses"
        @open-detail="openDetail"
        @select-category="selectedCategoryId = $event"
        @update:search-query="searchQuery = $event"
        @slide-touch-start="onSlideTouchStart"
        @slide-touch-end="onSlideTouchEnd"
      />

      <!-- ── NATURE ──────────────────────────────────────────────────────────── -->
      <NatureTheme
        v-else-if="isNatureTheme"
        :spa-config="spaConfig"
        :article-slides="articleSlides"
        :filtered-services="filteredServices"
        :grouped-by-category="groupedByCategory"
        :categories="categories"
        :selected-category-id="selectedCategoryId"
        :current-slide-index="currentSlideIndex"
        :loading-config="loadingConfig"
        :loading-services="loadingServices"
        :get-service-name="getServiceName"
        :get-service-short-description="getServiceShortDescription"
        :get-service-display-price="getServiceDisplayPrice"
        :get-service-label-items="getServiceLabelItems"
        :get-badge-classes="getBadgeClasses"
        @open-detail="openDetail"
        @select-category="selectedCategoryId = $event"
        @slide-touch-start="onSlideTouchStart"
        @slide-touch-end="onSlideTouchEnd"
      />

      <!-- ── ROSE ────────────────────────────────────────────────────────────── -->
      <RoseTheme
        v-else-if="isRoseTheme"
        :spa-config="spaConfig"
        :article-slides="articleSlides"
        :filtered-services="filteredServices"
        :grouped-by-category="groupedByCategory"
        :categories="categories"
        :selected-category-id="selectedCategoryId"
        :rose-category-view-open="roseCategoryViewOpen"
        :current-slide-index="currentSlideIndex"
        :loading-config="loadingConfig"
        :loading-services="loadingServices"
        :search-query="searchQuery"
        :get-service-name="getServiceName"
        :get-service-short-description="getServiceShortDescription"
        :get-service-display-price="getServiceDisplayPrice"
        :get-service-label-items="getServiceLabelItems"
        :get-badge-classes="getBadgeClasses"
        @open-detail="openDetail"
        @open-rose-category="openRoseCategory($event)"
        @close-rose-category-view="closeRoseCategoryView"
        @switch-to-all-tab="switchToAllTab"
        @update:search-query="searchQuery = $event"
        @slide-touch-start="onSlideTouchStart"
        @slide-touch-end="onSlideTouchEnd"
      />

      <!-- ── VIBRANT ─────────────────────────────────────────────────────────── -->
      <VibrantTheme
        v-else-if="isVibrantTheme"
        :spa-config="spaConfig"
        :article-slides="articleSlides"
        :filtered-services="filteredServices"
        :categories="categories"
        :selected-category-id="selectedCategoryId"
        :current-slide-index="currentSlideIndex"
        :loading-services="loadingServices"
        :get-service-name="getServiceName"
        :get-service-display-price="getServiceDisplayPrice"
        :get-service-label-items="getServiceLabelItems"
        :get-badge-classes="getBadgeClasses"
        @open-detail="openDetail"
        @select-category="selectedCategoryId = $event"
        @slide-touch-start="onSlideTouchStart"
        @slide-touch-end="onSlideTouchEnd"
      />

      <!-- ── OCEAN ───────────────────────────────────────────────────────────── -->
      <OceanTheme
        v-else-if="isOceanTheme"
        :spa-config="spaConfig"
        :ocean-groups="oceanGroups"
        :loading-config="loadingConfig"
        :loading-services="loadingServices"
        :get-service-name="getServiceName"
        :get-service-display-price="getServiceDisplayPrice"
        :get-ocean-service-label-items="getOceanServiceLabelItems"
        :get-ocean-badge-classes="getOceanBadgeClasses"
        @open-detail="openDetail"
      />

      <!-- ── NEON ────────────────────────────────────────────────────────────── -->
      <NeonTheme
        v-else-if="isNeonTheme"
        :spa-config="spaConfig"
        :article-slides="articleSlides"
        :filtered-services="filteredServices"
        :categories="categories"
        :selected-category-id="selectedCategoryId"
        :current-slide-index="currentSlideIndex"
        :loading-services="loadingServices"
        :search-query="searchQuery"
        :get-service-name="getServiceName"
        :get-service-display-price="getServiceDisplayPrice"
        :get-service-label-items="getServiceLabelItems"
        :get-badge-classes="getBadgeClasses"
        @open-detail="openDetail"
        @select-category="selectedCategoryId = $event"
        @update:search-query="searchQuery = $event"
        @slide-touch-start="onSlideTouchStart"
        @slide-touch-end="onSlideTouchEnd"
      />

      <!-- ── SERVICE DETAIL MODAL ────────────────────────────────────────────── -->
      <MenuServiceDetail
        :show="showDetail"
        :service="selectedService"
        :menu-size="menuSize"
        :customer-interface-style="customerInterfaceStyle"
        :theme-id="themeId"
        :get-service-display-price="getServiceDisplayPrice"
        :format-currency-single="formatCurrencySingle"
        :get-service-label-items="getServiceLabelItems"
        :get-badge-classes="getBadgeClasses"
        :get-detail-variant-options="getDetailVariantOptions"
        @close="closeDetail"
      />
    </div>
  </div>
</template>

<style scoped>
/* Menu size: large */
.menu-size-large .t-spa-name { font-size: 32px !important; }
.menu-size-large .t-cat-title { font-size: 22px !important; }
.menu-size-large .t-card-name { font-size: 17px !important; }
.menu-size-large .t-card-info p { font-size: 13px !important; }
.menu-size-large .t-card-price span { font-size: 19px !important; }
.menu-size-large .t-service-section { gap: 2.4rem !important; }
.menu-size-large input, .menu-size-large button,
.menu-size-large textarea, .menu-size-large select { font-size: 15px !important; }

/* Menu size: normal */
.menu-size-normal .t-spa-name { font-size: 28px !important; }

/* Menu size: compact */
.menu-size-compact .t-spa-name { font-size: 24px !important; }
.menu-size-compact .t-cat-title { font-size: 18px !important; }
.menu-size-compact .t-card-name { font-size: 14px !important; }
.menu-size-compact .t-card-info p { font-size: 11px !important; }
.menu-size-compact .t-card-price span { font-size: 15px !important; }
.menu-size-compact input, .menu-size-compact button,
.menu-size-compact textarea, .menu-size-compact select { font-size: 12px !important; }
</style>
