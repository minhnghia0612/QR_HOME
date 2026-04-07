<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { servicesApi } from '@/api/services.api'
import { categoriesApi } from '@/api/categories.api'
import { uploadApi } from '@/api/upload.api'
import type { CreateServicePayload } from '@/types/service.types'
import { Upload, ArrowLeft, Plus, Trash2, ChevronDown } from 'lucide-vue-next'

type SpecialTag = 'must_try' | 'limited_edition' | 'summer_special' | 'happy_hour'

const SPECIAL_TAG_OPTIONS: Array<{ value: SpecialTag; label: string }> = [
  { value: 'must_try', label: '#MustTry' },
  { value: 'limited_edition', label: '#LimitedEdition' },
  { value: 'summer_special', label: '#SummerSpecial' },
  { value: 'happy_hour', label: '#HappyHour' },
]

const route = useRoute()
const router = useRouter()
const queryClient = useQueryClient()

const isEditing = computed(() => !!route.params.id)
const serviceId = computed(() => route.params.id as string)

const form = ref<CreateServicePayload>({
  categoryId: '',
  name: '',
  description: '',
  durationMinutes: 0,
  price: 0,
  currency: 'VND',
  imageUrl: '',
  hasVariants: false,
  variantOptions: [],
  isBestSeller: false,
  isNewService: false,
  isCombo: false,
  specialTags: [],
  isActive: true,
  sortOrder: 0,
})

const imagePreview = ref('')
const isUploading = ref(false)
const priceFromInput = ref('')
const priceToInput = ref('')
const formError = ref('')
const formCategoryOpen = ref(false)
const categoryDropdownRef = ref<HTMLElement | null>(null)

const { data: categories } = useQuery({
  queryKey: ['categories'],
  queryFn: async () => {
    const { data } = await categoriesApi.getAll()
    return data.data
  },
})

const formCategoryLabel = computed(() => {
  if (!form.value.categoryId) return 'Select category...'
  const cat = categories.value?.find((c: any) => c.id === form.value.categoryId)
  return cat?.name || 'Select category...'
})

// Load existing service for edit
onMounted(async () => {
  document.addEventListener('mousedown', handleClickOutside)
  if (isEditing.value) {
    try {
      const { data } = await servicesApi.getOne(serviceId.value)
      const svc = data.data
      form.value = {
        categoryId: svc.categoryId,
        name: svc.name,
        description: svc.description,
        durationMinutes: svc.durationMinutes,
        price: svc.price,
        priceFrom: svc.priceFrom,
        priceTo: svc.priceTo,
        currency: svc.currency,
        imageUrl: svc.imageUrl,
        hasVariants: !!svc.hasVariants,
        variantOptions: Array.isArray(svc.variantOptions)
          ? svc.variantOptions.map((opt: any) => ({
              name: opt?.name || '',
              price: Number(opt?.price) || 0,
            }))
          : [],
        isBestSeller: svc.isBestSeller,
        isNewService: svc.isNewService,
        isCombo: false,
        specialTags: Array.isArray(svc.specialTags) ? svc.specialTags : [],
        isActive: svc.isActive,
        sortOrder: svc.sortOrder,
      }
      priceFromInput.value = svc.priceFrom != null ? String(svc.priceFrom) : ''
      priceToInput.value = svc.priceTo != null ? String(svc.priceTo) : ''
      imagePreview.value = svc.imageUrl
    } catch {
      router.push('/admin/services')
    }
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})

function handleClickOutside(event: MouseEvent) {
  if (categoryDropdownRef.value && !categoryDropdownRef.value.contains(event.target as Node)) {
    formCategoryOpen.value = false
  }
}

function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : undefined
}

function toggleTag(value: SpecialTag) {
  const tags = new Set(form.value.specialTags || [])
  if (tags.has(value)) {
    tags.delete(value)
  } else {
    tags.add(value)
  }
  form.value.specialTags = Array.from(tags)
}

function hasTag(value: SpecialTag) {
  return (form.value.specialTags || []).includes(value)
}

function getPrimaryLabelClass(active: boolean) {
  return active
    ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-300'
    : 'bg-surface-input text-primary-600/80 ring-1 ring-primary-100 hover:bg-primary-100'
}

function addVariantOption() {
  const list = form.value.variantOptions || []
  form.value.variantOptions = [...list, { name: '', price: 0 }]
}

function removeVariantOption(index: number) {
  const list = [...(form.value.variantOptions || [])]
  list.splice(index, 1)
  form.value.variantOptions = list
}

const saveMutation = useMutation({
  mutationFn: async () => {
    formError.value = ''
    const hasVariants = !!form.value.hasVariants
    const priceFrom = hasVariants ? undefined : parseOptionalNumber(priceFromInput.value)
    const priceTo = hasVariants ? undefined : parseOptionalNumber(priceToInput.value)

    let normalizedPrice = Number(form.value.price)

    if (hasVariants) {
      const options = (form.value.variantOptions || []).map((opt: any) => ({
        name: String(opt?.name || '').trim(),
        price: Number(opt?.price),
      }))

      if (!options.length) {
        throw new Error('Please add at least one variant option')
      }

      options.forEach((opt) => {
        if (!opt.name) {
          throw new Error('Variant option name is required')
        }
        if (!Number.isFinite(opt.price) || opt.price <= 0) {
          throw new Error('Variant option price must be greater than 0')
        }
      })

      normalizedPrice = Math.min(...options.map((opt) => opt.price))
      form.value.variantOptions = options
    } else {
      if (!Number.isFinite(normalizedPrice) || normalizedPrice <= 0) {
        throw new Error('Price must be greater than 0')
      }

      if (
        priceFrom !== undefined &&
        priceTo !== undefined &&
        Number(priceFrom) >= Number(priceTo)
      ) {
        throw new Error('Price from must be less than price to')
      }
    }

    const payload: CreateServicePayload = {
      ...form.value,
      isCombo: false,
      price: normalizedPrice,
      priceFrom,
      priceTo,
      variantOptions: hasVariants ? form.value.variantOptions : undefined,
    }

    if (isEditing.value) {
      return servicesApi.update(serviceId.value, payload)
    }
    return servicesApi.create(payload)
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['services'] })
    router.push('/admin/services')
  },
  onError: (error: any) => {
    formError.value = error?.message || 'Failed to save service'
  },
})

async function handleImageUpload(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  isUploading.value = true
  try {
    const { data } = await uploadApi.upload(file)
    form.value.imageUrl = data.data.url
    imagePreview.value = data.data.url
  } catch (err) {
    console.error('Upload Error:', err)
    alert('Failed to upload image')
  } finally {
    isUploading.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-2xl space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <button
        class="rounded-lg p-2 text-navy-600 hover:bg-navy-50"
        @click="router.push('/admin/services')"
      >
        <ArrowLeft class="h-5 w-5" />
      </button>
      <div>
        <h2 class="text-2xl font-bold text-navy-900">
          {{ isEditing ? 'Edit Service' : 'Add New Service' }}
        </h2>
        <p class="text-sm text-text-muted">
          {{ isEditing ? 'Update service details' : 'Create a new service' }}
        </p>
      </div>
    </div>

    <!-- Form -->
    <form
      @submit.prevent="saveMutation.mutate()"
      class="space-y-6 rounded-xl border border-border bg-white p-6 shadow-card"
    >
      <!-- Image upload -->
      <div>
        <label class="mb-2 block text-sm font-medium text-navy-700">Service Image</label>
        <div class="flex items-center gap-4">
          <div
            class="flex h-28 w-28 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-surface-dim"
          >
            <img
              v-if="imagePreview"
              :src="imagePreview"
              class="h-full w-full object-cover"
            />
            <Upload v-else class="h-8 w-8 text-navy-300" />
          </div>
          <div>
            <label
              class="cursor-pointer rounded-lg border border-border px-4 py-2 text-sm font-medium text-navy-700 hover:bg-navy-50"
            >
              {{ isUploading ? 'Uploading...' : 'Choose Image' }}
              <input type="file" accept="image/*" class="hidden" @change="handleImageUpload" />
            </label>
            <p class="mt-1 text-xs text-text-muted">JPG, PNG, WebP. Max 5MB.</p>
          </div>
        </div>
      </div>

      <div>
        <label class="mb-1 block text-sm font-medium text-navy-700">Category</label>
        <div class="relative" ref="categoryDropdownRef">
          <button 
            type="button" 
            class="filter-trigger w-full text-left" 
            @click="formCategoryOpen = !formCategoryOpen"
          >
            <span class="truncate">{{ formCategoryLabel }}</span>
            <ChevronDown :class="['h-4 w-4 text-text-muted transition-transform duration-200', formCategoryOpen ? 'rotate-180' : '']" />
          </button>
          <Transition name="fade-down">
            <div v-if="formCategoryOpen" class="filter-menu w-full">
              <button 
                v-for="cat in categories" 
                :key="cat.id" 
                type="button" 
                :class="['filter-option', form.categoryId === cat.id ? 'filter-option-active' : '']" 
                @click="form.categoryId = cat.id; formCategoryOpen = false"
              >
                {{ cat.name }}
              </button>
            </div>
          </Transition>
        </div>
      </div>

      <!-- Name -->
      <div>
        <label class="mb-1 block text-sm font-medium text-navy-700">Name</label>
        <input
          v-model="form.name"
          required
          class="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-azure-400 focus:ring-2 focus:ring-azure-100"
          placeholder="e.g. Deep Tissue Massage"
        />
      </div>

      <!-- Description + Time -->
      <div class="grid grid-cols-3 gap-4">
        <div class="col-span-2">
          <label class="mb-1 block text-sm font-medium text-navy-700">Description</label>
          <textarea
            v-model="form.description"
            required
            rows="4"
            class="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-azure-400 focus:ring-2 focus:ring-azure-100"
            placeholder="Detailed description of the service"
          />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-navy-700">Time (Mins)</label>
          <input
            v-model.number="form.durationMinutes"
            type="number"
            min="1"
            required
            class="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-azure-400 focus:ring-2 focus:ring-azure-100"
            placeholder="60"
          />
        </div>
      </div>

      <!-- Price + Currency -->
      <div>
        <div class="mb-3 flex items-center justify-between rounded-xl border border-border px-4 py-3">
          <div>
            <p class="text-sm font-semibold text-navy-900">Product Variants</p>
            <p class="text-xs text-text-muted">Enable if this service has different options (size/package)</p>
          </div>
          <button
            type="button"
            class="relative h-7 w-12 rounded-full transition-colors"
            :class="form.hasVariants ? 'bg-primary-600' : 'bg-surface-input'"
            @click="form.hasVariants = !form.hasVariants"
          >
            <span
              class="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform"
              :class="form.hasVariants ? 'translate-x-5' : 'translate-x-0.5'"
            />
          </button>
        </div>
      </div>

      <div v-if="!form.hasVariants" class="grid grid-cols-2 gap-4">
        <div>
          <label class="mb-1 block text-sm font-medium text-navy-700">Price</label>
          <input
            v-model.number="form.price"
            type="number"
            min="0.01"
            step="0.01"
            required
            class="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-azure-400 focus:ring-2 focus:ring-azure-100"
          />
          <p class="mt-1 text-xs text-text-muted">Price must be greater than 0</p>
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-navy-700">Currency</label>
          <select
            v-model="form.currency"
            class="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-azure-400 focus:ring-2 focus:ring-azure-100"
          >
            <option value="USD">USD</option>
            <option value="VND">VND</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
      </div>

      <div v-else class="space-y-3">
        <label class="mb-1 block text-sm font-medium text-navy-700">Variant Options</label>

        <div
          v-for="(opt, idx) in (form.variantOptions || [])"
          :key="idx"
          class="grid grid-cols-[1fr_140px_32px] gap-3"
        >
          <input
            v-model="opt.name"
            type="text"
            placeholder="Option Name (e.g., Small, 60 mins)"
            class="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-azure-400 focus:ring-2 focus:ring-azure-100"
          />
          <input
            v-model.number="opt.price"
            type="number"
            min="0.01"
            step="0.01"
            class="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-azure-400 focus:ring-2 focus:ring-azure-100"
          />
          <button
            type="button"
            class="flex items-center justify-center rounded-lg text-danger hover:bg-danger/10"
            @click="removeVariantOption(idx)"
          >
            <Trash2 class="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          class="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface-input py-2.5 text-sm font-semibold text-navy-700 hover:bg-surface-dim"
          @click="addVariantOption"
        >
          <Plus class="h-4 w-4" />
          Add Option
        </button>
      </div>

      <!-- Optional Price Range -->
      <div v-if="!form.hasVariants">
        <label class="mb-1 block text-sm font-medium text-navy-700">Price Range (Optional)</label>
        <div class="grid grid-cols-2 gap-4">
          <input
            v-model="priceFromInput"
            type="number"
            min="0"
            step="0.01"
            placeholder="From"
            class="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-azure-400 focus:ring-2 focus:ring-azure-100"
          />
          <input
            v-model="priceToInput"
            type="number"
            min="0"
            step="0.01"
            placeholder="To (optional)"
            class="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-azure-400 focus:ring-2 focus:ring-azure-100"
          />
        </div>
        <p class="mt-1 text-xs text-text-muted">If both fields are filled, From must be less than To</p>
      </div>

      <!-- Labels -->
      <div>
        <label class="mb-2 block text-sm font-medium text-navy-700">Special Label</label>
        <div class="flex flex-wrap gap-3">
          <button
            type="button"
            class="rounded-lg px-4 py-2 text-sm font-bold transition-all"
            :class="getPrimaryLabelClass(!!form.isBestSeller)"
            @click="form.isBestSeller = !form.isBestSeller"
          >
            Best Seller
          </button>
          <button
            type="button"
            class="rounded-lg px-4 py-2 text-sm font-bold transition-all"
            :class="getPrimaryLabelClass(!!form.isNewService)"
            @click="form.isNewService = !form.isNewService"
          >
            New
          </button>
          <button
            v-for="tag in SPECIAL_TAG_OPTIONS"
            :key="tag.value"
            type="button"
            class="rounded-lg px-4 py-2 text-sm font-bold transition-all"
            :class="getPrimaryLabelClass(hasTag(tag.value))"
            @click="toggleTag(tag.value)"
          >
            {{ tag.label }}
          </button>
        </div>
      </div>

      <!-- Status -->
      <div>
        <label class="mb-2 block text-sm font-medium text-navy-700">Status</label>
        <div class="flex gap-3">
          <button
            type="button"
            class="rounded-lg px-4 py-2 text-sm font-bold transition-all"
            :class="form.isActive ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-300' : 'bg-surface-input text-text-muted'"
            @click="form.isActive = true"
          >
            Active
          </button>
          <button
            type="button"
            class="rounded-lg px-4 py-2 text-sm font-bold transition-all"
            :class="!form.isActive ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-300' : 'bg-surface-input text-text-muted'"
            @click="form.isActive = false"
          >
            Inactive
          </button>
        </div>
      </div>

      <!-- Sort order -->
      <div>
        <label class="mb-1 block text-sm font-medium text-navy-700">Sort Order</label>
        <input
          v-model.number="form.sortOrder"
          type="number"
          min="0"
          class="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-azure-400 focus:ring-2 focus:ring-azure-100"
        />
      </div>

      <!-- Submit -->
      <div class="flex gap-3 pt-2">
        <button
          type="button"
          class="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-navy-700 hover:bg-navy-50"
          @click="router.push('/admin/services')"
        >
          Cancel
        </button>
        <button
          type="submit"
          :disabled="saveMutation.isPending.value"
          class="flex-1 rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-50"
        >
          {{ saveMutation.isPending.value ? 'Saving...' : isEditing ? 'Update Service' : 'Create Service' }}
        </button>
      </div>

      <p v-if="formError" class="text-sm font-medium text-danger">{{ formError }}</p>
    </form>
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
  border-radius: 0.75rem;
  padding: 0.7rem 0.95rem;
  font-size: 0.88rem;
  font-weight: 500;
  box-shadow: none;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.filter-trigger:focus {
  border-color: #0080ff;
  box-shadow: 0 0 0 4px rgba(0, 128, 255, 0.1);
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
  border-radius: 0.75rem;
  background: #ffffff;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  padding: 0.35rem;
}

.filter-option {
  width: 100%;
  border: none;
  border-radius: 0.5rem;
  background: transparent;
  padding: 0.6rem 0.8rem;
  text-align: left;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-text-primary);
  transition: background-color 0.15s ease;
}

.filter-option:hover {
  background: #f4f8ff;
}

.filter-option-active {
  background: #e8f0ff;
  color: #0048b5;
}
</style>
