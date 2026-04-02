<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { qrConfigApi } from '@/api/qr-config.api'
import { uploadApi } from '@/api/upload.api'
import { Save, Settings as SettingsIcon, Image as ImageIcon, Upload } from 'lucide-vue-next'
import Toast from '@/components/Toast.vue'

const router = useRouter()

const queryClient = useQueryClient()

const form = ref({
  spaName: '',
  spaAddress: '',
  spaPhone: '',
  spaEmail: '',
  spaLogo: '',
  bannerUrl: '',
  welcomeMessage: '',
  status: 'active',
})

const { data: config, isLoading: loadingConfig } = useQuery({
  queryKey: ['qr-config'],
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
      status: val.status || 'active',
    }
  }
}, { immediate: true })

const toast = ref({ show: false, message: '', type: 'danger' as 'success' | 'danger' | 'warning' })

function showToast(message: string, type: 'success' | 'danger' | 'warning' = 'danger') {
  toast.value = { show: true, message, type }
}

const { mutate: saveConfig, isPending: saving } = useMutation({
  mutationFn: async () => {
    // Validation
    if (!form.value.spaName) throw new Error('Store Name is required')
    if (!form.value.spaPhone) throw new Error('Phone Number is required')
    if (!form.value.spaAddress) throw new Error('Address is required')

    const { data } = await qrConfigApi.updateConfig(form.value)
    return data
  },
  onSuccess: async () => {
    showToast('Settings saved successfully', 'success')
    queryClient.invalidateQueries({ queryKey: ['qr-config'] })
    
    // Auto-redirect to next step in onboarding: Categories
    setTimeout(() => {
      router.push('/admin/categories')
    }, 1500)
  },
  onError: (err: any) => {
    showToast(err.message || 'Failed to save settings', 'danger')
  }
})

async function handleUpload(e: Event, field: 'spaLogo' | 'bannerUrl') {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  try {
    const { data } = await uploadApi.upload(file)
    form.value[field] = data.data?.url || ''
  } catch (err) {
    console.error('Upload Error:', err)
  }
}

// No need for separate onMounted if we have watch(config)

</script>

<template>
  <div class="p-6">
    <div class="mb-8">
      <h2 class="text-4xl font-bold tracking-tight text-text-primary">Settings</h2>
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
            <h3 class="text-lg font-bold text-text-primary">Basic Information</h3>
          </div>

          <div class="space-y-6">
            <!-- Logo Section -->
            <div class="flex items-center gap-6">
              <div class="relative h-20 w-20 overflow-hidden rounded-2xl bg-surface-input">
                <img v-if="form.spaLogo" :src="form.spaLogo" class="h-full w-full object-cover" />
                <div v-else class="flex h-full w-full items-center justify-center text-2xl">⠿</div>
                <label class="absolute bottom-1 right-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-border hover:bg-surface-input">
                  <Upload class="h-3 w-3 text-text-primary" />
                  <input type="file" class="hidden" @change="e => handleUpload(e, 'spaLogo')" />
                </label>
              </div>
              <div>
                <p class="font-bold text-text-primary text-sm">Logo</p>
                <p class="text-xs text-text-muted mt-1">Recommended 512×512px (PNG, JPG)</p>
              </div>
            </div>

            <!-- Name -->
            <div>
              <label class="mb-1.5 block text-xs font-bold text-text-secondary uppercase tracking-wider">Store Name</label>
              <input
                v-model="form.spaName"
                type="text"
                placeholder="Azure Wellness Center"
                class="w-full rounded-xl border-0 bg-surface-input px-4 py-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>

            <!-- Address -->
            <div>
              <label class="mb-1.5 block text-xs font-bold text-text-secondary uppercase tracking-wider">Address</label>
              <input
                v-model="form.spaAddress"
                type="text"
                placeholder="123 Street Address..."
                class="w-full rounded-xl border-0 bg-surface-input px-4 py-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="mb-1.5 block text-xs font-bold text-text-secondary uppercase tracking-wider">Phone Number</label>
                <input
                  v-model="form.spaPhone"
                  type="text"
                  placeholder="098 765 4321"
                  class="w-full rounded-xl border-0 bg-surface-input px-4 py-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary-600"
                />
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-bold text-text-secondary uppercase tracking-wider">Contact Email</label>
                <input
                  v-model="form.spaEmail"
                  type="text"
                  placeholder="contact@azurewellness.vn"
                  class="w-full rounded-xl border-0 bg-surface-input px-4 py-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary-600"
                />
              </div>
            </div>

            <!-- Banner Upload -->
            <div>
              <label class="mb-1.5 block text-xs font-bold text-text-secondary uppercase tracking-wider">Banner</label>
              <label class="flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-surface-input p-6 transition-colors hover:border-primary-600">
                <template v-if="!form.bannerUrl">
                  <div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-600 mb-3">
                    <ImageIcon class="h-6 w-6" />
                  </div>
                  <p class="text-sm font-bold text-text-primary">Upload image or drag and drop</p>
                  <p class="mt-1 text-xs text-text-muted">Recommended JPG or PNG. Max size 5MB.</p>
                </template>
                <img v-else :src="form.bannerUrl" class="max-h-32 rounded-lg object-contain" />
                <input type="file" class="hidden" @change="e => handleUpload(e, 'bannerUrl')" />
              </label>
            </div>

            <!-- Welcome Message -->
            <div>
              <label class="mb-1.5 block text-xs font-bold text-text-secondary uppercase tracking-wider">Welcome Message</label>
              <div class="rounded-2xl bg-surface-input p-4">
                <textarea
                  v-model="form.welcomeMessage"
                  rows="4"
                  placeholder="Welcome to your store..."
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
          status: config.status || 'active'
        })"
      >
        Cancel Changes
      </button>
      <button
        class="flex items-center gap-2 rounded-xl bg-[#0048B5] px-10 py-3 text-sm font-extrabold text-white shadow-button transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
        :disabled="saving"
        @click="saveConfig()"
      >
        <Save v-if="!saving" class="h-4 w-4" />
        <span v-else class="animate-spin text-sm">⏳</span>
        {{ saving ? 'Saving...' : 'Save All Changes' }}
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
