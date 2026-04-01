<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { servicesApi } from '@/api/services.api'
import { categoriesApi } from '@/api/categories.api'
import { uploadApi } from '@/api/upload.api'
import { trafficApi } from '@/api/traffic.api'
import { Plus, Search, Image, X, Upload, Pencil, Trash2, ToggleLeft, ToggleRight, Eye, MoreVertical } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth.store'
import { useRouter } from 'vue-router'
import { qrConfigApi } from '@/api/qr-config.api'

const router = useRouter()
const authStore = useAuthStore()

const queryClient = useQueryClient()

const showForm = ref(false)
const editingService = ref<any>(null)
const searchInput = ref('')
const searchQuery = ref('')
const selectedStatus = ref('true')
const selectedCategory = ref('')
const page = ref(1)

// Debounce search
let searchTimeout: any
watch(searchInput, (val) => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    searchQuery.value = val
    page.value = 1
  }, 300)
})

// Reset page on filter change
watch([selectedStatus, selectedCategory], () => {
  page.value = 1
})

// Form state
const form = ref({
  name: '',
  categoryId: '',
  price: 0,
  description: '',
  durationMinutes: 60,
  imageUrl: '',
  isBestSeller: false,
  isNewService: false,
  isCombo: false,
  isActive: true,
})

const { data: services, isLoading } = useQuery({
  queryKey: ['services', searchQuery.value, selectedStatus.value, selectedCategory.value, page.value],
  queryFn: async () => {
    const params: any = { 
      page: page.value, 
      limit: 20,
      search: searchQuery.value.trim() || undefined,
      categoryId: selectedCategory.value || undefined
    }
    
    if (selectedStatus.value === 'true') params.isActive = true
    if (selectedStatus.value === 'false') params.isActive = false
    
    const { data } = await servicesApi.getAll(params)
    return data.data
  },
})

const { data: categories } = useQuery({
  queryKey: ['categories'],
  queryFn: async () => {
    const { data } = await categoriesApi.getAll()
    return data.data
  },
})

const { data: trafficData } = useQuery({
  queryKey: ['traffic-dashboard'],
  queryFn: async () => {
    const { data } = await trafficApi.getDashboard()
    return data.data
  },
})

const formattedGrowth = computed(() => {
  const percent = trafficData.value?.growth?.growthPercent
  if (percent == null) return { text: '0%', class: 'text-text-secondary' }
  if (percent > 0) return { text: `+${percent.toFixed(1)}%`, class: 'text-success' }
  if (percent < 0) return { text: `${percent.toFixed(1)}%`, class: 'text-danger' }
  return { text: '0%', class: 'text-text-secondary' }
})

const { mutate: saveService, isPending: saving } = useMutation({
  mutationFn: async () => {
    if (editingService.value) {
      const { data } = await servicesApi.update(editingService.value.id, form.value)
      return data
    } else {
      const { data } = await servicesApi.create(form.value)
      return data
    }
  },
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['services'] })
    
    // Step forward: if first service, generate QR and go to Dashboard
    const { data: servicesData } = await servicesApi.getAll({ limit: 1 })
    const items = (servicesData as any).data?.items || servicesData.data
    const total = (servicesData as any).data?.total || items?.length || 0
    
    if (total >= 1) { 
      try {
        await qrConfigApi.generate()
        // Force a page reload after redirect to ensure sidebar/onboarding state is updated everywhere
        router.push('/admin/dashboard').then(() => {
          setTimeout(() => {
            window.location.reload()
          }, 500)
        })
      } catch (err) {
        console.error('Auto QR failed:', err)
      }
    }
    
    resetForm()
  },
})

const { mutate: deleteService } = useMutation({
  mutationFn: (id: string) => servicesApi.delete(id),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] }),
})

const { mutate: toggleStatus } = useMutation({
  mutationFn: (svc: any) =>
    servicesApi.update(svc.id, { isActive: !svc.isActive }),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] }),
})

function openCreate() {
  editingService.value = null
  form.value = {
    name: '',
    categoryId: '',
    price: 0,
    description: '',
    durationMinutes: 60,
    imageUrl: '',
    isBestSeller: false,
    isNewService: false,
    isCombo: false,
    isActive: true,
  }
  showForm.value = true
}

function openEdit(svc: any) {
  editingService.value = svc
  form.value = {
    name: svc.name || '',
    categoryId: svc.categoryId || '',
    price: svc.price ? Number(svc.price) : 0,
    description: svc.description || '',
    durationMinutes: svc.durationMinutes || 60,
    imageUrl: svc.imageUrl || '',
    isBestSeller: !!svc.isBestSeller,
    isNewService: !!svc.isNewService,
    isCombo: !!svc.isCombo,
    isActive: svc.isActive !== undefined ? svc.isActive : true,
  }
  showForm.value = true
}

function resetForm() {
  showForm.value = false
  editingService.value = null
}

async function handleUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  try {
    const { data } = await uploadApi.upload(file)
    form.value.imageUrl = data.data?.url || ''
  } catch { /* skip */ }
}

function formatPrice(p: number) {
  return new Intl.NumberFormat('vi-VN').format(p) + ' VND'
}

function getCategoryName(catId: string) {
  return categories.value?.find((c: any) => c.id === catId)?.name || '—'
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-4xl font-bold tracking-tight text-text-primary">Spa Service Management</h2>
        <p class="mt-1 text-sm text-text-secondary">Organize, edit, and optimize customer experience through your digital service catalog.</p>
      </div>
      <div class="flex items-center gap-3">
        <RouterLink
          :to="'/menu/' + authStore.admin?.id"
          target="_blank"
          class="flex items-center gap-2 rounded-xl border border-border bg-white px-5 py-3 text-sm font-extrabold text-text-primary shadow-sm transition-all hover:bg-surface-input active:scale-95"
        >
          <Eye class="h-4 w-4" />
          Preview
        </RouterLink>
        <button
          class="flex items-center gap-2 rounded-xl bg-gradient-to-b from-primary-600 to-[#0048B5] px-5 py-3 text-sm font-extrabold text-white shadow-button transition-all hover:brightness-110 active:scale-95"
          @click="openCreate"
        >
          <Plus class="h-4 w-4" />
          Add New Service
        </button>
      </div>
    </div>

    <!-- Statistics Bento -->
    <div class="mb-10 grid gap-6 grid-cols-1 sm:grid-cols-3">
      <!-- Total Services -->
      <div class="flex items-center gap-4 rounded-2xl border border-border bg-white p-6 shadow-sm transition-shadow hover:shadow-card">
        <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E8F0FF]">
          <svg class="h-8 w-8 text-[#0048B5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 8V21H3V8" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M23 3H1V8H23V3Z" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M10 12H14" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div>
          <p class="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Total Services</p>
          <p class="text-3xl font-black text-text-primary">{{ services?.total || 0 }}</p>
        </div>
      </div>

      <!-- Service Views -->
      <div class="flex items-center gap-4 rounded-2xl border border-border bg-white p-6 shadow-sm transition-shadow hover:shadow-card">
        <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FCE8F3]">
          <svg class="h-8 w-8 text-[#B5007D]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="12" cy="12" r="3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div>
          <p class="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Service Views</p>
          <p class="text-3xl font-black text-text-primary">{{ trafficData?.totalViews?.toLocaleString() || '0' }}</p>
        </div>
      </div>

      <!-- Growth -->
      <div class="flex items-center gap-4 rounded-2xl border border-border bg-white p-6 shadow-sm transition-shadow hover:shadow-card">
        <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E8F0FF]">
          <svg class="h-8 w-8 text-[#0048B5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M23 6l-9.5 9.5-5-5L1 18" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M17 6h6v6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div>
          <p class="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Growth</p>
          <p :class="['text-3xl font-black', formattedGrowth.class]">{{ formattedGrowth.text }}</p>
        </div>
      </div>
    </div>

    <!-- Current Service List Header -->
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h3 class="text-xl font-bold flex-shrink-0 text-text-primary">Current Service List</h3>
      <div class="flex flex-col gap-3 sm:flex-row w-full sm:w-auto">
        <div class="relative flex-grow sm:flex-grow-0">
          <Search class="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            v-model="searchInput"
            type="text"
            placeholder="Search services..."
            class="w-full rounded-full border border-border bg-white py-2.5 pl-11 pr-4 text-sm font-medium text-text-primary shadow-sm outline-none placeholder:text-text-muted focus:border-primary-500 focus:ring-1 focus:ring-primary-500 sm:w-64"
          />
        </div>
        <select v-model="selectedStatus" class="rounded-xl appearance-none border border-border bg-white px-4 py-2.5 text-sm font-bold text-text-secondary shadow-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500">
          <option value="">Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <select v-model="selectedCategory" class="rounded-xl appearance-none border border-border bg-white px-4 py-2.5 text-sm font-bold text-text-secondary shadow-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 max-w-[200px] truncate">
          <option value="">All Categories</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
        </select>
      </div>
    </div>

    <!-- Services Grid -->
    <div v-if="isLoading" class="flex items-center justify-center py-20 text-text-muted">
      <span class="animate-spin text-3xl">⏳</span>
    </div>
    <div v-else-if="!services?.items?.length" class="flex flex-col items-center justify-center rounded-3xl bg-white py-20 text-center shadow-card">
      <div class="mb-4 text-5xl opacity-50">💇‍♀️</div>
      <p class="text-lg font-bold text-text-primary">No services found</p>
      <p class="mt-1 text-sm text-text-muted">Adjust your filters or add a new service.</p>
    </div>
    <div v-else class="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <div
        v-for="svc in services.items"
        :key="svc.id"
        class="group relative flex items-center overflow-hidden rounded-[24px] bg-white p-5 shadow-sm ring-1 ring-border transition-all hover:shadow-card"
      >
        <!-- Horizontal Image -->
        <div class="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-[20px] bg-surface-input">
          <img
            v-if="svc.imageUrl"
            :src="svc.imageUrl"
            :alt="svc.name"
            class="h-full w-full object-cover"
          />
          <div v-else class="flex h-full w-full items-center justify-center text-3xl opacity-50">🧖</div>
          
          <!-- Inactive Overlay -->
          <div v-if="!svc.isActive" class="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
            <span class="rounded-full bg-white/20 px-2 py-0.5 text-[8px] font-black uppercase text-white backdrop-blur-md">Inactive</span>
          </div>
        </div>

        <!-- Content Right -->
        <div class="ml-5 flex flex-1 flex-col justify-between self-stretch py-1">
          <div class="relative">
            <h4 class="pr-8 text-lg font-bold leading-tight text-text-primary line-clamp-1">{{ svc.name }}</h4>
            
            <!-- Badges -->
            <div class="mt-1.5 flex flex-wrap gap-1.5">
              <span v-if="svc.isBestSeller" class="rounded-full bg-[#F3E8FF] px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#9333EA]">Bestseller</span>
              <span v-if="svc.isNewService" class="rounded-full bg-[#E0F2FE] px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#0284C7]">New service</span>
              <span v-if="svc.isCombo" class="rounded-full bg-[#FEF3C7] px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#D97706]">Combo</span>
            </div>

            <p class="mt-2 line-clamp-2 text-sm leading-relaxed text-text-secondary">
              {{ svc.description || 'No description provided.' }}
            </p>
          </div>
          
          <div class="mt-3 flex items-center justify-between">
            <span class="text-xl font-black text-[#0048B5]">{{ formatPrice(svc.price || 0) }}</span>
            <button
              @click="toggleStatus(svc)"
              :class="[
                'relative h-6 w-10 rounded-full transition-colors duration-300',
                svc.isActive ? 'bg-success' : 'bg-surface-input ring-1 ring-inset ring-border'
              ]"
            >
              <span
                :class="[
                  'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300',
                  svc.isActive ? 'translate-x-4' : 'translate-x-0'
                ]"
              />
            </button>
          </div>
        </div>

        <!-- Float Actions Menu/Button -->
        <div class="absolute right-4 top-5 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
           <button
            @click="openEdit(svc)"
            class="flex h-8 w-8 items-center justify-center rounded-full bg-white text-text-primary shadow-sm ring-1 ring-border hover:bg-surface-input"
            title="Edit"
          >
            <Pencil class="h-3.5 w-3.5" />
          </button>
          <button
            @click="deleteService(svc.id)"
            class="flex h-8 w-8 items-center justify-center rounded-full bg-danger/10 text-danger shadow-sm ring-1 ring-danger/20 hover:bg-danger/20"
            title="Delete"
          >
            <Trash2 class="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="services?.totalPages && services.totalPages > 1" class="mt-8 flex items-center justify-center gap-4">
      <button 
        :disabled="page === 1" 
        @click="page--" 
        class="rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-bold text-text-secondary shadow-sm transition-colors hover:bg-surface-input disabled:opacity-50"
      >Previous</button>
      <span class="text-sm font-semibold text-text-secondary">Page {{ page }} of {{ services.totalPages }}</span>
      <button 
        :disabled="page === services.totalPages" 
        @click="page++" 
        class="rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-bold text-text-secondary shadow-sm transition-colors hover:bg-surface-input disabled:opacity-50"
      >Next</button>
    </div>

    <!-- Slide-over Form -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showForm" class="fixed inset-0 z-40 bg-black/30" @click="resetForm" />
      </Transition>
      <Transition name="slide-right">
        <div v-if="showForm" class="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-surface-page shadow-popup sm:w-[520px]">
          <!-- Header -->
          <div class="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white px-6 py-4">
            <h3 class="text-lg font-bold text-text-primary">
              {{ editingService ? 'Edit Service' : 'New Service' }}
            </h3>
            <button class="rounded-lg p-1.5 text-text-muted hover:bg-surface-input" @click="resetForm">
              <X class="h-5 w-5" />
            </button>
          </div>

          <div class="space-y-6 p-6">
            <!-- Service Name -->
            <div>
              <label class="mb-1.5 block text-sm font-medium text-text-secondary">Service Name</label>
              <input
                v-model="form.name"
                type="text"
                placeholder="e.g., Hot Stone Massage 60 mins"
                class="w-full rounded-lg border-0 bg-surface-input px-4 py-3 text-sm text-text-primary outline-none ring-1 ring-transparent placeholder:text-text-muted focus:ring-2 focus:ring-primary-600"
              />
            </div>

            <!-- Category & Price -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="mb-1.5 block text-sm font-medium text-text-secondary">Category</label>
                <select
                  v-model="form.categoryId"
                  class="w-full appearance-none rounded-lg border-0 bg-surface-input px-4 py-3 text-sm text-text-primary outline-none ring-1 ring-transparent focus:ring-2 focus:ring-primary-600"
                >
                  <option value="" disabled>Select</option>
                  <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                </select>
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-text-secondary">Price (VND)</label>
                <input
                  v-model.number="form.price"
                  type="number"
                  class="w-full rounded-lg border-0 bg-surface-input px-4 py-3 text-sm text-text-primary outline-none ring-1 ring-transparent focus:ring-2 focus:ring-primary-600"
                />
              </div>
            </div>

            <!-- Special Label -->
            <div>
              <label class="mb-1.5 block text-sm font-medium text-text-secondary">Special Label</label>
              <div class="flex flex-row gap-6 mt-2">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" v-model="form.isBestSeller" class="rounded border-border text-primary-600 focus:ring-primary-600" />
                  <span class="text-sm text-text-primary">Bestseller</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" v-model="form.isNewService" class="rounded border-border text-primary-600 focus:ring-primary-600" />
                  <span class="text-sm text-text-primary">New Service</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" v-model="form.isCombo" class="rounded border-border text-primary-600 focus:ring-primary-600" />
                  <span class="text-sm text-text-primary">Combo</span>
                </label>
              </div>
            </div>

            <!-- Description -->
            <div>
              <label class="mb-1.5 block text-sm font-medium text-text-secondary">Description</label>
              <textarea
                v-model="form.description"
                rows="3"
                placeholder="Describe the treatment benefits and process..."
                class="w-full resize-none rounded-lg border-0 bg-surface-input px-4 py-3 text-sm text-text-primary outline-none ring-1 ring-transparent placeholder:text-text-muted focus:ring-2 focus:ring-primary-600"
              />
            </div>

            <!-- Duration -->
            <div>
              <label class="mb-1.5 block text-sm font-medium text-text-secondary">Time (Minutes)</label>
              <div class="relative">
                <input
                  v-model.number="form.durationMinutes"
                  type="number"
                  placeholder="60"
                  class="w-full rounded-lg border-0 bg-surface-input px-4 py-3 text-sm text-text-primary outline-none ring-1 ring-transparent placeholder:text-text-muted focus:ring-2 focus:ring-primary-600"
                />
                <span class="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-text-muted">MINS</span>
              </div>
            </div>

            <!-- Status -->
            <div>
              <label class="mb-1.5 block text-sm font-medium text-text-secondary">Status</label>
              <div class="flex gap-3">
                <button
                  :class="['rounded-lg px-4 py-2 text-sm font-bold transition-all', form.isActive ? 'bg-success/10 text-success ring-2 ring-success' : 'bg-surface-input text-text-muted']"
                  @click="form.isActive = true"
                >Active</button>
                <button
                  :class="['rounded-lg px-4 py-2 text-sm font-bold transition-all', !form.isActive ? 'bg-danger/10 text-danger ring-2 ring-danger' : 'bg-surface-input text-text-muted']"
                  @click="form.isActive = false"
                >Inactive</button>
              </div>
            </div>

            <!-- Image Upload -->
            <div>
              <div class="mb-1.5 flex items-center gap-2 text-sm font-medium text-text-secondary">
                <Image class="h-4 w-4" />
                Service Image
              </div>
              <label class="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-surface-input p-8 transition-colors hover:border-primary-600">
                <Upload class="mb-2 h-8 w-8 text-text-muted" />
                <span class="text-sm font-bold text-text-primary">Upload image or drag and drop</span>
                <span class="mt-1 text-xs text-text-muted">Recommended JPG or PNG. Max size 5MB.</span>
                <input type="file" accept="image/*" class="hidden" @change="handleUpload" />
              </label>
              <div v-if="form.imageUrl" class="mt-3 overflow-hidden rounded-xl">
                <img :src="form.imageUrl" alt="Preview" class="h-32 w-full object-cover" />
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="sticky bottom-0 flex gap-3 border-t border-border bg-white p-6">
            <button
              class="flex-1 rounded-xl bg-gradient-to-b from-primary-600 to-[#0048B5] py-3 text-sm font-extrabold text-white shadow-button transition-all hover:brightness-110 disabled:opacity-50"
              :disabled="saving || !form.name"
              @click="saveService()"
            >
              {{ saving ? 'Saving...' : 'Save Service' }}
            </button>
            <button
              class="flex-1 rounded-xl bg-surface-secondary py-3 text-sm font-bold text-text-dim transition-all hover:bg-surface-input"
              @click="resetForm"
            >
              Cancel
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-right-enter-active { transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); }
.slide-right-leave-active { transition: transform 0.2s ease-in; }
.slide-right-enter-from, .slide-right-leave-to { transform: translateX(100%); }
</style>
