<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronDown } from 'lucide-vue-next'
import { FONT_OPTIONS, type CustomerUiSize } from '@/constants/theme.constant'

const props = defineProps<{
  customerInterface: {
    primaryColor: string
    secondaryColor: string
    fontFamily: string
    customerUiSize: CustomerUiSize
  }
  colorPresets: {
    primary: string[]
    secondary: string[]
  }
}>()

const { t } = useI18n({ useScope: 'global' })

const fontDropdownOpen = ref(false)
const fontDropdownRef = ref<HTMLElement | null>(null)

function handleClickOutside(event: MouseEvent) {
  if (fontDropdownRef.value && !fontDropdownRef.value.contains(event.target as Node)) {
    fontDropdownOpen.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('mousedown', handleClickOutside))
</script>

<template>
  <div class="mt-8 border-t border-border pt-6">
    <h4 class="text-sm font-bold uppercase tracking-wider text-text-secondary">{{ t('admin.theme.customerInterface') }}</h4>

    <div class="mt-5 space-y-6">
      <!-- Primary Color -->
      <div>
        <p class="mb-2 text-xs font-bold text-text-muted">{{ t('admin.theme.primaryColor') }}</p>
        <div class="flex flex-wrap items-center gap-2.5">
          <button
            v-for="(color, i) in colorPresets.primary"
            :key="`primary-${i}-${color}`"
            type="button"
            @click="customerInterface.primaryColor = color"
            :style="{ backgroundColor: color, '--ring-color': color } as any"
            class="color-swatch"
            :class="customerInterface.primaryColor === color ? 'color-swatch--active' : ''"
          />
          <label class="relative cursor-pointer" :title="t('admin.theme.customColor')">
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

      <!-- Secondary Color -->
      <div>
        <p class="mb-2 text-xs font-bold text-text-muted">{{ t('admin.theme.secondaryColor') }}</p>
        <div class="flex flex-wrap items-center gap-2.5">
          <button
            v-for="(color, i) in colorPresets.secondary"
            :key="`secondary-${i}-${color}`"
            type="button"
            @click="customerInterface.secondaryColor = color"
            :style="{ backgroundColor: color, '--ring-color': color } as any"
            class="color-swatch"
            :class="customerInterface.secondaryColor === color ? 'color-swatch--active' : ''"
          />
          <label class="relative cursor-pointer" :title="t('admin.theme.customColor')">
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

      <!-- Font Family -->
      <div>
        <p class="mb-3 text-xs font-bold text-text-muted">{{ t('admin.theme.fontFamily') }}</p>
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
                v-for="font in FONT_OPTIONS"
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

      <!-- UI Size -->
      <div>
        <p class="mb-3 text-xs font-bold text-text-muted">{{ t('admin.theme.size') }}</p>
        <div class="flex w-fit items-center gap-1.5 rounded-2xl bg-surface-input p-1.5 ring-1 ring-border">
          <button
            v-for="size in (['large', 'normal', 'compact'] as CustomerUiSize[])"
            :key="size"
            type="button"
            :class="[
              'min-w-[90px] rounded-xl px-4 py-2.5 text-[13px] font-black tracking-widest transition-all',
              customerInterface.customerUiSize === size
                ? 'bg-primary-600 text-white shadow-button ring-1 ring-primary-500'
                : 'text-text-secondary hover:bg-white hover:text-text-primary hover:shadow-card'
            ]"
            @click="customerInterface.customerUiSize = size"
          >
            {{ size }}
          </button>
        </div>
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
