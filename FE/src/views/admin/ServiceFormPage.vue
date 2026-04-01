<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { servicesApi } from '@/api/services.api'
import { categoriesApi } from '@/api/categories.api'
import { uploadApi } from '@/api/upload.api'
import type { CreateServicePayload } from '@/types/service.types'
import { Upload, ArrowLeft } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const queryClient = useQueryClient()

const isEditing = computed(() => !!route.params.id)
const serviceId = computed(() => route.params.id as string)

const form = ref<CreateServicePayload>({
  categoryId: '',
  name: '',
  description: '',
  durationMinutes: 60,
  price: 0,
  currency: 'VND',
  imageUrl: '',
  isBestSeller: false,
  isNewService: false,
  isCombo: false,
  isActive: true,
  sortOrder: 0,
})

const imagePreview = ref('')
const isUploading = ref(false)

const { data: categories } = useQuery({
  queryKey: ['categories'],
  queryFn: async () => {
    const { data } = await categoriesApi.getAll()
    return data.data
  },
})

// Load existing service for edit
onMounted(async () => {
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
        currency: svc.currency,
        imageUrl: svc.imageUrl,
        isBestSeller: svc.isBestSeller,
        isNewService: svc.isNewService,
        isCombo: svc.isCombo,
        isActive: svc.isActive,
        sortOrder: svc.sortOrder,
      }
      imagePreview.value = svc.imageUrl
    } catch {
      router.push('/admin/services')
    }
  }
})

const saveMutation = useMutation({
  mutationFn: async () => {
    if (isEditing.value) {
      return servicesApi.update(serviceId.value, form.value)
    }
    return servicesApi.create(form.value)
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['services'] })
    router.push('/admin/services')
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
          {{ isEditing ? 'Update service details' : 'Create a new spa service' }}
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

      <!-- Category -->
      <div>
        <label class="mb-1 block text-sm font-medium text-navy-700">Category</label>
        <select
          v-model="form.categoryId"
          required
          class="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-azure-400 focus:ring-2 focus:ring-azure-100"
        >
          <option value="">Select category...</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">
            {{ cat.name }}
          </option>
        </select>
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
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="mb-1 block text-sm font-medium text-navy-700">Price</label>
          <input
            v-model.number="form.price"
            type="number"
            min="0"
            step="0.01"
            required
            class="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-azure-400 focus:ring-2 focus:ring-azure-100"
          />
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

      <!-- Labels -->
      <div>
        <label class="mb-2 block text-sm font-medium text-navy-700">Labels</label>
        <div class="flex flex-wrap gap-4">
          <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" v-model="form.isBestSeller" class="rounded" />
            Best Seller
          </label>
          <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" v-model="form.isNewService" class="rounded" />
            New
          </label>
          <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" v-model="form.isCombo" class="rounded" />
            Combo
          </label>
          <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" v-model="form.isActive" class="rounded" />
            Active
          </label>
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
    </form>
  </div>
</template>
