<script setup lang="ts">
import { X, Image, Upload, ChevronDown, Plus, Trash2 } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import imgFallback from '@/assets/img_fallback.png'
import { SUPPORTED_LOCALES } from '@/i18n'
import { computed, ref, watch } from 'vue'
import './ServiceFormDialog.css'

const props = defineProps<{
  show: boolean
  form: any
  editingService: any
  formLoading: boolean
  saving: boolean
  uploadLoading: boolean
  isDraggingImage: boolean
  formError: string
  fieldErrors: Record<string, string>
  categories: any[] | undefined
  getLocaleCategoryName: (cat: any) => string
  hasLocaleContent: (loc: string) => boolean
  formLabelOptions: Array<{ value: string; label: string }>
  getLabelChipClass: (val: string) => string
  getVariantName: (idx: number) => string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save'): void
  (e: 'upload', event: Event): void
  (e: 'drop', event: DragEvent): void
  (e: 'dragover'): void
  (e: 'dragleave'): void
  (e: 'add-label'): void
  (e: 'toggle-label', val: string): void
  (e: 'add-variant'): void
  (e: 'remove-variant', idx: number): void
  (e: 'set-variant-name', idx: number, val: string): void
}>()

const { t } = useI18n({ useScope: 'global' })

const formLocaleLang = defineModel<string>('formLocaleLang', { required: true })
const activeLocaleName = defineModel<string>('activeLocaleName', { required: true })
const activeLocaleShortDesc = defineModel<string>('activeLocaleShortDesc', { required: true })
const activeLocaleDescription = defineModel<string>('activeLocaleDescription', { required: true })
const priceFromInput = defineModel<string>('priceFromInput', { required: true })
const priceToInput = defineModel<string>('priceToInput', { required: true })
const newLabelInput = defineModel<string>('newLabelInput', { required: true })
const newLabelError = defineModel<string>('newLabelError', { required: true })

const formCategoryOpen = ref(false)

const formCategoryLabel = computed(() => {
  if (!props.form.categoryId) return t('admin.serviceManager.selectCategory')
  const cat = props.categories?.find((c: any) => c.id === props.form.categoryId)
  return cat ? props.getLocaleCategoryName(cat) : t('admin.serviceManager.selectCategory')
})

function handleImgError(e: Event) {
  const target = e.target as HTMLImageElement
  if (target.src !== imgFallback) {
    target.src = imgFallback
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="show" class="fixed inset-0 z-40 bg-black/30" @click="emit('close')" />
    </Transition>
    <Transition name="slide-right">
      <div v-if="show" class="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-surface-page shadow-popup sm:w-[520px]">
        <!-- Header -->
        <div class="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white px-6 py-4">
          <h3 class="text-lg font-bold text-text-primary">
            {{ editingService ? t('admin.serviceManager.editService') : t('admin.serviceManager.newService') }}
          </h3>
          <button class="rounded-lg p-1.5 text-text-muted hover:bg-surface-input" @click="emit('close')">
            <X class="h-5 w-5" />
          </button>
        </div>

        <div v-if="formLoading" class="space-y-4 p-6">
          <div class="h-10 w-full rounded-lg bg-surface-input animate-pulse"></div>
          <div class="h-10 w-full rounded-lg bg-surface-input animate-pulse"></div>
          <div class="h-20 w-full rounded-lg bg-surface-input animate-pulse"></div>
          <div class="h-10 w-full rounded-lg bg-surface-input animate-pulse"></div>
          <div class="h-24 w-full rounded-2xl bg-surface-input animate-pulse"></div>
        </div>

        <div v-else class="space-y-6 p-6">
          <!-- ===== Language Tab (top of form) ===== -->
          <div class="flex overflow-hidden rounded-xl border border-border bg-surface-input">
            <button
              v-for="loc in SUPPORTED_LOCALES"
              :key="loc"
              type="button"
              @click="formLocaleLang = loc"
              :class="[
                'relative flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition-all',
                formLocaleLang === loc
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-text-muted hover:text-text-primary',
              ]"
            >
              <span>{{ t(`common.languages.${loc}`) }}</span>
              <span
                v-if="hasLocaleContent(loc)"
                :class="[
                  'absolute right-2 top-2 h-1.5 w-1.5 rounded-full',
                  formLocaleLang === loc ? 'bg-primary-500' : 'bg-emerald-400',
                ]"
              />
            </button>
          </div>
          
          <!-- Service Name -->
          <div>
            <label class="mb-1.5 block text-sm font-medium text-text-secondary">{{ t('admin.serviceManager.serviceName') }}</label>
            <input
              v-model="activeLocaleName"
              type="text"
              :placeholder="t('admin.serviceManager.serviceNamePlaceholder')"
              class="w-full rounded-lg border-0 bg-surface-input px-4 py-3 text-sm text-text-primary outline-none ring-1 ring-transparent placeholder:text-text-muted focus:ring-2 focus:ring-primary-600"
            />
            <p v-if="fieldErrors.name" class="mt-1 text-xs font-medium text-danger">{{ fieldErrors.name }}</p>
          </div>

          <!-- Category -->
          <div>
            <label class="mb-1.5 block text-sm font-medium text-text-secondary">{{ t('admin.services.columns.category') }}</label>
            <div class="relative">
              <button 
                type="button" 
                class="w-full text-left filter-trigger"
                @click="formCategoryOpen = !formCategoryOpen"
              >
                <span class="truncate">{{ formCategoryLabel }}</span>
                <ChevronDown :class="['h-4 w-4 text-text-muted transition-transform duration-200', formCategoryOpen ? 'rotate-180' : '']" />
              </button>
              <p v-if="fieldErrors.categoryId" class="mt-1 text-xs font-medium text-danger">{{ fieldErrors.categoryId }}</p>
              
              <Transition name="fade-down">
                <div v-if="formCategoryOpen" class="filter-menu w-full">
                  <button 
                    v-for="cat in categories" 
                    :key="cat.id" 
                    type="button" 
                    :class="['filter-option', form.categoryId === cat.id ? 'filter-option-active' : '']" 
                    @click="form.categoryId = cat.id; formCategoryOpen = false"
                  >
                    {{ getLocaleCategoryName(cat) }}
                  </button>
                </div>
              </Transition>
            </div>
          </div>

          <!-- Product Variants Toggle -->
          <div class="rounded-xl border border-border p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-semibold text-text-primary">{{ t('admin.serviceManager.productVariants') }}</p>
                <p class="text-xs text-text-muted">{{ t('admin.serviceManager.variantHint') }}</p>
              </div>
              <button
                type="button"
                class="relative h-7 w-12 rounded-full transition-colors"
                :class="form.hasVariants ? 'bg-primary-600' : 'bg-surface-input'"
                @click="form.hasVariants = !form.hasVariants"
              >
                <span
                  class="absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform"
                  :class="form.hasVariants ? 'translate-x-5' : 'translate-x-0.5'"
                />
              </button>
            </div>
          </div>

          <div v-if="!form.hasVariants">
            <label class="mb-1.5 block text-sm font-medium text-text-secondary">{{ t('admin.services.columns.price') }}</label>
            <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <input
                v-model="priceFromInput"
                type="number"
                min="0"
                step="0.01"
                :placeholder="t('admin.serviceManager.priceFrom')"
                class="w-full rounded-lg border-0 bg-surface-input px-4 py-3 text-sm text-text-primary outline-none ring-1 ring-transparent focus:ring-2 focus:ring-primary-600"
              />
              <span class="text-base font-bold text-text-secondary">-</span>
              <input
                v-model="priceToInput"
                type="number"
                min="0"
                step="0.01"
                :placeholder="t('admin.serviceManager.priceTo')"
                class="w-full rounded-lg border-0 bg-surface-input px-4 py-3 text-sm text-text-primary outline-none ring-1 ring-transparent focus:ring-2 focus:ring-primary-600"
              />
            </div>
            <p v-if="fieldErrors.price" class="mt-1 text-xs font-medium text-danger">{{ fieldErrors.price }}</p>
          </div>

          <div v-else class="space-y-3">
            <label class="mb-1.5 block text-sm font-medium text-text-secondary">{{ t('admin.serviceManager.variantOptions') }}</label>
            <div
              v-for="(opt, idx) in form.variantOptions"
              :key="idx"
              class="grid grid-cols-[1fr_120px_32px] gap-3"
            >
              <input
                :value="getVariantName(Number(idx))"
                @input="emit('set-variant-name', Number(idx), ($event.target as HTMLInputElement).value)"
                type="text"
                :placeholder="t('admin.serviceManager.optionNamePlaceholder')"
                class="w-full rounded-lg border-0 bg-surface-input px-4 py-3 text-sm text-text-primary outline-none ring-1 ring-transparent focus:ring-2 focus:ring-primary-600"
              />
              <input
                v-model.number="opt.price"
                type="number"
                min="0.01"
                step="0.01"
                class="w-full rounded-lg border-0 bg-surface-input px-4 py-3 text-sm text-text-primary outline-none ring-1 ring-transparent focus:ring-2 focus:ring-primary-600"
              />
              <button
                type="button"
                class="flex items-center justify-center rounded-lg text-danger hover:bg-danger/10"
                @click="emit('remove-variant', Number(idx))"
              >
                <Trash2 class="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              class="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface-input py-2.5 text-sm font-semibold text-text-primary hover:bg-surface-page"
              @click="emit('add-variant')"
            >
              <Plus class="h-4 w-4" /> {{ t('admin.serviceManager.addOption') }}
            </button>
            <p v-if="fieldErrors.variantOptions" class="text-xs font-medium text-danger">{{ fieldErrors.variantOptions }}</p>
          </div>

          <!-- Special Label -->
          <div>
            <label class="mb-1.5 block text-sm font-medium text-text-secondary">{{ t('admin.serviceManager.specialLabel') }}</label>
            <div class="mb-2 grid grid-cols-[1fr_auto] gap-2">
              <input
                v-model="newLabelInput"
                type="text"
                :placeholder="t('admin.serviceManager.newLabelPlaceholder')"
                class="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                @keydown.enter.prevent="emit('add-label')"
              />
              <button
                type="button"
                class="rounded-lg border border-border bg-gradient-to-b from-primary-500 to-[#0048B5] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-surface-page"
                @click="emit('add-label')"
              >
                {{ t('admin.serviceManager.add') }}
              </button>
            </div>
            <p v-if="newLabelError" class="mb-2 text-xs font-medium text-danger">{{ newLabelError }}</p>
            <div class="mt-2 flex flex-wrap gap-2">
              <button
                v-for="item in formLabelOptions"
                :key="item.value"
                type="button"
                class="rounded-lg px-4 py-2 text-sm font-bold transition-all"
                :class="getLabelChipClass(item.value)"
                @click="emit('toggle-label', item.value)"
              >
                {{ item.label }}
              </button>
            </div>
          </div>

          <!-- Short Description -->
          <div>
            <label class="mb-1.5 block text-sm font-medium text-text-secondary">{{ t('admin.serviceManager.shortDescription') }}</label>
            <textarea
              v-model="activeLocaleShortDesc"
              rows="2"
              :placeholder="t('admin.serviceManager.shortDescriptionPlaceholder')"
              class="w-full resize-none rounded-lg border-0 bg-surface-input px-4 py-3 text-sm text-text-primary outline-none ring-1 ring-transparent placeholder:text-text-muted focus:ring-2 focus:ring-primary-600"
            />
          </div>

          <!-- Description -->
          <div>
            <label class="mb-1.5 block text-sm font-medium text-text-secondary">{{ t('menu.description') }}</label>
            <textarea
              v-model="activeLocaleDescription"
              rows="3"
              :placeholder="t('admin.serviceManager.descriptionPlaceholder')"
              class="w-full resize-none rounded-lg border-0 bg-surface-input px-4 py-3 text-sm text-text-primary outline-none ring-1 ring-transparent placeholder:text-text-muted focus:ring-2 focus:ring-primary-600"
            />
          </div>

          <!-- Duration -->
          <div>
            <label class="mb-1.5 block text-sm font-medium text-text-secondary">{{ t('admin.serviceManager.timeMinutes') }}</label>
            <div class="relative">
              <input
                v-model.number="form.durationMinutes"
                type="number"
                placeholder="60"
                class="w-full rounded-lg border-0 bg-surface-input px-4 py-3 text-sm text-text-primary outline-none ring-1 ring-transparent placeholder:text-text-muted focus:ring-2 focus:ring-primary-600"
              />
            </div>
          </div>

          <!-- Status -->
          <div>
            <label class="mb-1.5 block text-sm font-medium text-text-secondary">{{ t('admin.services.columns.status') }}</label>
            <div class="flex gap-3">
              <button
                :class="['rounded-lg px-4 py-2 text-sm font-bold transition-all', form.isActive ? 'bg-success/10 text-success ring-2 ring-success' : 'bg-surface-input text-text-muted']"
                @click="form.isActive = true"
              >{{ t('admin.common.active') }}</button>
              <button
                :class="['rounded-lg px-4 py-2 text-sm font-bold transition-all', !form.isActive ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-300' : 'bg-surface-input text-text-muted']"
                @click="form.isActive = false"
              >{{ t('admin.common.inactive') }}</button>
            </div>
          </div>

          <!-- Image Upload -->
          <div>
            <div class="mb-1.5 flex items-center gap-2 text-sm font-medium text-text-secondary">
              <Image class="h-4 w-4" />
              Service Image
            </div>
            <label 
              class="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-colors"
              :class="[
                uploadLoading ? 'opacity-70 pointer-events-none' : '',
                isDraggingImage ? 'border-primary-600 bg-primary-50/50' : 'border-border bg-surface-input hover:border-primary-600'
              ]"
              @dragover.prevent="emit('dragover')"
              @dragleave.prevent="emit('dragleave')"
              @drop.prevent="e => { emit('drop', e) }"
            >
              <Upload class="mb-2 h-8 w-8 text-text-muted" />
              <span class="text-sm font-bold text-text-primary">{{ uploadLoading ? t('admin.settings.uploadingBanner') : t('admin.settings.uploadHint') }}</span>
              <span class="mt-1 text-xs text-text-muted">{{ t('admin.settings.bannerHint') }}</span>
              <input type="file" accept="image/*" class="hidden" @change="e => emit('upload', e)" :disabled="uploadLoading" />
            </label>
            <p v-if="fieldErrors.imageUrl" class="mt-1 text-xs font-medium text-danger">{{ fieldErrors.imageUrl }}</p>
            <div v-if="form.imageUrl && form.imageUrl !== imgFallback" class="mt-3 overflow-hidden rounded-xl">
              <img :src="form.imageUrl" alt="Preview" class="h-32 w-full object-cover" @error="handleImgError" />
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="sticky bottom-0 flex gap-3 border-t border-border bg-white p-6">
          <button
            class="flex-1 rounded-xl bg-gradient-to-b from-primary-600 to-[#0048B5] py-3 text-sm font-extrabold text-white shadow-button transition-all hover:brightness-110 disabled:opacity-50"
            :disabled="saving || formLoading || !form.name"
            @click="emit('save')"
          >
            {{ saving ? t('admin.common.saving') : t('admin.serviceManager.saveService') }}
          </button>
          <button
            class="flex-1 rounded-xl bg-surface-secondary py-3 text-sm font-bold text-text-dim transition-all hover:bg-surface-input"
            @click="emit('close')"
          >
            {{ t('admin.common.cancel') }}
          </button>
        </div>
        <p v-if="formError" class="px-6 pb-5 text-sm font-medium text-danger">{{ formError }}</p>
      </div>
    </Transition>
  </Teleport>
</template>
