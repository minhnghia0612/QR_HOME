<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { qrConfigApi } from '@/api/qr-config.api'
import { useAuthStore } from '@/stores/auth.store'
import { CheckCircle2, Save } from 'lucide-vue-next'
import Toast from '@/components/Toast.vue'

type CurrencyUnit = 'VND' | 'USD' | 'EUR'
type CustomerUiSize = 'large' | 'normal' | 'compact'

const authStore = useAuthStore()
const queryClient = useQueryClient()

const toast = ref({ show: false, message: '', type: 'success' as 'success' | 'danger' | 'warning' })

function showToast(message: string, type: 'success' | 'danger' | 'warning' = 'success') {
  toast.value = { show: true, message, type }
}

const THEMES = [
  { id: 'classic', name: 'Classic', desc: 'Clean white layout with simple product cards', color: '#22c55e' },
  { id: 'dark-elegance', name: 'Dark Elegance', desc: 'Full black with sticky sections and gold accents', color: '#d4af37' },
  { id: 'modern-minimal', name: 'Modern Minimal', desc: 'Image backgrounds with gradient overlays', color: '#6366f1' },
  { id: 'rustic', name: 'Rustic', desc: 'Vintage paper style with decorative borders', color: '#8b5a2b' },
  { id: 'vibrant', name: 'Vibrant', desc: 'Colorful bubbles, emojis and fun rotated cards', color: '#ec4899' },
  { id: 'stitch', name: 'Stitch Design', desc: 'Modern grid/list layout with smooth transitions', color: '#f97316' },
  { id: 'nature', name: 'Nature Retreat', desc: 'Greenery tones, rounded leaves', color: '#10b981' },
  { id: 'neon', name: 'Neon Cyber', desc: 'Dark mode with bright neon glowing text', color: '#06b6d4' },
  { id: 'rose', name: 'Rose Gold', desc: 'Elegant pinks and thin serif fonts', color: '#fda4af' },
  { id: 'ocean', name: 'Ocean Breeze', desc: 'Cool blues and waves dividers', color: '#3b82f6' },
]

const { data: config, isLoading: loadingConfig } = useQuery({
  queryKey: ['qr-config'],
  queryFn: async () => {
    const { data } = await qrConfigApi.getConfig()
    return data.data
  },
})

const selectedTheme = ref('classic')
const customerInterface = ref({
  currencyUnit: 'VND' as CurrencyUnit,
  primaryColor: '#0253CD',
  secondaryColor: '#5E0B61',
  fontFamily: 'Inter',
  customerUiSize: 'normal' as CustomerUiSize,
})

const primaryColorPresets = ['#0253CD', '#0EA5E9', '#16A34A', '#EA580C', '#7C3AED']
const secondaryColorPresets = ['#5E0B61', '#0F766E', '#374151', '#BE185D', '#92400E']
const fontOptions = ['Inter', 'Manrope', 'Poppins', 'Montserrat', 'Nunito']

watch(config, (val) => {
  if (val) {
    selectedTheme.value = val.themeId || 'classic'
    customerInterface.value = {
      currencyUnit: (val.currencyUnit || 'VND') as CurrencyUnit,
      primaryColor: val.primaryColor || '#0253CD',
      secondaryColor: val.secondaryColor || '#5E0B61',
      fontFamily: val.fontFamily || 'Inter',
      customerUiSize: (val.customerUiSize || 'normal') as CustomerUiSize,
    }
  }
}, { immediate: true })

const { mutate: saveTheme, isPending: saving } = useMutation({
  mutationFn: async () => {
    const { data } = await qrConfigApi.updateConfig({
      themeId: selectedTheme.value,
      currencyUnit: customerInterface.value.currencyUnit,
      primaryColor: customerInterface.value.primaryColor,
      secondaryColor: customerInterface.value.secondaryColor,
      fontFamily: customerInterface.value.fontFamily,
      customerUiSize: customerInterface.value.customerUiSize,
    })
    return data
  },
  onSuccess: () => {
    showToast('Theme and customer interface applied successfully', 'success')
    queryClient.invalidateQueries({ queryKey: ['qr-config'] })
  },
  onError: (err: any) => {
    showToast(err.message || 'Failed to save theme', 'danger')
  }
})

const previewUrl = computed(() => {
  const adminId = authStore.admin?.id
  if (!adminId) return ''

  const params = new URLSearchParams({
    previewTheme: selectedTheme.value,
    previewCurrencyUnit: customerInterface.value.currencyUnit,
    previewPrimaryColor: customerInterface.value.primaryColor,
    previewSecondaryColor: customerInterface.value.secondaryColor,
    previewFontFamily: customerInterface.value.fontFamily,
    previewSize: customerInterface.value.customerUiSize,
    isAdmin: 'true',
  })

  return `/menu/${adminId}?${params.toString()}`
})
</script>

<template>
  <div class="px-6 py-8 h-[calc(100vh-64px)] overflow-hidden flex flex-col">
    <div class="mb-6 flex items-center justify-between flex-shrink-0">
      <div>
        <h2 class="text-3xl font-bold tracking-tight text-text-primary">Theme Settings</h2>
        <p class="mt-1 text-sm text-text-secondary">Choose template and customer interface style</p>
      </div>
      <button
        class="flex items-center gap-2 rounded-xl bg-gradient-to-b from-primary-600 to-[#0048B5] px-6 py-3 text-sm font-extrabold text-white shadow-button transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
        :disabled="saving"
        @click="saveTheme()"
      >
        <Save v-if="!saving" class="h-4 w-4" />
        <span v-else class="animate-spin text-sm">⏳</span>
        {{ saving ? 'Saving...' : 'Apply Theme & Interface' }}
      </button>
    </div>

    <!-- Main Setting Area -->
    <div class="flex flex-1 gap-8 min-h-0">
      <!-- Left: Theme Selection List -->
      <div class="w-1/2 flex flex-col rounded-3xl bg-white shadow-sm ring-1 ring-border overflow-hidden">
        <div class="p-6 border-b border-border bg-surface-page/50 flex-shrink-0">
          <h3 class="text-lg font-bold text-text-primary">Theme & Customer Interface</h3>
        </div>
        <div class="flex-1 overflow-y-auto p-6">
          <div v-if="loadingConfig" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="i in 8"
              :key="`theme-skeleton-${i}`"
              class="rounded-2xl border border-border bg-white p-5"
            >
              <div class="flex gap-4">
                <div class="h-10 w-10 rounded-full bg-surface-input animate-pulse"></div>
                <div class="flex-1">
                  <div class="h-4 w-24 rounded bg-surface-input animate-pulse"></div>
                  <div class="mt-2 h-3 w-full rounded bg-surface-input animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="theme in THEMES" :key="theme.id"
              @click="selectedTheme = theme.id"
              class="relative cursor-pointer rounded-2xl border-2 p-5 transition-all"
              :class="selectedTheme === theme.id ? 'border-primary-500 bg-primary-50/30' : 'border-border bg-white hover:border-text-muted hover:bg-surface-page'"
            >
              <div class="flex gap-4">
                <div class="h-10 w-10 flex-shrink-0 rounded-full" :style="{ backgroundColor: theme.color }"></div>
                <div>
                  <div class="flex items-center gap-2">
                    <h4 class="font-bold text-text-primary" :class="selectedTheme === theme.id ? 'text-primary-700' : ''">{{ theme.name }}</h4>
                  </div>
                  <p class="mt-1 flex-1 text-xs text-text-secondary line-clamp-2 leading-relaxed">{{ theme.desc }}</p>
                </div>
              </div>

              <!-- Active Check -->
              <div v-if="selectedTheme === theme.id" class="absolute right-3 top-3 text-primary-500">
                <CheckCircle2 class="h-5 w-5" />
              </div>
            </div>
          </div>

          <div class="mt-8 border-t border-border pt-6">
            <h4 class="text-sm font-bold uppercase tracking-wider text-text-secondary">Customer Interface</h4>

            <div class="mt-5 space-y-6">
              <div>
                <p class="mb-3 text-xs font-bold text-text-muted">Currency Unit</p>
                <div class="grid grid-cols-3 gap-2">
                  <button
                    v-for="unit in ['VND', 'USD', 'EUR']"
                    :key="unit"
                    type="button"
                    :class="[
                      'rounded-xl px-3 py-2 text-xs font-extrabold transition-all',
                      customerInterface.currencyUnit === unit
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'bg-surface-input text-text-secondary hover:bg-surface-secondary'
                    ]"
                    @click="customerInterface.currencyUnit = unit as CurrencyUnit"
                  >
                    {{ unit }}
                  </button>
                </div>
              </div>

              <div>
                <p class="mb-3 text-xs font-bold text-text-muted">Primary Color</p>
                <div class="flex flex-wrap gap-3">
                  <button
                    v-for="color in primaryColorPresets"
                    :key="color"
                    type="button"
                    @click="customerInterface.primaryColor = color"
                    :style="{ backgroundColor: color }"
                    class="h-8 w-8 rounded-full ring-2 ring-offset-2 transition-transform active:scale-90"
                    :class="customerInterface.primaryColor === color ? 'ring-primary-600 scale-110' : 'ring-transparent'"
                  />
                  <input
                    v-model="customerInterface.primaryColor"
                    type="color"
                    class="h-8 w-10 cursor-pointer rounded border border-border bg-white p-1"
                  />
                </div>
              </div>

              <div>
                <p class="mb-3 text-xs font-bold text-text-muted">Secondary Color</p>
                <div class="flex flex-wrap gap-3">
                  <button
                    v-for="color in secondaryColorPresets"
                    :key="color"
                    type="button"
                    @click="customerInterface.secondaryColor = color"
                    :style="{ backgroundColor: color }"
                    class="h-8 w-8 rounded-full ring-2 ring-offset-2 transition-transform active:scale-90"
                    :class="customerInterface.secondaryColor === color ? 'ring-primary-600 scale-110' : 'ring-transparent'"
                  />
                  <input
                    v-model="customerInterface.secondaryColor"
                    type="color"
                    class="h-8 w-10 cursor-pointer rounded border border-border bg-white p-1"
                  />
                </div>
              </div>

              <div>
                <p class="mb-3 text-xs font-bold text-text-muted">Font Family</p>
                <select
                  v-model="customerInterface.fontFamily"
                  class="w-full rounded-xl border-0 bg-surface-input px-4 py-3 text-sm font-bold text-text-primary outline-none focus:ring-2 focus:ring-primary-600"
                >
                  <option v-for="font in fontOptions" :key="font" :value="font">{{ font }}</option>
                </select>
              </div>

              <div>
                <p class="mb-3 text-xs font-bold text-text-muted">Size</p>
                <div class="grid grid-cols-3 gap-2">
                  <button
                    v-for="size in ['large', 'normal', 'compact']"
                    :key="size"
                    type="button"
                    :class="[
                      'rounded-xl px-3 py-2 text-xs font-extrabold capitalize transition-all',
                      customerInterface.customerUiSize === size
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'bg-surface-input text-text-secondary hover:bg-surface-secondary'
                    ]"
                    @click="customerInterface.customerUiSize = size as CustomerUiSize"
                  >
                    {{ size }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Live Preview Mockup -->
      <div class="w-1/2 rounded-3xl bg-[#EEF2F6] flex flex-col items-center justify-center p-6 overflow-hidden shadow-inner ring-1 ring-border">
        <p class="mb-4 text-xs font-bold text-text-secondary uppercase tracking-widest text-center w-full">Live Preview</p>
        
        <!-- Mockup Device Wrapper (Responsive height) -->
        <div class="relative w-full max-w-[320px] h-full max-h-[640px] bg-black rounded-[45px] p-2.5 shadow-2xl ring-4 ring-text-primary/10 flex flex-col shrink">
          <!-- Screen -->
          <div class="relative w-full h-full bg-white rounded-[35px] overflow-hidden flex flex-col">
            <!-- Top notch -->
            <div class="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-b-2xl z-[100]"></div>
            
            <div v-if="loadingConfig" class="m-3 h-full rounded-[24px] bg-surface-input animate-pulse"></div>
            <iframe
              v-else-if="authStore.admin?.id"
              :src="previewUrl"
              class="w-full h-full border-0"
              title="Theme Preview"
            ></iframe>
          </div>
        </div>
      </div>
    </div>

    <Toast 
      :show="toast.show" 
      :message="toast.message" 
      :type="toast.type" 
      @close="toast.show = false" 
    />
  </div>
</template>
