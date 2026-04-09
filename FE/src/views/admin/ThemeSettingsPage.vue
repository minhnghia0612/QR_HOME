<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { qrConfigApi } from '@/api/qr-config.api'
import { useAuthStore } from '@/stores/auth.store'
import { setAdminPreviewSession } from '@/lib/admin-preview-session'
import { CheckCircle2, Save, ChevronDown } from 'lucide-vue-next'
import Toast from '@/components/Toast.vue'

type CustomerUiSize = 'large' | 'normal' | 'compact'

const authStore = useAuthStore()
const queryClient = useQueryClient()

const toast = ref({ show: false, message: '', type: 'success' as 'success' | 'danger' | 'warning' })

function showToast(message: string, type: 'success' | 'danger' | 'warning' = 'success') {
  toast.value = { show: true, message, type }
}

const THEMES = [
  { id: 'classic',        name: 'Classic',        desc: 'Clean white layout with simple product cards',                    color: '#22c55e', primaryColor: '#6366F1', secondaryColor: '#A16207' },
  { id: 'dark-elegance',  name: 'Dark Elegance',  desc: 'Full black with sticky sections and gold accents',              color: '#d4af37', primaryColor: '#D4AF37', secondaryColor: '#B8860B' },
  { id: 'modern-minimal', name: 'Modern Minimal', desc: 'Image backgrounds with gradient overlays',                       color: '#6366f1', primaryColor: '#6366F1', secondaryColor: '#8B5CF6' },
  { id: 'rustic',         name: 'Rustic',         desc: 'Vintage paper style with decorative borders',                    color: '#8b5a2b', primaryColor: '#8B5A2B', secondaryColor: '#A16207' },
  { id: 'vibrant',        name: 'Vibrant',        desc: 'Colorful bubbles, emojis and fun rotated cards',                color: '#ec4899', primaryColor: '#EC4899', secondaryColor: '#F97316' },
  { id: 'stitch',         name: 'Stitch Design',  desc: 'Ivory editorial layout with centered serif typography',         color: '#b58566', primaryColor: '#B58566', secondaryColor: '#7C5C4E' },
  { id: 'nature',         name: 'Nature Retreat', desc: 'Botanical paper cards with moss-green handcrafted tones',       color: '#5a7a55', primaryColor: '#5A7A55', secondaryColor: '#2D6A4F' },
  { id: 'neon',           name: 'Neon Cyber',     desc: 'Tactical HUD style with cyan scanline neon effects',            color: '#26e5ff', primaryColor: '#26E5FF', secondaryColor: '#A855F7' },
  { id: 'rose',           name: 'Rose Gold',      desc: 'Luxe blush editorial cards with soft metallic accents',        color: '#c97d95', primaryColor: '#C97D95', secondaryColor: '#BE185D' },
  { id: 'ocean',          name: 'Ocean Breeze',   desc: 'Seafoam split cards with airy aqua gradients',                  color: '#26a4c8', primaryColor: '#26A4C8', secondaryColor: '#0284C7' },
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
  primaryColor: '#0253CD',
  secondaryColor: '#5E0B61',
  fontFamily: 'Inter',
  customerUiSize: 'normal' as CustomerUiSize,
})

const fontOptions = ['Inter', 'Montserrat', 'Dancing Script', 'Pacifico']
const fontDropdownOpen = ref(false)
const fontDropdownRef = ref<HTMLElement | null>(null)
const previewCurrencyUnit = computed(() => String(config.value?.currencyUnit || 'VND'))

// Derived color presets from the active theme (deduplicated)
const themeColorPresets = computed(() => {
  const theme = THEMES.find(t => t.id === selectedTheme.value)
  if (!theme) return { primary: ['#0253CD', '#0EA5E9', '#16A34A', '#EA580C', '#7C3AED'], secondary: ['#5E0B61', '#0F766E', '#374151', '#BE185D', '#92400E'] }

  const others = THEMES.filter(t => t.id !== theme.id)

  // Build unique palette: theme color first, then unique alternates (case-insensitive compare)
  const buildUnique = (selfColor: string, key: 'primaryColor' | 'secondaryColor') => {
    const seen = new Set([selfColor.toUpperCase()])
    const unique: string[] = [selfColor]
    for (const t of others) {
      if (unique.length >= 5) break
      const c = t[key]
      if (!seen.has(c.toUpperCase())) {
        seen.add(c.toUpperCase())
        unique.push(c)
      }
    }
    return unique
  }

  return {
    primary: buildUnique(theme.primaryColor, 'primaryColor'),
    secondary: buildUnique(theme.secondaryColor, 'secondaryColor'),
  }
})

// Auto-apply theme default colors when user switches theme
watch(selectedTheme, (themeId) => {
  const theme = THEMES.find(t => t.id === themeId)
  if (theme) {
    customerInterface.value.primaryColor = theme.primaryColor
    customerInterface.value.secondaryColor = theme.secondaryColor
  }
})

function handleClickOutside(event: MouseEvent) {
  if (fontDropdownRef.value && !fontDropdownRef.value.contains(event.target as Node)) {
    fontDropdownOpen.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('mousedown', handleClickOutside))

watch(config, (val) => {
  if (val) {
    const savedFontFamily = String(val.fontFamily || 'Inter')
    const normalizedFontFamily = fontOptions.includes(savedFontFamily)
      ? savedFontFamily
      : 'Inter'

    selectedTheme.value = val.themeId || 'classic'
    customerInterface.value = {
      primaryColor: val.primaryColor || '#0253CD',
      secondaryColor: val.secondaryColor || '#5E0B61',
      fontFamily: normalizedFontFamily,
      customerUiSize: (val.customerUiSize || 'normal') as CustomerUiSize,
    }
  }
}, { immediate: true })

const { mutate: saveTheme, isPending: saving } = useMutation({
  mutationFn: async () => {
    const { data } = await qrConfigApi.updateThemeConfig({
      themeId: selectedTheme.value,
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
    queryClient.invalidateQueries({ queryKey: ['public-config'] })
  },
  onError: (err: any) => {
    showToast(err.message || 'Failed to save theme', 'danger')
  }
})

const previewUrl = computed(() => {
  const adminId = authStore.admin?.id
  if (!adminId) return ''

  return `/menu/${adminId}`
})

const previewFrameKey = computed(() => {
  return [
    selectedTheme.value,
    previewCurrencyUnit.value,
    customerInterface.value.primaryColor,
    customerInterface.value.secondaryColor,
    customerInterface.value.fontFamily,
    customerInterface.value.customerUiSize,
  ].join('|')
})

watch(
  [
    () => authStore.admin?.id,
    selectedTheme,
    previewCurrencyUnit,
    () => customerInterface.value.primaryColor,
    () => customerInterface.value.secondaryColor,
    () => customerInterface.value.fontFamily,
    () => customerInterface.value.customerUiSize,
  ],
  ([adminId]) => {
    if (!adminId) return

    setAdminPreviewSession(adminId, {
      themeId: selectedTheme.value,
      currencyUnit: previewCurrencyUnit.value,
      primaryColor: customerInterface.value.primaryColor,
      secondaryColor: customerInterface.value.secondaryColor,
      fontFamily: customerInterface.value.fontFamily,
      customerUiSize: customerInterface.value.customerUiSize,
    })
  },
  { immediate: true },
)
</script>

<template>
  <div class="flex min-h-[calc(100vh-64px)] flex-col overflow-y-auto px-4 py-6 sm:px-6 sm:py-8">
    <div class="mb-6 flex flex-shrink-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-3xl font-bold tracking-tight text-text-primary">Theme Settings</h2>
        <p class="mt-1 text-sm text-text-secondary">Choose template and customer interface style</p>
      </div>
      <button
        class="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-primary-600 to-[#0048B5] px-6 py-3 text-sm font-extrabold text-white shadow-button transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 sm:w-auto"
        :disabled="saving"
        @click="saveTheme()"
      >
        <Save v-if="!saving" class="h-4 w-4" />
        <span v-else class="animate-spin text-sm">⏳</span>
        {{ saving ? 'Saving...' : 'Apply Theme & Interface' }}
      </button>
    </div>

    <!-- Main Setting Area -->
    <div class="flex min-h-0 flex-1 flex-col gap-6 lg:flex-row lg:gap-8">
      <!-- Left: Theme Selection List -->
      <div class="w-full min-h-0 rounded-3xl bg-white shadow-sm ring-1 ring-border lg:w-1/2 lg:overflow-hidden">
        <div class="p-6 border-b border-border bg-surface-page/50 flex-shrink-0">
          <h3 class="text-lg font-bold text-text-primary">Theme & Customer Interface</h3>
        </div>
        <div class="p-6 lg:flex-1 lg:overflow-y-auto">
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
                <p class="mb-2 text-xs font-bold text-text-muted">Primary Color</p>
                <div class="flex flex-wrap items-center gap-2.5">
                  <button
                    v-for="(color, i) in themeColorPresets.primary"
                    :key="`primary-${i}-${color}`"
                    type="button"
                    @click="customerInterface.primaryColor = color"
                    :style="{ backgroundColor: color, '--ring-color': color } as any"
                    class="color-swatch"
                    :class="customerInterface.primaryColor === color ? 'color-swatch--active' : ''"
                  />
                  <label class="relative cursor-pointer" title="Custom color">
                    <span
                      class="flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed border-border bg-white text-xs font-black text-text-muted hover:border-primary-400 transition-colors"
                    >+</span>
                    <input
                      v-model="customerInterface.primaryColor"
                      type="color"
                      class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                  </label>
                  <div class="flex items-center gap-1.5 rounded-lg bg-surface-input px-2.5 py-1.5">
                    <span class="h-3.5 w-3.5 rounded-full flex-shrink-0" :style="{ backgroundColor: customerInterface.primaryColor }" />
                    <code class="text-[11px] font-bold text-text-secondary uppercase">{{ customerInterface.primaryColor }}</code>
                  </div>
                </div>
              </div>

              <div>
                <p class="mb-2 text-xs font-bold text-text-muted">Secondary Color</p>
                <div class="flex flex-wrap items-center gap-2.5">
                  <button
                    v-for="(color, i) in themeColorPresets.secondary"
                    :key="`secondary-${i}-${color}`"
                    type="button"
                    @click="customerInterface.secondaryColor = color"
                    :style="{ backgroundColor: color, '--ring-color': color } as any"
                    class="color-swatch"
                    :class="customerInterface.secondaryColor === color ? 'color-swatch--active' : ''"
                  />
                  <label class="relative cursor-pointer" title="Custom color">
                    <span
                      class="flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed border-border bg-white text-xs font-black text-text-muted hover:border-primary-400 transition-colors"
                    >+</span>
                    <input
                      v-model="customerInterface.secondaryColor"
                      type="color"
                      class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                  </label>
                  <div class="flex items-center gap-1.5 rounded-lg bg-surface-input px-2.5 py-1.5">
                    <span class="h-3.5 w-3.5 rounded-full flex-shrink-0" :style="{ backgroundColor: customerInterface.secondaryColor }" />
                    <code class="text-[11px] font-bold text-text-secondary uppercase">{{ customerInterface.secondaryColor }}</code>
                  </div>
                </div>
              </div>

              <div>
                <p class="mb-3 text-xs font-bold text-text-muted">Font Family</p>
                <div class="relative" ref="fontDropdownRef">
                  <button
                    type="button"
                    class="theme-dropdown-trigger"
                    @click="fontDropdownOpen = !fontDropdownOpen"
                  >
                    <span :style="{ fontFamily: customerInterface.fontFamily }">{{ customerInterface.fontFamily }}</span>
                    <ChevronDown :class="['h-4 w-4 text-text-muted transition-transform duration-200', fontDropdownOpen ? 'rotate-180' : '']" />
                  </button>
                  <Transition name="fade-down">
                    <div v-if="fontDropdownOpen" class="theme-dropdown-menu">
                      <button
                        v-for="font in fontOptions"
                        :key="font"
                        type="button"
                        :class="['theme-dropdown-option', customerInterface.fontFamily === font ? 'theme-dropdown-option--active' : '']"
                        :style="{ fontFamily: font }"
                        @click="customerInterface.fontFamily = font; fontDropdownOpen = false"
                      >
                        {{ font }}
                      </button>
                    </div>
                  </Transition>
                </div>
              </div>

              <div>
                <p class="mb-3 text-xs font-bold text-text-muted">Size</p>
                <div class="flex w-fit items-center gap-1.5 rounded-2xl bg-surface-input p-1.5 ring-1 ring-border">
                  <button
                    v-for="size in ['large', 'normal', 'compact']"
                    :key="size"
                    type="button"
                    :class="[
                      'min-w-[90px] rounded-xl px-4 py-2.5 text-[13px] font-black tracking-widest transition-all',
                      customerInterface.customerUiSize === size
                        ? 'bg-primary-600 text-white shadow-button ring-1 ring-primary-500'
                        : 'text-text-secondary hover:bg-white hover:text-text-primary hover:shadow-card'
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
      <div class="w-full rounded-3xl bg-[#EEF2F6] p-4 shadow-inner ring-1 ring-border sm:p-6 lg:w-1/2">
        <p class="mb-4 text-xs font-bold text-text-secondary uppercase tracking-widest text-center w-full">Live Preview</p>
        
        <!-- Mockup Device Wrapper (Fixed viewport + responsive scale) -->
        <div class="mx-auto flex w-full justify-center overflow-hidden h-[540px] sm:h-[630px] md:h-[720px] lg:h-[760px] xl:h-[790px] items-start">
          <div class="relative h-[868px] w-[414px] shrink-0 border-[12px] border-black rounded-[48px] bg-black shadow-2xl scale-[0.6] sm:scale-[0.7] md:scale-[0.8] lg:scale-[0.85] xl:scale-[0.88] origin-top">
          <!-- Screen notch -->
            <div class="absolute top-0 inset-x-0 h-6 flex justify-center z-50">
              <div class="w-32 h-6 bg-black rounded-b-3xl"></div>
            </div>
            
            <!-- Screen content -->
            <div class="relative h-full w-full overflow-hidden rounded-[36px] bg-white">
              <div v-if="loadingConfig" class="h-full w-full bg-surface-input animate-pulse"></div>
              <iframe
                v-else-if="authStore.admin?.id"
                :key="previewFrameKey"
                :src="previewUrl"
                class="absolute inset-0 h-full w-full border-0"
                title="Theme Preview"
              ></iframe>
            </div>
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

/* Color swatch */
.color-swatch {
  height: 2rem;
  width: 2rem;
  border-radius: 9999px;
  border: 2px solid transparent;
  outline: 2px solid transparent;
  outline-offset: 2px;
  transition: transform 0.15s ease, outline-color 0.15s ease;
  flex-shrink: 0;
}
.color-swatch:hover { transform: scale(1.1); }
.color-swatch--active {
  transform: scale(1.12);
  outline-color: var(--ring-color);
}

/* Font dropdown */
.theme-dropdown-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 0.95rem;
  background: #ffffff;
  padding: 0.7rem 0.95rem;
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--color-text-primary);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.theme-dropdown-trigger:focus {
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px rgba(0, 72, 181, 0.14);
}
.theme-dropdown-trigger:hover { background: #f8fafc; }

.theme-dropdown-menu {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 0.4rem);
  z-index: 30;
  border: 1px solid #dbe3f0;
  border-radius: 0.9rem;
  background: #ffffff;
  box-shadow: 0 14px 35px rgba(15, 23, 42, 0.16);
  padding: 0.35rem;
}

.theme-dropdown-option {
  width: 100%;
  border: none;
  border-radius: 0.65rem;
  background: transparent;
  padding: 0.58rem 0.8rem;
  text-align: left;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--color-text-primary);
  transition: background-color 0.15s ease;
}
.theme-dropdown-option:hover { background: #f4f8ff; }
.theme-dropdown-option--active {
  background: #e8f0ff;
  color: #0048b5;
}
</style>
