<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { RouterLink } from 'vue-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { servicesApi } from '@/api/services.api'
import { categoriesApi } from '@/api/categories.api'
import { uploadApi } from '@/api/upload.api'
import { trafficApi } from '@/api/traffic.api'
import { 
  Plus, Search, Image, X, Upload, Pencil, Trash2, Eye, ChevronDown,
  ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight 
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth.store'
import { useRouter } from 'vue-router'
import { qrConfigApi } from '@/api/qr-config.api'
import { io, type Socket } from 'socket.io-client'
import imgFallback from '@/assets/img_fallback.png'

type SpecialTag = 'must_try' | 'limited_edition' | 'summer_special' | 'happy_hour'
type LabelValue = 'best_seller' | 'new_service' | SpecialTag

const SPECIAL_TAG_OPTIONS: Array<{ value: SpecialTag; label: string }> = [
  { value: 'must_try', label: 'Must Try' },
  { value: 'limited_edition', label: 'Limited Edition' },
  { value: 'summer_special', label: 'Summer Special' },
  { value: 'happy_hour', label: 'Happy Hour' },
]

const LABEL_OPTIONS: Array<{ value: LabelValue; label: string }> = [
  { value: 'best_seller', label: 'Best Seller' },
  { value: 'new_service', label: 'New Service' },
  ...SPECIAL_TAG_OPTIONS,
]

const LABEL_STYLE_MAP: Record<string, { chipActive: string; chipInactive: string; badge: string }> = {
  best_seller: {
    chipActive: 'bg-primary-100 text-primary-700 ring-2 ring-primary-300',
    chipInactive: 'bg-surface-input text-primary-600/80 hover:bg-primary-100',
    badge: 'bg-primary-100 text-primary-700',
  },
  new_service: {
    chipActive: 'bg-primary-100 text-primary-700 ring-2 ring-primary-300',
    chipInactive: 'bg-surface-input text-primary-600/80  hover:bg-primary-100',
    badge: 'bg-primary-100 text-primary-700',
  },
  must_try: {
    chipActive: 'bg-primary-100 text-primary-700 ring-2 ring-primary-300',
    chipInactive: 'bg-surface-input text-primary-600/80  hover:bg-primary-100',
    badge: 'bg-primary-100 text-primary-700',
  },
  limited_edition: {
    chipActive: 'bg-primary-100 text-primary-700 ring-2 ring-primary-300',
    chipInactive: 'bg-surface-input text-primary-600/80  hover:bg-primary-100',
    badge: 'bg-primary-100 text-primary-700',
  },
  summer_special: {
    chipActive: 'bg-primary-100 text-primary-700 ring-2 ring-primary-300',
    chipInactive: 'bg-surface-input text-primary-600/80  hover:bg-primary-100',
    badge: 'bg-primary-100 text-primary-700',
  },
  happy_hour: {
    chipActive: 'bg-primary-100 text-primary-700 ring-2 ring-primary-300',
    chipInactive: 'bg-surface-input text-primary-600/80  hover:bg-primary-100',
    badge: 'bg-primary-100 text-primary-700',
  },
}

const router = useRouter()
import Toast from '@/components/Toast.vue'
const authStore = useAuthStore()

const queryClient = useQueryClient()
let trafficSocket: Socket | null = null

const showForm = ref(false)
const editingService = ref<any>(null)
const searchInput = ref('')
const searchQuery = ref('')
const selectedStatus = ref('')
const selectedCategory = ref('')
const selectedSort = ref<'newest' | 'oldest'>('newest')
const openFilter = ref<'status' | 'category' | 'sort' | null>(null)
const filterPanelRef = ref<HTMLElement | null>(null)
const page = ref(1)
const PAGE_SIZE = 20
const formError = ref('')
const priceFromInput = ref('')
const priceToInput = ref('')
const formLoading = ref(false)
const fieldErrors = ref({
  name: '',
  categoryId: '',
  price: '',
  imageUrl: '',
  variantOptions: '',
})
const formCategoryOpen = ref(false)

const toast = ref({ show: false, message: '', type: 'success' as 'success' | 'danger' | 'warning' })
const showConflictDialog = ref(false)
const existingService = ref<any>(null)
const uploadLoading = ref(false)

const MAX_IMAGE_SIZE_MB = 5
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024

function showToast(message: string, type: 'success' | 'danger' | 'warning' = 'success') {
  toast.value = { show: true, message, type }
}

function handleImgError(e: Event) {
  const target = e.target as HTMLImageElement
  if (target.src !== imgFallback) {
    target.src = imgFallback
  }
}

function getApiErrorMessage(err: any, fallback: string): string {
  const raw = err?.response?.data?.message
  if (Array.isArray(raw)) {
    const normalized = raw.map((item) => String(item || '').trim()).filter(Boolean)
    return normalized[0] || fallback
  }
  if (typeof raw === 'string' && raw.trim()) return raw
  if (typeof err?.message === 'string' && err.message.trim()) return err.message
  return fallback
}

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

watch(selectedSort, () => {
  page.value = 1
})

const statusLabel = computed(() => {
  if (selectedStatus.value === 'true') return 'Active'
  if (selectedStatus.value === 'false') return 'Inactive'
  return 'All Status'
})

const categoryLabel = computed(() => {
  if (!selectedCategory.value) return 'All Categories'
  const category = categories.value?.find((c: any) => c.id === selectedCategory.value)
  return category?.name || 'All Categories'
})

const sortLabel = computed(() => (selectedSort.value === 'oldest' ? 'Oldest First' : 'Newest First'))

const formCategoryLabel = computed(() => {
  if (!form.value.categoryId) return 'Select Category'
  const cat = categories.value?.find((c: any) => c.id === form.value.categoryId)
  return cat?.name || 'Select Category'
})

function toggleFilter(name: 'status' | 'category' | 'sort') {
  openFilter.value = openFilter.value === name ? null : name
}

function setStatusFilter(value: string) {
  selectedStatus.value = value
  openFilter.value = null
}

function setCategoryFilter(value: string) {
  selectedCategory.value = value
  openFilter.value = null
}

function setSortFilter(value: 'newest' | 'oldest') {
  selectedSort.value = value
  openFilter.value = null
}

function handleDocumentClick(event: MouseEvent) {
  const target = event.target as Node | null
  if (filterPanelRef.value && !filterPanelRef.value.contains(target)) {
    openFilter.value = null
  }
  // Close form category dropdown if clicking outside its elements
  if (formCategoryOpen.value && target && !(target as HTMLElement).closest('.filter-trigger') && !(target as HTMLElement).closest('.filter-menu')) {
    formCategoryOpen.value = false
  }
}

// Form state
const form = ref({
  name: '',
  shortDescription: '',
  categoryId: '',
  price: 0,
  priceFrom: undefined as number | undefined,
  priceTo: undefined as number | undefined,
  description: '',
  durationMinutes: 0,
  imageUrl: '',
  hasVariants: false,
  variantOptions: [] as Array<{ name: string; price: number }>,
  isBestSeller: false,
  isNewService: false,
  isCombo: false,
  specialTags: [] as string[],
  isActive: true,
})

const servicesQueryKey = computed(() => [
  'services',
  searchQuery.value,
  selectedStatus.value,
  selectedCategory.value,
  selectedSort.value,
])

const { data: services, isLoading: loadingServices } = useQuery({
  queryKey: servicesQueryKey,
  queryFn: async () => {
    const baseParams: any = {
      search: searchQuery.value.trim() || undefined,
      categoryId: selectedCategory.value || undefined,
    }

    const pageSize = 100
    let currentPage = 1
    let totalPages = 1
    const allItems: any[] = []

    while (currentPage <= totalPages) {
      const { data } = await servicesApi.getAll({
        ...baseParams,
        page: currentPage,
        limit: pageSize,
      })

      const payload = (data as any)?.data || data
      const items = Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload)
          ? payload
          : []

      allItems.push(...items)

      const nextTotalPages = Number(payload?.totalPages || 1)
      totalPages = Number.isFinite(nextTotalPages) && nextTotalPages > 0 ? nextTotalPages : 1
      currentPage += 1
    }

    return {
      items: allItems,
      total: allItems.length,
      totalPages: Math.ceil(allItems.length / PAGE_SIZE),
    }
  },
  refetchOnWindowFocus: false,
})

const processedServices = computed(() => {
  const source = Array.isArray((services.value as any)?.items)
    ? [...(services.value as any).items]
    : []

  const byStatus = source.filter((svc: any) => {
    if (selectedStatus.value === 'true') return !!svc?.isActive
    if (selectedStatus.value === 'false') return !svc?.isActive
    return true
  })

  byStatus.sort((a: any, b: any) => {
    const aTime = new Date(a?.createdAt || 0).getTime()
    const bTime = new Date(b?.createdAt || 0).getTime()
    return selectedSort.value === 'oldest' ? aTime - bTime : bTime - aTime
  })

  return byStatus
})

const servicesView = computed(() => {
  const total = processedServices.value.length
  const totalPages = total > 0 ? Math.ceil(total / PAGE_SIZE) : 0
  const start = (page.value - 1) * PAGE_SIZE
  const end = start + PAGE_SIZE

  return {
    items: processedServices.value.slice(start, end),
    total,
    totalPages,
  }
})

watch(servicesView, (next) => {
  if (next.totalPages > 0 && page.value > next.totalPages) {
    page.value = next.totalPages
  }
  if (next.totalPages === 0 && page.value !== 1) {
    page.value = 1
  }
})

const { data: categories, isLoading: loadingCategories } = useQuery({
  queryKey: ['categories'],
  queryFn: async () => {
    const { data } = await categoriesApi.getAll()
    return data.data
  },
  staleTime: 60000,
  refetchOnWindowFocus: false,
})

const { data: trafficData, isLoading: loadingTraffic } = useQuery({
  queryKey: ['traffic-dashboard'],
  queryFn: async () => {
    const { data } = await trafficApi.getDashboard()
    return data.data
  },
  refetchOnWindowFocus: false,
})

function connectTrafficSocket(adminId: string) {
  if (trafficSocket?.connected) {
    trafficSocket.emit('dashboard:subscribe', { adminId })
    return
  }

  const token = localStorage.getItem('qr_home_token') || ''
  trafficSocket = io('/traffic', {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    auth: { token },
    withCredentials: true,
  })

  trafficSocket.on('connect', () => {
    trafficSocket?.emit('dashboard:subscribe', { adminId })
  })

  trafficSocket.on('traffic:dashboard-updated', (payload: any) => {
    if (!payload?.dashboard) return
    if (String(payload?.adminId || '') !== adminId) return
    queryClient.setQueryData(['traffic-dashboard'], payload.dashboard)
  })
}

watch(
  () => authStore.admin?.id,
  (adminId) => {
    const normalized = String(adminId || '').trim()
    if (!normalized) return
    connectTrafficSocket(normalized)
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick, true)
  trafficSocket?.disconnect()
  trafficSocket = null
})

onMounted(() => {
  document.addEventListener('click', handleDocumentClick, true)
})

const { data: qrConfig } = useQuery({
  queryKey: ['qr-config'],
  queryFn: async () => {
    const { data } = await qrConfigApi.getConfig()
    return (data as any).data || data
  },
  staleTime: 60000,
  refetchOnWindowFocus: false,
})

const currencyUnit = computed<'VND' | 'USD' | 'EUR'>(() => {
  const raw = String((qrConfig.value as any)?.currencyUnit || (qrConfig.value as any)?.currency || 'VND').toUpperCase()
  if (raw === 'USD' || raw === 'DOLLAR') return 'USD'
  if (raw === 'EUR' || raw === 'EURO') return 'EUR'
  return 'VND'
})

const formattedGrowth = computed(() => {
  const percent = trafficData.value?.growth?.growthPercent
  if (percent == null) return { text: '0%', class: 'text-text-secondary' }
  if (percent > 0) return { text: `+${percent.toFixed(1)}%`, class: 'text-success' }
  if (percent < 0) return { text: `${percent.toFixed(1)}%`, class: 'text-danger' }
  return { text: '0%', class: 'text-text-secondary' }
})

const growthTone = computed(() => {
  const percent = trafficData.value?.growth?.growthPercent
  if (percent == null || percent === 0) {
    return {
      bg: 'bg-[#E8F0FF]',
      icon: 'text-[#0048B5]',
    }
  }
  if (percent > 0) {
    return {
      bg: 'bg-emerald-100',
      icon: 'text-emerald-600',
    }
  }
  return {
    bg: 'bg-red-100',
    icon: 'text-red-600',
  }
})

const { mutate: saveService, isPending: saving } = useMutation({
  mutationFn: async () => {
    formError.value = ''
    fieldErrors.value = { name: '', categoryId: '', price: '', imageUrl: '', variantOptions: '' }

    if (!String(form.value.name || '').trim()) {
      fieldErrors.value.name = 'Service name is required'
      throw new Error('Service name is required')
    }

    if (!form.value.categoryId) {
      fieldErrors.value.categoryId = 'Please select category'
      throw new Error('Please select category')
    }

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
        fieldErrors.value.variantOptions = 'Please add at least one variant option'
        throw new Error('Please add at least one variant option')
      }

      options.forEach((opt) => {
        if (!opt.name) {
          fieldErrors.value.variantOptions = 'Variant option name is required'
          throw new Error('Variant option name is required')
        }
        if (!Number.isFinite(opt.price) || opt.price <= 0) {
          fieldErrors.value.variantOptions = 'Variant option price must be greater than 0'
          throw new Error('Variant option price must be greater than 0')
        }
      })

      normalizedPrice = Math.min(...options.map((opt) => opt.price))
      form.value.variantOptions = options
    } else {
      if (priceFrom === undefined) {
        fieldErrors.value.price = 'Price from is required'
        throw new Error('Price from is required')
      }

      if (Number(priceFrom) <= 0) {
        fieldErrors.value.price = 'Price must be greater than 0'
        throw new Error('Price must be greater than 0')
      }

      if (priceTo !== undefined && Number(priceTo) <= 0) {
        fieldErrors.value.price = 'Price must be greater than 0'
        throw new Error('Price must be greater than 0')
      }

      if (priceTo !== undefined && Number(priceFrom) >= Number(priceTo)) {
        fieldErrors.value.price = 'Price from must be less than price to'
        throw new Error('Price from must be less than price to')
      }

      normalizedPrice = Number(priceFrom)
    }

    const payload = {
      ...form.value,
      isCombo: false,
      price: normalizedPrice,
      priceFrom,
      priceTo,
      imageUrl: form.value.imageUrl || imgFallback,
      variantOptions: hasVariants ? form.value.variantOptions : undefined,
    }

    if (editingService.value) {
      const { data } = await servicesApi.update(editingService.value.id, payload)
      return data
    } else {
      const { data } = await servicesApi.create(payload)
      return data
    }
  },
  onSuccess: async () => {
    const justCreated = !editingService.value

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['services'] }),
      queryClient.invalidateQueries({ queryKey: ['nav-services-count'] }),
      queryClient.invalidateQueries({ queryKey: ['public-services'] }),
      queryClient.invalidateQueries({ queryKey: ['public-categories'] }),
    ])

    if (justCreated) {
      // Keep newly-created items visible in the current list view.
      if (selectedSort.value === 'oldest') {
        selectedSort.value = 'newest'
      }
      page.value = 1
    }

    const hasActiveFilters =
      selectedStatus.value === 'false' ||
      !!selectedCategory.value ||
      !!searchQuery.value.trim()

    showToast('Service saved successfully', 'success')
    if (justCreated && hasActiveFilters) {
      showToast('Service was created, but current filters may hide it from the list.', 'warning')
    }
    resetForm()
    
    // Auto QR generation if needed
    const { data: servicesData } = await servicesApi.getAll({ limit: 1 })
    const items = (servicesData as any).data?.items || servicesData.data
    const total = (servicesData as any).data?.total || items?.length || 0
    
    if (total >= 1) { 
      try {
        await qrConfigApi.generate()
      } catch (err) {
        console.error('Auto QR failed:', err)
      }
    }
  },
  onError: (err: any) => {
    const errorData = err.response?.data
    if (err.response?.status === 409 && errorData?.existingService) {
      existingService.value = errorData.existingService
      showConflictDialog.value = true
      return
    }
    const message = getApiErrorMessage(err, 'Failed to save service')
    formError.value = message
    showToast(message, 'danger')
  },
})

function handleConflictYes() {
  if (existingService.value) {
    openEdit(existingService.value)
  }
  showConflictDialog.value = false
}

function handleConflictNo() {
  showConflictDialog.value = false
}

const { mutate: deleteService } = useMutation({
  mutationFn: (id: string) => servicesApi.delete(id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['services'] })
    queryClient.invalidateQueries({ queryKey: ['nav-services-count'] })
    queryClient.invalidateQueries({ queryKey: ['public-services'] })
    queryClient.invalidateQueries({ queryKey: ['public-categories'] })
  },
})

const { mutate: toggleStatus } = useMutation({
  mutationFn: (svc: any) =>
    servicesApi.update(svc.id, { isActive: !svc.isActive }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['services'] })
    queryClient.invalidateQueries({ queryKey: ['public-services'] })
    queryClient.invalidateQueries({ queryKey: ['public-categories'] })
  },
})

function openCreate() {
  editingService.value = null
  formLoading.value = false
  form.value = {
    name: '',
    shortDescription: '',
    categoryId: '',
    price: 0,
    priceFrom: undefined,
    priceTo: undefined,
    description: '',
    durationMinutes: 60,
    imageUrl: '',
    hasVariants: false,
    variantOptions: [],
    isBestSeller: false,
    isNewService: false,
    isCombo: false,
    specialTags: [],
    isActive: true,
  }
  priceFromInput.value = ''
  priceToInput.value = ''
  formError.value = ''
  fieldErrors.value = { name: '', categoryId: '', price: '', imageUrl: '', variantOptions: '' }
  showForm.value = true
}

async function openEdit(svc: any) {
  editingService.value = svc
  formError.value = ''
  fieldErrors.value = { name: '', categoryId: '', price: '', imageUrl: '', variantOptions: '' }
  formLoading.value = true
  showForm.value = true

  try {
    const { data } = await servicesApi.getOne(svc.id)
    const detail = (data as any).data || data

    form.value = {
      name: detail.name || '',
      shortDescription: detail.shortDescription || '',
      categoryId: detail.categoryId || '',
      price: detail.price ? Number(detail.price) : 0,
      priceFrom: detail.priceFrom != null ? Number(detail.priceFrom) : undefined,
      priceTo: detail.priceTo != null ? Number(detail.priceTo) : undefined,
      description: detail.description || '',
      durationMinutes: detail.durationMinutes || 60,
      imageUrl: detail.imageUrl || '',
      hasVariants: !!detail.hasVariants,
      variantOptions: Array.isArray(detail.variantOptions)
        ? detail.variantOptions.map((opt: any) => ({
            name: opt?.name || '',
            price: Number(opt?.price) || 0,
          }))
        : [],
      isBestSeller: !!detail.isBestSeller,
      isNewService: !!detail.isNewService,
      isCombo: false,
      specialTags: Array.isArray(detail.specialTags) ? detail.specialTags : [],
      isActive: detail.isActive !== undefined ? detail.isActive : true,
    }
    priceFromInput.value = form.value.priceFrom != null ? String(form.value.priceFrom) : ''
    priceToInput.value = form.value.priceTo != null ? String(form.value.priceTo) : ''
  } catch (err: any) {
    formError.value = err?.message || 'Failed to load service detail'
    showToast(formError.value, 'danger')
  } finally {
    formLoading.value = false
  }
}

function resetForm() {
  showForm.value = false
  editingService.value = null
  formError.value = ''
  fieldErrors.value = { name: '', categoryId: '', price: '', imageUrl: '', variantOptions: '' }
  formLoading.value = false
}

function parseOptionalNumber(value: string | number | null | undefined): number | undefined {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return undefined
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : undefined
}

function toggleTag(value: SpecialTag) {
  const tags = new Set(form.value.specialTags || [])
  if (tags.has(value)) tags.delete(value)
  else tags.add(value)
  form.value.specialTags = Array.from(tags)
}

function hasTag(value: SpecialTag) {
  return (form.value.specialTags || []).includes(value)
}

function toggleLabel(value: LabelValue) {
  if (value === 'best_seller') {
    form.value.isBestSeller = !form.value.isBestSeller
    return
  }
  if (value === 'new_service') {
    form.value.isNewService = !form.value.isNewService
    return
  }
  toggleTag(value)
}

function isLabelActive(value: LabelValue) {
  if (value === 'best_seller') return !!form.value.isBestSeller
  if (value === 'new_service') return !!form.value.isNewService
  return hasTag(value)
}

function getLabelChipClass(value: LabelValue) {
  const style = LABEL_STYLE_MAP[value]
  if (!style) return isLabelActive(value) ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-300' : 'bg-surface-input text-text-muted hover:bg-surface-page'
  return isLabelActive(value) ? style.chipActive : style.chipInactive
}

function getLabelBadgeClass(value: string) {
  return LABEL_STYLE_MAP[value]?.badge || 'bg-primary-100 text-primary-700'
}

function addVariantOption() {
  form.value.variantOptions = [...(form.value.variantOptions || []), { name: '', price: 0 }]
}

function removeVariantOption(index: number) {
  const list = [...(form.value.variantOptions || [])]
  list.splice(index, 1)
  form.value.variantOptions = list
}

async function handleUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  const isImage = String(file.type || '').startsWith('image/')
  if (!isImage) {
    showToast('Only image files are allowed (JPG, PNG, WEBP, ...).', 'danger')
    ;(e.target as HTMLInputElement).value = ''
    return
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    showToast(`Image is too large. Max size is ${MAX_IMAGE_SIZE_MB}MB.`, 'danger')
    ;(e.target as HTMLInputElement).value = ''
    return
  }

  uploadLoading.value = true
  try {
    const { data } = await uploadApi.upload(file)
    const imageUrl = data.data?.url || ''
    if (!imageUrl) {
      showToast('Upload failed: server did not return an image URL.', 'danger')
      return
    }
    form.value.imageUrl = imageUrl
    showToast('Image uploaded successfully.', 'success')
  } catch (err: any) {
    const message =
      err?.response?.data?.message ||
      err?.message ||
      'Image upload failed. Please try again.'
    showToast(String(message), 'danger')
  } finally {
    uploadLoading.value = false
    ;(e.target as HTMLInputElement).value = ''
  }
}

function formatPrice(p: number) {
  const value = Number(p || 0)
  const locale = currencyUnit.value === 'VND' ? 'vi-VN' : 'en-US'
  const formatted = new Intl.NumberFormat(locale).format(value)
  if (currencyUnit.value === 'USD') return `$${formatted}`
  if (currencyUnit.value === 'EUR') return `€${formatted}`
  return `${formatted} VND`
}

function formatPriceRange(from: number, to: number) {
  if (currencyUnit.value === 'USD') return `$${new Intl.NumberFormat('en-US').format(from)} - $${new Intl.NumberFormat('en-US').format(to)}`
  if (currencyUnit.value === 'EUR') return `€${new Intl.NumberFormat('en-US').format(from)} - €${new Intl.NumberFormat('en-US').format(to)}`
  return `${new Intl.NumberFormat('vi-VN').format(from)} - ${new Intl.NumberFormat('vi-VN').format(to)} VND`
}

function getServiceDisplayPrice(svc: any) {
  if (svc?.hasVariants && Array.isArray(svc?.variantOptions) && svc.variantOptions.length) {
    const prices = svc.variantOptions
      .map((opt: any) => Number(opt?.price))
      .filter((p: number) => Number.isFinite(p) && p > 0)

    if (prices.length) {
      const min = Math.min(...prices)
      const max = Math.max(...prices)
      if (min !== max) return formatPriceRange(min, max)
      return formatPrice(min)
    }
  }

  const from = parseOptionalNumber(svc?.priceFrom)
  const to = parseOptionalNumber(svc?.priceTo)

  if (from !== undefined && to !== undefined) return formatPriceRange(from, to)

  if (from !== undefined) return formatPrice(from)
  if (to !== undefined) return formatPrice(to)

  return formatPrice(Number(svc?.price || 0))
}

function getCategoryName(catId: string) {
  return categories.value?.find((c: any) => c.id === catId)?.name || '—'
}

function formatTagLabel(tag: string) {
  return tag
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function getServiceLabelItems(svc: any) {
  const labels: Array<{ key: string; label: string }> = []
  if (svc?.isBestSeller) labels.push({ key: 'best_seller', label: 'Best Seller' })
  if (svc?.isNewService) labels.push({ key: 'new_service', label: 'New Service' })
  if (Array.isArray(svc?.specialTags)) {
    svc.specialTags.forEach((tag: string) => {
      const normalizedTag = String(tag || '').trim()
      if (normalizedTag) labels.push({ key: normalizedTag, label: formatTagLabel(normalizedTag) })
    })
  }
  const seen = new Set<string>()
  return labels.filter((item) => {
    if (seen.has(item.key)) return false
    seen.add(item.key)
    return true
  })
}

const displayedPages = computed(() => {
  const total = servicesView.value.totalPages
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const current = page.value
  const range = []
  if (current <= 4) {
    range.push(1, 2, 3, '...', total)
  } else if (current >= total - 3) {
    range.push(1, '...', total - 2, total - 1, total)
  } else {
    range.push(1, '...', current - 1, current, current + 1, '...', total)
  }
  return range
})

const pageLoading = computed(() => loadingServices.value || loadingTraffic.value)
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-4xl font-bold tracking-tight text-text-primary">Service Management</h2>
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
    <div v-if="pageLoading" class="mb-10 grid gap-6 grid-cols-1 sm:grid-cols-3">
      <div v-for="i in 3" :key="`stats-skeleton-${i}`" class="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div class="h-4 w-24 rounded bg-surface-input animate-pulse"></div>
        <div class="mt-4 h-8 w-16 rounded bg-surface-input animate-pulse"></div>
      </div>
    </div>
    <div v-else class="mb-10 grid gap-6 grid-cols-1 sm:grid-cols-3">
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
          <p class="text-3xl font-black text-text-primary">{{ servicesView.total || 0 }}</p>
        </div>
      </div>

      <!-- Service Views -->
      <div class="flex items-center gap-4 rounded-2xl border border-border bg-white p-6 shadow-sm transition-shadow hover:shadow-card">
        <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100">
          <svg class="h-8 w-8 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="12" cy="12" r="3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div>
          <p class="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Today Service Views</p>
          <p class="text-3xl font-black text-text-primary">{{ ((trafficData as any)?.todayServiceViews ?? 0).toLocaleString() }}</p>
        </div>
      </div>

      <!-- Growth -->
      <div class="flex items-center gap-4 rounded-2xl border border-border bg-white p-6 shadow-sm transition-shadow hover:shadow-card">
        <div :class="['flex h-16 w-16 items-center justify-center rounded-2xl', growthTone.bg]">
          <svg :class="['h-8 w-8', growthTone.icon]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
      <div ref="filterPanelRef" class="grid  grid-cols-1 gap-3 sm:grid-cols-[minmax(240px,1fr)_120px_160px_160px] sm:items-center sm:gap-4">
        <div class="relative min-w-0">
          <Search class="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            v-model="searchInput"
            type="text"
            placeholder="Search services..."
            class="w-full rounded-full border border-border bg-white py-2.5 pl-11 pr-4 text-sm font-medium text-text-primary shadow-sm outline-none placeholder:text-text-muted focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <div class="relative min-w-0">
          <button type="button" class="filter-trigger" @click="toggleFilter('status')">
            <span class="truncate">{{ statusLabel }}</span>
            <ChevronDown :class="['h-4 w-4 text-text-muted transition-transform duration-200', openFilter === 'status' ? 'rotate-180' : '']" />
          </button>
          <Transition name="fade-down">
            <div v-if="openFilter === 'status'" class="filter-menu">
              <button type="button" :class="['filter-option', !selectedStatus ? 'filter-option-active' : '']" @click="setStatusFilter('')">All Status</button>
              <button type="button" :class="['filter-option', selectedStatus === 'true' ? 'filter-option-active' : '']" @click="setStatusFilter('true')">Active</button>
              <button type="button" :class="['filter-option', selectedStatus === 'false' ? 'filter-option-active' : '']" @click="setStatusFilter('false')">Inactive</button>
            </div>
          </Transition>
        </div>
        <div class="relative min-w-0">
          <button type="button" class="filter-trigger" @click="toggleFilter('category')">
            <span class="truncate">{{ categoryLabel }}</span>
            <ChevronDown :class="['h-4 w-4 text-text-muted transition-transform duration-200', openFilter === 'category' ? 'rotate-180' : '']" />
          </button>
          <Transition name="fade-down">
            <div v-if="openFilter === 'category'" class="filter-menu">
              <button type="button" :class="['filter-option', !selectedCategory ? 'filter-option-active' : '']" @click="setCategoryFilter('')">All Categories</button>
              <button v-for="cat in categories" :key="cat.id" type="button" :class="['filter-option', selectedCategory === cat.id ? 'filter-option-active' : '']" @click="setCategoryFilter(cat.id)">{{ cat.name }}</button>
            </div>
          </Transition>
        </div>
        <div class="relative min-w-0">
          <button type="button" class="filter-trigger" @click="toggleFilter('sort')">
            <span class="truncate">{{ sortLabel }}</span>
            <ChevronDown :class="['h-4 w-4 text-text-muted transition-transform duration-200', openFilter === 'sort' ? 'rotate-180' : '']" />
          </button>
          <Transition name="fade-down">
            <div v-if="openFilter === 'sort'" class="filter-menu">
              <button type="button" :class="['filter-option', selectedSort === 'newest' ? 'filter-option-active' : '']" @click="setSortFilter('newest')">Newest First</button>
              <button type="button" :class="['filter-option', selectedSort === 'oldest' ? 'filter-option-active' : '']" @click="setSortFilter('oldest')">Oldest First</button>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <!-- Services Grid -->
    <div v-if="loadingServices" class="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <div
        v-for="i in 4"
        :key="`svc-skeleton-${i}`"
        class="relative flex items-center overflow-hidden rounded-[24px] bg-white p-5 shadow-sm ring-1 ring-border"
      >
        <div class="h-32 w-32 flex-shrink-0 rounded-[20px] bg-surface-input animate-pulse"></div>
        <div class="ml-5 flex flex-1 flex-col gap-3">
          <div class="h-5 w-2/3 rounded bg-surface-input animate-pulse"></div>
          <div class="h-3 w-1/3 rounded bg-surface-input animate-pulse"></div>
          <div class="h-3 w-full rounded bg-surface-input animate-pulse"></div>
          <div class="h-3 w-5/6 rounded bg-surface-input animate-pulse"></div>
          <div class="mt-3 h-6 w-28 rounded bg-surface-input animate-pulse"></div>
        </div>
      </div>
    </div>
    <div v-else-if="!servicesView.items.length" class="flex flex-col items-center justify-center rounded-3xl bg-white py-20 text-center shadow-card">
      <div class="mb-4 text-5xl opacity-50">💇‍♀️</div>
      <p class="text-lg font-bold text-text-primary">No services found</p>
      <p class="mt-1 text-sm text-text-muted">Adjust your filters or add a new service.</p>
    </div>
    <div v-else class="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <div
        v-for="svc in servicesView.items"
        :key="svc.id"
        class="group relative flex items-center overflow-hidden rounded-[24px] bg-white p-5 shadow-sm ring-1 ring-border transition-all hover:shadow-card"
      >
        <!-- Horizontal Image -->
        <div class="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-[20px] bg-surface-input">
          <img
            :src="svc.imageUrl || imgFallback"
            :alt="svc.name"
            class="h-full w-full object-cover"
            @error="handleImgError"
          />
          
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
              <span
                v-for="label in getServiceLabelItems(svc)"
                :key="label.key"
                :class="['rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider', getLabelBadgeClass(label.key)]"
              >
                {{ label.label }}
              </span>
            </div>

            <p class="mt-2 line-clamp-2 text-sm leading-relaxed text-text-secondary">
              {{ svc.shortDescription || svc.description || 'No description provided.' }}
            </p>
          </div>
          
          <div class="mt-3 flex items-center justify-between">
            <div>
              <span class="text-xl font-black text-[#0048B5]">{{ getServiceDisplayPrice(svc) }}</span>
            </div>
            <button
              @click="toggleStatus(svc)"
              :class="[
                'relative h-6 w-10 rounded-full transition-colors duration-300',
                svc.isActive ? 'bg-primary-600' : 'bg-surface-input ring-1 ring-inset ring-border'
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
    <div v-if="servicesView.totalPages > 1" class="mt-8 flex items-center justify-center gap-2">
      <!-- First -->
      <button 
        :disabled="page === 1" 
        @click="page = 1" 
        class="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-secondary text-text-muted transition-all hover:bg-surface-input disabled:opacity-30"
      >
        <ChevronsLeft class="h-4 w-4" />
      </button>

      <!-- Previous -->
      <button 
        :disabled="page === 1" 
        @click="page--" 
        class="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-secondary text-text-muted transition-all hover:bg-surface-input disabled:opacity-30"
      >
        <ChevronLeft class="h-4 w-4" />
      </button>

      <!-- Page Numbers -->
      <button 
        v-for="p in displayedPages" 
        :key="p === '...' ? 'dot-' + Math.random() : p"
        :disabled="p === '...'"
        @click="typeof p === 'number' ? page = p : null"
        :class="[
          'flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold transition-all',
          p === page 
            ? 'bg-primary-600 text-white shadow-button ring-1 ring-primary-400' 
            : p === '...' 
              ? 'text-text-muted cursor-default' 
              : 'bg-surface-secondary text-text-secondary hover:bg-surface-input'
        ]"
      >
        {{ p }}
      </button>

      <!-- Next -->
      <button 
        :disabled="page === servicesView.totalPages" 
        @click="page++" 
        class="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-secondary text-text-muted transition-all hover:bg-surface-input disabled:opacity-30"
      >
        <ChevronRight class="h-4 w-4" />
      </button>

      <!-- Last -->
      <button 
        :disabled="page === servicesView.totalPages" 
        @click="page = servicesView.totalPages" 
        class="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-secondary text-text-muted transition-all hover:bg-surface-input disabled:opacity-30"
      >
        <ChevronsRight class="h-4 w-4" />
      </button>
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

          <div v-if="formLoading" class="space-y-4 p-6">
            <div class="h-10 w-full rounded-lg bg-surface-input animate-pulse"></div>
            <div class="h-10 w-full rounded-lg bg-surface-input animate-pulse"></div>
            <div class="h-20 w-full rounded-lg bg-surface-input animate-pulse"></div>
            <div class="h-10 w-full rounded-lg bg-surface-input animate-pulse"></div>
            <div class="h-24 w-full rounded-2xl bg-surface-input animate-pulse"></div>
          </div>

          <div v-else class="space-y-6 p-6">
            <!-- Service Name -->
            <div>
              <label class="mb-1.5 block text-sm font-medium text-text-secondary">Service Name</label>
              <input
                v-model="form.name"
                type="text"
                placeholder="e.g., Hot Stone Massage 60 mins"
                class="w-full rounded-lg border-0 bg-surface-input px-4 py-3 text-sm text-text-primary outline-none ring-1 ring-transparent placeholder:text-text-muted focus:ring-2 focus:ring-primary-600"
              />
              <p v-if="fieldErrors.name" class="mt-1 text-xs font-medium text-danger">{{ fieldErrors.name }}</p>
            </div>

            <!-- Category -->
            <div>
              <label class="mb-1.5 block text-sm font-medium text-text-secondary">Category</label>
              <div class="relative">
                <button 
                  type="button" 
                  class="w-full text-left"
                  style="
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        border-radius: 0.95rem;
                        padding: 0.7rem 0.95rem;
                        font-size: 0.84rem;
                        font-weight: 400;
                        color: black;
                        box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
                        outline: none;
                        transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;"
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
                      {{ cat.name }}
                    </button>
                  </div>
                </Transition>
              </div>
            </div>

            <!-- Product Variants Toggle -->
            <div class="rounded-xl border border-border p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-semibold text-text-primary">Product Variants</p>
                  <p class="text-xs text-text-muted">Enable if this service has different options</p>
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
              <label class="mb-1.5 block text-sm font-medium text-text-secondary">Price</label>
              <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <input
                  v-model="priceFromInput"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Price from"
                  class="w-full rounded-lg border-0 bg-surface-input px-4 py-3 text-sm text-text-primary outline-none ring-1 ring-transparent focus:ring-2 focus:ring-primary-600"
                />
                <span class="text-base font-bold text-text-secondary">-</span>
                <input
                  v-model="priceToInput"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Price to (optional)"
                  class="w-full rounded-lg border-0 bg-surface-input px-4 py-3 text-sm text-text-primary outline-none ring-1 ring-transparent focus:ring-2 focus:ring-primary-600"
                />
              </div>
              <p v-if="fieldErrors.price" class="mt-1 text-xs font-medium text-danger">{{ fieldErrors.price }}</p>
            </div>

            <div v-else class="space-y-3">
              <label class="mb-1.5 block text-sm font-medium text-text-secondary">Variant Options</label>
              <div
                v-for="(opt, idx) in form.variantOptions"
                :key="idx"
                class="grid grid-cols-[1fr_120px_32px] gap-3"
              >
                <input
                  v-model="opt.name"
                  type="text"
                  placeholder="Option Name (e.g., 60 mins)"
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
                  @click="removeVariantOption(idx)"
                >
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
              <button
                type="button"
                class="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface-input py-2.5 text-sm font-semibold text-text-primary hover:bg-surface-page"
                @click="addVariantOption"
              >
                <Plus class="h-4 w-4" /> Add Option
              </button>
              <p v-if="fieldErrors.variantOptions" class="text-xs font-medium text-danger">{{ fieldErrors.variantOptions }}</p>
            </div>

            <!-- Special Label -->
            <div>
              <label class="mb-1.5 block text-sm font-medium text-text-secondary">Special Label</label>
              <div class="mt-2 flex flex-wrap gap-2">
                <button
                  v-for="item in LABEL_OPTIONS"
                  :key="item.value"
                  type="button"
                  class="rounded-lg px-4 py-2 text-sm font-bold transition-all"
                  :class="getLabelChipClass(item.value)"
                  @click="toggleLabel(item.value)"
                >
                  {{ item.label }}
                </button>
              </div>
            </div>

            <!-- Short Description -->
            <div>
              <label class="mb-1.5 block text-sm font-medium text-text-secondary">Short Description</label>
              <textarea
                v-model="form.shortDescription"
                rows="2"
                placeholder="Short summary shown on service card..."
                class="w-full resize-none rounded-lg border-0 bg-surface-input px-4 py-3 text-sm text-text-primary outline-none ring-1 ring-transparent placeholder:text-text-muted focus:ring-2 focus:ring-primary-600"
              />
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
                <span class="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-text-muted"></span>
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
                  :class="['rounded-lg px-4 py-2 text-sm font-bold transition-all', !form.isActive ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-300' : 'bg-surface-input text-text-muted']"
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
                <span class="text-sm font-bold text-text-primary">{{ uploadLoading ? 'Uploading image...' : 'Upload image or drag and drop' }}</span>
                <span class="mt-1 text-xs text-text-muted">Recommended JPG/PNG/WEBP. Max size 5MB.</span>
                <input type="file" accept="image/*" class="hidden" @change="handleUpload" />
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
          <p v-if="formError" class="px-6 pb-5 text-sm font-medium text-danger">{{ formError }}</p>
        </div>
      </Transition>
    </Teleport>

    <Toast 
      :show="toast.show" 
      :message="toast.message" 
      :type="toast.type" 
      @close="toast.show = false" 
    />

    <!-- Conflict Confirmation Dialog -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showConflictDialog" class="fixed inset-0 z-[60] bg-black/30" @click="showConflictDialog = false" />
      </Transition>
      <Transition name="scale-up-center">
        <div v-if="showConflictDialog" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div class="w-full max-w-sm rounded-[32px] bg-white p-8 text-center shadow-popup" @click.stop>
            <div class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-warning/10 text-warning">
              <svg class="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 8V21H3V8" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M23 3H1V8H23V3Z" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M10 12H14" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <h3 class="mb-2 text-xl font-bold text-text-primary">Service {{ form.name }} is exist</h3>
            <p class="mb-8 text-sm text-text-secondary">Do you want to change it?</p>
            
            <div class="flex gap-3">
              <button
                class="flex-1 rounded-2xl bg-gradient-to-b from-primary-600 to-[#0048B5] py-3 text-sm font-extrabold text-white shadow-button transition-all hover:brightness-110"
                @click="handleConflictYes"
              >
                Yes, edit it
              </button>
              <button
                class="flex-1 rounded-2xl bg-surface-secondary py-3 text-sm font-bold text-text-dim transition-all hover:bg-surface-input"
                @click="handleConflictNo"
              >
                No, cancel
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.scale-up-center-enter-active { transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1); }
.scale-up-center-leave-active { transition: all 0.15s ease-in; }
.scale-up-center-enter-from, .scale-up-center-leave-to { opacity: 0; transform: scale(0.95); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-right-enter-active { transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); }
.slide-right-leave-active { transition: transform 0.2s ease-in; }
.slide-right-enter-from, .slide-right-leave-to { transform: translateX(100%); }

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
