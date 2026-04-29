<script setup lang="ts">
import { Save } from 'lucide-vue-next'
import Toast from '@/components/Toast.vue'
import ThemeList from './theme/components/ThemeList.vue'
import ThemeCustomizer from './theme/components/ThemeCustomizer.vue'
import DevicePreview from './theme/components/DevicePreview.vue'
import { useThemeConfig } from '@/composables/useThemeConfig'

const {
  t,
  toast,
  loadingConfig,
  selectedTheme,
  customerInterface,
  themeColorPresets,
  saveTheme,
  saving,
  previewUrl,
  previewFrameKey,
  authStore
} = useThemeConfig()
</script>

<template>
  <div class="flex min-h-[calc(100vh-64px)] flex-col overflow-y-auto px-4 py-6 sm:px-6 sm:py-8">
    <div class="mb-6 flex flex-shrink-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-3xl font-bold tracking-tight text-text-primary">{{ t('admin.theme.title') }}</h2>
        <p class="mt-1 text-sm text-text-secondary">{{ t('admin.theme.subtitle') }}</p>
      </div>
      <button
        class="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-primary-600 to-[#0048B5] px-6 py-3 text-sm font-extrabold text-white shadow-button transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 sm:w-auto"
        :disabled="saving"
        @click="saveTheme()"
      >
        <Save v-if="!saving" class="h-4 w-4" />
        <span v-else class="animate-spin text-sm">⏳</span>
        {{ saving ? t('admin.common.saving') : t('admin.theme.apply') }}
      </button>
    </div>

    <!-- Main Setting Area -->
    <div class="flex min-h-0 flex-1 flex-col gap-6 lg:flex-row lg:gap-8">
      <ThemeList 
        v-model="selectedTheme" 
        :loading="loadingConfig"
      >
        <template #customizer>
          <ThemeCustomizer 
            :customer-interface="customerInterface"
            :color-presets="themeColorPresets"
          />
        </template>
      </ThemeList>

      <DevicePreview 
        :preview-url="previewUrl"
        :preview-frame-key="previewFrameKey"
        :loading="loadingConfig"
        :admin-id="authStore.admin?.id"
      />
    </div>

    <Toast 
      :show="toast.show" 
      :message="toast.message" 
      :type="toast.type" 
      @close="toast.show = false" 
    />
  </div>
</template>
