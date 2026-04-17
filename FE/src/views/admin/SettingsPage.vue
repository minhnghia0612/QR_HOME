<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { qrConfigApi } from '@/api/qr-config.api'
import { uploadApi } from '@/api/upload.api'
import { Save, Settings as SettingsIcon, Image as ImageIcon, Upload, AlertCircle } from 'lucide-vue-next'
import Toast from '@/components/Toast.vue'
import { useStoreManager } from '@/stores/store-manager.store'

type CurrencyUnit = 'VND' | 'USD' | 'EUR'

const router = useRouter()
const { t } = useI18n({ useScope: 'global' })
const storeManager = useStoreManager()

const queryClient = useQueryClient()

const form = ref({
  spaName: '',
  spaAddress: '',
  spaPhone: '',
  spaEmail: '',
  spaLogo: '',
  bannerUrl: '',
  welcomeMessage: '',
  currencyUnit: 'VND' as CurrencyUnit,
  status: 'active',
})

const phoneError = ref('')
const validatePhone = () => {
  const value = form.value.spaPhone.trim()

  if (!value) {
    phoneError.value = t('admin.settings.errors.phoneRequired')
    return
  }

  // 0987654321 hoặc 098 765 4321
  const phoneRegex = /^(0\d{9}|0\d{2}\s\d{3}\s\d{4})$/

  if (!phoneRegex.test(value)) {
    phoneError.value =
      t('admin.settings.errors.phoneFormat')
    return
  }

  phoneError.value = ''
}

const { data: config, isLoading: loadingConfig } = useQuery({
  queryKey: ['qr-config', computed(() => storeManager.currentStoreId)],
  queryFn: async () => {
    const { data } = await qrConfigApi.getConfig()
    return data.data
  },
})

watch(config, (val) => {
  if (val) {
    form.value = {
      spaName: val.spaName || '',
      spaAddress: val.spaAddress || '',
      spaPhone: val.spaPhone || '',
      spaEmail: val.spaEmail || '',
      spaLogo: val.spaLogo || '',
      bannerUrl: val.bannerUrl || '',
      welcomeMessage: val.welcomeMessage || '',
      currencyUnit: (val.currencyUnit || 'VND') as CurrencyUnit,
      status: val.status || 'active',
    }
  }
}, { immediate: true })

const toast = ref({ show: false, message: '', type: 'danger' as 'success' | 'danger' | 'warning' })
const uploadLoading = ref<'spaLogo' | 'bannerUrl' | null>(null)
const isDraggingLogo = ref(false)
const isDraggingBanner = ref(false)

const MAX_IMAGE_SIZE_MB = 5
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024

function showToast(message: string, type: 'success' | 'danger' | 'warning' = 'danger') {
  toast.value = { show: true, message, type }
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

function normalizeText(value: string) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeEmail(value: string) {
  return String(value || '').trim().toLowerCase()
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

const { mutate: saveConfig, isPending: saving } = useMutation({
  mutationFn: async () => {
    // Re-validate everything before sending
    validatePhone()
    if (phoneError.value) {
      throw new Error(phoneError.value)
    }

    const payload = {
      spaName: normalizeText(form.value.spaName),
      spaAddress: normalizeText(form.value.spaAddress),
      spaPhone: normalizeText(form.value.spaPhone),
      spaEmail: normalizeEmail(form.value.spaEmail),
      spaLogo: String(form.value.spaLogo || '').trim(),
      bannerUrl: String(form.value.bannerUrl || '').trim(),
      welcomeMessage: normalizeText(form.value.welcomeMessage),
      currencyUnit: form.value.currencyUnit,
      status: normalizeText(form.value.status),
    }

    // All fields are required and whitespace-only values are invalid.
    if (!payload.spaName) throw new Error(t('admin.settings.errors.storeNameRequired'))
    if (!payload.spaAddress) throw new Error(t('admin.settings.errors.addressRequired'))
    if (!payload.spaPhone) throw new Error(t('admin.settings.errors.phoneRequired'))
    if (!payload.spaEmail) throw new Error(t('admin.settings.errors.emailRequired'))
    if (!isValidEmail(payload.spaEmail)) throw new Error(t('admin.settings.errors.emailInvalid'))
    if (!payload.spaLogo) throw new Error(t('admin.settings.errors.logoRequired'))
    if (!payload.bannerUrl) throw new Error(t('admin.settings.errors.bannerRequired'))
    if (!payload.welcomeMessage) throw new Error(t('admin.settings.errors.welcomeRequired'))
    if (!payload.currencyUnit) throw new Error(t('admin.settings.errors.currencyRequired'))
    if (!payload.status) throw new Error(t('admin.settings.errors.statusRequired'))

    // Reflect normalized values back to UI so users see cleaned content.
    form.value = { ...payload }

    const { data } = await qrConfigApi.updateSettingsConfig(payload)
    return data
  },
  onSuccess: async () => {
    showToast(t('admin.settings.saved'), 'success')
    queryClient.invalidateQueries({ queryKey: ['qr-config'] })
    storeManager.fetchStores()
    
    // Auto-redirect to next step in onboarding: Categories
    setTimeout(() => {
      router.push('/admin/categories')
    }, 1500)
  },
  onError: (err: any) => {
    showToast(getApiErrorMessage(err, t('admin.settings.saveFailed')), 'danger')
  }
})

async function processFile(file: File, field: 'spaLogo' | 'bannerUrl') {
  const isImage = String(file.type || '').startsWith('image/')
  if (!isImage) {
    showToast(t('admin.settings.errors.imageOnly'), 'danger')
    return
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    showToast(t('admin.settings.errors.imageTooLarge', { size: MAX_IMAGE_SIZE_MB }), 'danger')
    return
  }

  uploadLoading.value = field

  try {
    const { data } = await uploadApi.upload(file)
    const imageUrl = data.data?.url || ''
    if (!imageUrl) {
      showToast(t('admin.settings.errors.uploadNoUrl'), 'danger')
      return
    }
    form.value[field] = imageUrl
    showToast(field === 'spaLogo' ? t('admin.settings.logoUploaded') : t('admin.settings.bannerUploaded'), 'success')
  } catch (err: any) {
    showToast(getApiErrorMessage(err, t('admin.settings.errors.uploadFailed')), 'danger')
  } finally {
    uploadLoading.value = null
  }
}

async function handleUpload(e: Event, field: 'spaLogo' | 'bannerUrl') {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  await processFile(file, field)
  input.value = ''
}

async function handleDrop(e: DragEvent, field: 'spaLogo' | 'bannerUrl') {
  const file = e.dataTransfer?.files?.[0]
  if (!file) return
  await processFile(file, field)
}

// No need for separate onMounted if we have watch(config)

</script>

<template>
  <div class="p-6">
    <div class="mb-8">
      <h2 class="text-4xl font-bold tracking-tight text-text-primary">{{ t('admin.settings.title') }}</h2>
    </div>

    <div v-if="loadingConfig" class="grid grid-cols-1 gap-8">
      <div class="space-y-6">
        <div class="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-border space-y-5">
          <div class="h-8 w-48 rounded bg-surface-input animate-pulse"></div>
          <div class="h-20 w-20 rounded-2xl bg-surface-input animate-pulse"></div>
          <div class="h-12 w-full rounded-xl bg-surface-input animate-pulse"></div>
          <div class="h-12 w-full rounded-xl bg-surface-input animate-pulse"></div>
          <div class="grid grid-cols-2 gap-4">
            <div class="h-12 rounded-xl bg-surface-input animate-pulse"></div>
            <div class="h-12 rounded-xl bg-surface-input animate-pulse"></div>
          </div>
          <div class="h-40 w-full rounded-2xl bg-surface-input animate-pulse"></div>
        </div>
      </div>
    </div>

    <div v-else class="grid grid-cols-1 gap-8">
      <!-- Left Column: Basic Information -->
      <div class="space-y-6">
        <div class="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-border">
          <div class="mb-8 flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
              <SettingsIcon class="h-5 w-5" />
            </div>
            <h3 class="text-lg font-bold text-text-primary">{{ t('admin.settings.basicInfo') }}</h3>
          </div>

          <div class="space-y-6">
            <!-- Logo Section -->
            <div class="flex items-center gap-6">
              <div 
                class="relative h-20 w-20 overflow-hidden rounded-2xl transition-all"
                :class="[isDraggingLogo ? 'ring-2 ring-primary-600 bg-primary-50/50' : 'bg-surface-input']"
                @dragover.prevent="isDraggingLogo = true"
                @dragleave.prevent="isDraggingLogo = false"
                @drop.prevent="e => { isDraggingLogo = false; handleDrop(e, 'spaLogo') }"
              >
                <img v-if="form.spaLogo" :src="form.spaLogo" class="h-full w-full object-cover" />
                <div v-else class="flex h-full w-full items-center justify-center text-2xl">⠿</div>
                <label class="absolute bottom-1 right-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-border hover:bg-surface-input">
                  <Upload class="h-3 w-3 text-text-primary" />
                  <input type="file" accept="image/*" class="hidden" :disabled="uploadLoading === 'spaLogo'" @change="e => handleUpload(e, 'spaLogo')" />
                </label>
              </div>
              <div>
                <p class="font-bold text-text-primary text-sm">{{ t('admin.settings.logo') }}</p>
                <p class="text-xs text-text-muted mt-1">{{ uploadLoading === 'spaLogo' ? t('admin.settings.uploadingLogo') : t('admin.settings.logoHint') }}</p>
              </div>
            </div>

            <!-- Name -->
            <div>
              <label class="mb-1.5 block text-xs font-bold text-text-secondary uppercase tracking-wider">{{ t('admin.settings.storeName') }}</label>
              <input
                v-model="form.spaName"
                type="text"
                :placeholder="t('admin.settings.storeNamePlaceholder')"
                class="w-full rounded-xl border-0 bg-surface-input px-4 py-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>

            <!-- Address -->
            <div>
              <label class="mb-1.5 block text-xs font-bold text-text-secondary uppercase tracking-wider">{{ t('admin.common.address') }}</label>
              <input
                v-model="form.spaAddress"
                type="text"
                :placeholder="t('admin.settings.addressPlaceholder')"
                class="w-full rounded-xl border-0 bg-surface-input px-4 py-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="relative">
                <label class="mb-1.5 block text-xs font-bold text-text-secondary uppercase tracking-wider">{{ t('admin.common.phone') }}</label>
                <div class="relative">
                  <input
                    v-model="form.spaPhone"
                    type="text"
                    placeholder="098 765 4321"
                    :class="[
                      'w-full rounded-xl border-0 bg-surface-input px-4 py-3 text-sm text-text-primary outline-none transition-all duration-200',
                      phoneError 
                        ? 'bg-danger/5 ring-2 ring-danger/20 text-danger placeholder:text-danger/40' 
                        : 'focus:ring-2 focus:ring-primary-600'
                    ]"
                    @blur="validatePhone"
                    @input="validatePhone"
                  />
                  <AlertCircle 
                    v-if="phoneError"
                    class="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-danger animate-pulse"
                  />
                </div>
                <Transition name="fade-slide">
                  <p
                    v-if="phoneError"
                    class="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold text-danger"
                  >
                    {{ phoneError }}
                  </p>
                </Transition>
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-bold text-text-secondary uppercase tracking-wider">{{ t('admin.common.email') }}</label>
                <input
                  v-model="form.spaEmail"
                  type="text"
                  :placeholder="t('admin.settings.emailPlaceholder')"
                  class="w-full rounded-xl border-0 bg-surface-input px-4 py-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary-600"
                />
              </div>
            </div>

            <div>
              <label class="mb-1.5 block text-xs font-bold text-text-secondary uppercase tracking-wider">{{ t('admin.settings.currencyUnit') }}</label>
              <div class="flex w-fit items-center gap-1.5 rounded-2xl bg-surface-input p-1.5 ring-1 ring-border">
                <button
                  v-for="unit in ['VND', 'USD', 'EUR']"
                  :key="unit"
                  type="button"
                  :class="[
                    'min-w-[90px] rounded-xl px-4 py-2.5 text-[11px] font-black tracking-widest transition-all',
                    form.currencyUnit === unit
                      ? 'bg-primary-600 text-white shadow-button ring-1 ring-primary-500'
                      : 'text-text-secondary hover:bg-white hover:text-text-primary hover:shadow-card'
                  ]"
                  @click="form.currencyUnit = unit as CurrencyUnit"
                >
                  {{ unit }}
                </button>
              </div>
            </div>

            <!-- Banner Upload -->
            <div>
              <label class="mb-1.5 block text-xs font-bold text-text-secondary uppercase tracking-wider">{{ t('admin.settings.banner') }}</label>
              <label 
                class="flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 transition-colors" 
                :class="[
                  uploadLoading === 'bannerUrl' ? 'opacity-70 pointer-events-none' : '',
                  isDraggingBanner ? 'border-primary-600 bg-primary-50/50' : 'border-border bg-surface-input hover:border-primary-600'
                ]"
                @dragover.prevent="isDraggingBanner = true"
                @dragleave.prevent="isDraggingBanner = false"
                @drop.prevent="e => { isDraggingBanner = false; handleDrop(e, 'bannerUrl') }"
              >
                <template v-if="!form.bannerUrl">
                  <div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-600 mb-3">
                    <ImageIcon class="h-6 w-6" />
                  </div>
                  <p class="text-sm font-bold text-text-primary">{{ uploadLoading === 'bannerUrl' ? t('admin.settings.uploadingBanner') : t('admin.settings.uploadHint') }}</p>
                  <p class="mt-1 text-xs text-text-muted">{{ t('admin.settings.bannerHint') }}</p>
                </template>
                <img v-else :src="form.bannerUrl" class="max-h-32 rounded-lg object-contain" />
                <input type="file" accept="image/*" class="hidden" :disabled="uploadLoading === 'bannerUrl'" @change="e => handleUpload(e, 'bannerUrl')" />
              </label>
            </div>

            <!-- Welcome Message -->
            <div>
              <label class="mb-1.5 block text-xs font-bold text-text-secondary uppercase tracking-wider">{{ t('admin.settings.welcomeMessage') }}</label>
              <div class="rounded-2xl bg-surface-input p-4">
                <textarea
                  v-model="form.welcomeMessage"
                  rows="4"
                  :placeholder="t('admin.settings.welcomePlaceholder')"
                  class="w-full resize-none border-0 bg-transparent p-0 text-sm text-text-secondary outline-none placeholder:text-text-muted"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Actions -->
    <div class="mt-10 flex justify-end gap-3 border-t border-border pt-8">
      <button
        class="rounded-xl bg-surface-secondary px-8 py-3 text-sm font-extrabold text-text-dim transition-all hover:bg-surface-input"
        @click="config && (form = { 
          spaName: config.spaName || '',
          spaAddress: config.spaAddress || '',
          spaPhone: config.spaPhone || '',
          spaEmail: config.spaEmail || '',
          spaLogo: config.spaLogo || '',
          bannerUrl: config.bannerUrl || '',
          welcomeMessage: config.welcomeMessage || '',
          currencyUnit: config.currencyUnit || 'VND',
          status: config.status || 'active'
        })"
      >
        {{ t('admin.common.cancelChanges') }}
      </button>
      <button
        class="flex items-center gap-2 rounded-xl bg-[#0048B5] px-10 py-3 text-sm font-extrabold text-white shadow-button transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
        :disabled="saving"
        @click="saveConfig()"
      >
        <Save v-if="!saving" class="h-4 w-4" />
        <span v-else class="animate-spin text-sm">⏳</span>
        {{ saving ? t('admin.common.saving') : t('admin.common.saveAllChanges') }}
      </button>
    </div>
    
    <Toast 
      :show="toast.show" 
      :message="toast.message" 
      :type="toast.type" 
      @close="toast.show = false" 
    />
  </div>
</template>

<style scoped>
.fade-slide-enter-active, .fade-slide-leave-active {
  transition: all 0.3s ease;
}
.fade-slide-enter-from, .fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
