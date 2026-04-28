<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Save } from 'lucide-vue-next'

const { t } = useI18n({ useScope: 'global' })

defineProps<{
  saving: boolean
  hasConfig: boolean
}>()

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'save'): void
}>()
</script>

<template>
  <div class="mt-10 flex justify-end gap-3 border-t border-border pt-8">
    <button
      class="rounded-xl bg-surface-secondary px-8 py-3 text-sm font-extrabold text-text-dim transition-all hover:bg-surface-input"
      @click="hasConfig && emit('cancel')"
    >
      {{ t('admin.common.cancelChanges') }}
    </button>
    <button
      class="flex items-center gap-2 rounded-xl bg-[#0048B5] px-10 py-3 text-sm font-extrabold text-white shadow-button transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
      :disabled="saving"
      @click="emit('save')"
    >
      <Save v-if="!saving" class="h-4 w-4" />
      <span v-else class="animate-spin text-sm">⏳</span>
      {{ saving ? t('admin.common.saving') : t('admin.common.saveAllChanges') }}
    </button>
  </div>
</template>
