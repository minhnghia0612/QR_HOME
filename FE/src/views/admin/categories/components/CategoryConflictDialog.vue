<script setup lang="ts">
import { FolderOpen } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'yes'): void
  (e: 'no'): void
}>()

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="show" class="fixed inset-0 z-[60] bg-black/30" @click="emit('no')" />
    </Transition>
    <Transition name="scale-up">
      <div v-if="show" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div class="w-full max-w-sm rounded-[32px] bg-white p-8 text-center shadow-popup" @click.stop>
          <div class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-warning/10 text-warning">
            <FolderOpen class="h-8 w-8" />
          </div>
          <h3 class="mb-2 text-xl font-bold text-text-primary">{{ t('admin.categories.existsTitle') }}</h3>
          <p class="mb-8 text-sm text-text-secondary">{{ t('admin.categories.existsHint') }}</p>
          
          <div class="flex gap-3">
            <button
              class="flex-1 rounded-2xl bg-gradient-to-b from-primary-600 to-[#0048B5] py-3 text-sm font-extrabold text-white shadow-button transition-all hover:brightness-110"
              @click="emit('yes')"
            >
              {{ t('admin.categories.yesEdit') }}
            </button>
            <button
              class="flex-1 rounded-2xl bg-surface-secondary py-3 text-sm font-bold text-text-dim transition-all hover:bg-surface-input"
              @click="emit('no')"
            >
              {{ t('admin.categories.noCancel') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.scale-up-enter-active { transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1); }
.scale-up-leave-active { transition: all 0.15s ease-in; }
.scale-up-enter-from, .scale-up-leave-to { opacity: 0; transform: scale(0.95); }
</style>
