<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Toast from '@/components/Toast.vue'
import SettingsSkeleton from './settings/components/SettingsSkeleton.vue'
import SettingsFormContent from './settings/components/SettingsFormContent.vue'
import SettingsActions from './settings/components/SettingsActions.vue'
import { useSettingsForm } from '@/composables/settings/useSettingsForm'
import { useImageUpload } from '@/composables/useImageUpload'

const { t } = useI18n({ useScope: 'global' })
const toast = ref({ show: false, message: '', type: 'danger' as 'success' | 'danger' | 'warning' })

function showToast(message: string, type: 'success' | 'danger' | 'warning' = 'danger') {
  toast.value = { show: true, message, type }
}

const {
  form,
  config,
  loadingConfig,
  phoneError,
  validatePhone,
  saveConfig,
  saving,
  cancelChanges
} = useSettingsForm(showToast)

const {
  uploadLoading,
  handleUpload,
  handleDrop
} = useImageUpload(form, showToast)
</script>

<template>
  <div class="p-6">
    <div class="mb-8">
      <h2 class="text-4xl font-bold tracking-tight text-text-primary">{{ t('admin.settings.title') }}</h2>
    </div>

    <SettingsSkeleton v-if="loadingConfig" />

    <div v-else class="grid grid-cols-1 gap-8">
      <SettingsFormContent
        :form="form"
        :phone-error="phoneError"
        :upload-loading="uploadLoading"
        @validate-phone="validatePhone"
        @upload="handleUpload"
        @drop="handleDrop"
      />
    </div>

    <SettingsActions
      v-if="!loadingConfig"
      :saving="saving"
      :has-config="!!config"
      @cancel="cancelChanges"
      @save="saveConfig"
    />
    
    <Toast 
      :show="toast.show" 
      :message="toast.message" 
      :type="toast.type" 
      @close="toast.show = false" 
    />
  </div>
</template>
