<script setup lang="ts">
import { ChevronDown, Search } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'

const props = defineProps<{
  categories: any[] | undefined
  getLocaleCategoryName: (cat: any) => string
  openFilter: string | null
}>()

const searchInput = defineModel<string>('searchInput', { required: true })
const selectedStatus = defineModel<string>('selectedStatus', { required: true })
const selectedCategory = defineModel<string>('selectedCategory', { required: true })
const selectedSort = defineModel<'newest' | 'oldest'>('selectedSort', { required: true })

const emit = defineEmits<{
  (e: 'toggle-filter', name: 'status' | 'category' | 'sort'): void
  (e: 'set-status', value: string): void
  (e: 'set-category', value: string): void
  (e: 'set-sort', value: 'newest' | 'oldest'): void
}>()

const { t } = useI18n({ useScope: 'global' })

const statusLabel = computed(() => {
  if (selectedStatus.value === 'true') return t('admin.common.active')
  if (selectedStatus.value === 'false') return t('admin.common.inactive')
  return t('admin.services.allStatus')
})

const categoryLabel = computed(() => {
  if (!selectedCategory.value) return t('admin.services.allCategories')
  const category = props.categories?.find((c: any) => c.id === selectedCategory.value)
  return category ? props.getLocaleCategoryName(category) : t('admin.services.allCategories')
})

const sortLabel = computed(() => (selectedSort.value === 'oldest' ? t('admin.serviceManager.sortOldest') : t('admin.serviceManager.sortNewest')))
</script>

<template>
  <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <h3 class="text-xl font-bold flex-shrink-0 text-text-primary">{{ t('admin.serviceManager.currentList') }}</h3>
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(240px,1fr)_120px_160px_160px] sm:items-center sm:gap-4 filter-container">
      <div class="relative min-w-0">
        <Search class="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          v-model="searchInput"
          type="text"
          :placeholder="t('admin.services.searchPlaceholder')"
          class="w-full rounded-full border border-border bg-white py-2.5 pl-11 pr-4 text-sm font-medium text-text-primary shadow-sm outline-none placeholder:text-text-muted focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
        />
      </div>
      <div class="relative min-w-0">
        <button type="button" class="filter-trigger" @click.stop="emit('toggle-filter', 'status')">
          <span class="truncate">{{ statusLabel }}</span>
          <ChevronDown :class="['h-4 w-4 text-text-muted transition-transform duration-200', openFilter === 'status' ? 'rotate-180' : '']" />
        </button>
        <Transition name="fade-down">
          <div v-if="openFilter === 'status'" class="filter-menu">
            <button type="button" :class="['filter-option', !selectedStatus ? 'filter-option-active' : '']" @click.stop="emit('set-status', '')">{{ t('admin.services.allStatus') }}</button>
            <button type="button" :class="['filter-option', selectedStatus === 'true' ? 'filter-option-active' : '']" @click.stop="emit('set-status', 'true')">{{ t('admin.common.active') }}</button>
            <button type="button" :class="['filter-option', selectedStatus === 'false' ? 'filter-option-active' : '']" @click.stop="emit('set-status', 'false')">{{ t('admin.common.inactive') }}</button>
          </div>
        </Transition>
      </div>
      <div class="relative min-w-0">
        <button type="button" class="filter-trigger" @click.stop="emit('toggle-filter', 'category')">
          <span class="truncate">{{ categoryLabel }}</span>
          <ChevronDown :class="['h-4 w-4 text-text-muted transition-transform duration-200', openFilter === 'category' ? 'rotate-180' : '']" />
        </button>
        <Transition name="fade-down">
          <div v-if="openFilter === 'category'" class="filter-menu">
            <button type="button" :class="['filter-option', !selectedCategory ? 'filter-option-active' : '']" @click.stop="emit('set-category', '')">{{ t('admin.services.allCategories') }}</button>
            <button v-for="cat in categories" :key="cat.id" type="button" :class="['filter-option', 'truncate', selectedCategory === cat.id ? 'filter-option-active' : '']" @click.stop="emit('set-category', cat.id)">{{ getLocaleCategoryName(cat) }}</button>
          </div>
        </Transition>
      </div>
      <div class="relative min-w-0">
        <button type="button" class="filter-trigger" @click.stop="emit('toggle-filter', 'sort')">
          <span class="truncate">{{ sortLabel }}</span>
          <ChevronDown :class="['h-4 w-4 text-text-muted transition-transform duration-200', openFilter === 'sort' ? 'rotate-180' : '']" />
        </button>
        <Transition name="fade-down">
          <div v-if="openFilter === 'sort'" class="filter-menu">
            <button type="button" :class="['filter-option', selectedSort === 'newest' ? 'filter-option-active' : '']" @click.stop="emit('set-sort', 'newest')">{{ t('admin.serviceManager.sortNewest') }}</button>
            <button type="button" :class="['filter-option', selectedSort === 'oldest' ? 'filter-option-active' : '']" @click.stop="emit('set-sort', 'oldest')">{{ t('admin.serviceManager.sortOldest') }}</button>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-down-enter-active,
.fade-down-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.fade-down-enter-from,
.fade-down-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.filter-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid var(--color-border);
  border-radius: 0.95rem;
  background: #ffffff;
  padding: 0.7rem 0.95rem;
  font-size: 0.84rem;
  font-weight: 800;
  color: var(--color-text-primary);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.filter-trigger:focus {
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px rgba(0, 72, 181, 0.14);
}

.filter-trigger:hover {
  background: #f8fafc;
}

.filter-menu {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 0.4rem);
  z-index: 30;
  max-height: 260px;
  overflow-y: auto;
  border: 1px solid #dbe3f0;
  border-radius: 0.9rem;
  background: #ffffff;
  box-shadow: 0 14px 35px rgba(15, 23, 42, 0.16);
  padding: 0.35rem;
}

.filter-option {
  width: 100%;
  border: none;
  border-radius: 0.65rem;
  background: transparent;
  padding: 0.58rem 0.7rem;
  text-align: left;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--color-text-primary);
  transition: background-color 0.15s ease, color 0.15s ease;
}

.filter-option:hover {
  background: #f4f8ff;
}

.filter-option-active {
  background: #e8f0ff;
  color: #0048b5;
}
</style>
