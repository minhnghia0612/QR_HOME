<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  previewUrl: string
  previewFrameKey: string
  loading: boolean
  adminId: string | undefined
}>()

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <div class="w-full rounded-3xl bg-[#EEF2F6] p-4 shadow-inner ring-1 ring-border sm:p-6 lg:w-1/2">
    <p class="mb-4 text-xs font-bold text-text-secondary uppercase tracking-widest text-center w-full">{{ t('admin.theme.livePreview') }}</p>
    
    <!-- Mockup Device Wrapper -->
    <div class="mx-auto flex w-full justify-center overflow-hidden h-[540px] sm:h-[630px] md:h-[720px] lg:h-[760px] xl:h-[790px] items-start">
      <div class="relative h-[868px] w-[414px] shrink-0 border-[12px] border-black rounded-[48px] bg-black shadow-2xl scale-[0.6] sm:scale-[0.7] md:scale-[0.8] lg:scale-[0.85] xl:scale-[0.88] origin-top">
        <!-- Screen notch -->
        <div class="absolute top-0 inset-x-0 h-6 flex justify-center z-50">
          <div class="w-32 h-6 bg-black rounded-b-3xl"></div>
        </div>
        
        <!-- Screen content -->
        <div class="relative h-full w-full overflow-hidden rounded-[36px] bg-white">
          <div v-if="loading" class="h-full w-full bg-surface-input animate-pulse"></div>
          <iframe
            v-else-if="adminId"
            :key="previewFrameKey"
            :src="previewUrl"
            class="absolute inset-0 h-full w-full border-0"
            :title="t('admin.theme.previewFrameTitle')"
          ></iframe>
        </div>
      </div>
    </div>
  </div>
</template>
