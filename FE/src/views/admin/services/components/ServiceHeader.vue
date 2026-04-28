<script setup lang="ts">
import { Eye, Plus } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'

const props = defineProps<{
  previewUrl: string
}>()

const emit = defineEmits<{
  (e: 'open-create'): void
}>()

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h2 class="text-4xl font-bold tracking-tight text-text-primary">{{ t('admin.serviceManager.title') }}</h2>
      <p class="mt-1 text-sm text-text-secondary">{{ t('admin.serviceManager.subtitle') }}</p>
    </div>
    <div class="flex items-center gap-3">
      <RouterLink
        :to="previewUrl"
        target="_blank"
        class="flex items-center gap-2 rounded-xl border border-border bg-white px-5 py-3 text-sm font-extrabold text-text-primary shadow-sm transition-all hover:bg-surface-input active:scale-95"
      >
        <Eye class="h-4 w-4" />
        {{ t('admin.serviceManager.preview') }}
      </RouterLink>
      <button
        class="flex items-center gap-2 rounded-xl bg-gradient-to-b from-primary-600 to-[#0048B5] px-5 py-3 text-sm font-extrabold text-white shadow-button transition-all hover:brightness-110 active:scale-95"
        @click="emit('open-create')"
      >
        <Plus class="h-4 w-4" />
        {{ t('admin.serviceManager.addNewService') }}
      </button>
    </div>
  </div>
</template>
