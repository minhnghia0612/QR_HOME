<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { SUPPORTED_LOCALES, type AppLocale } from '@/i18n'

const props = defineProps<{
  show: boolean
  editingCategory: any
  isSaving: boolean
  form: any
  hasLocaleContent: (loc: AppLocale) => boolean
}>()

const formLocaleLang = defineModel<AppLocale>('formLocaleLang', { required: true })
const activeLocaleName = defineModel<string>('activeLocaleName', { required: true })

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save'): void
}>()

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="show" class="fixed inset-0 z-40 bg-black/30" @click="emit('close')" />
    </Transition>
    <Transition name="scale-up">
      <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="w-full max-w-md rounded-3xl bg-white p-6 shadow-popup" @click.stop>
          <div class="mb-6 flex items-center justify-between">
            <h3 class="text-lg font-bold text-text-primary">
              {{ editingCategory ? t('admin.categories.editCategory') : t('admin.categories.newCategory') }}
            </h3>
            <button class="rounded-lg p-1.5 text-text-muted hover:bg-surface-input" @click="emit('close')">
              <X class="h-5 w-5" />
            </button>
          </div>

          <div class="space-y-4">
            <!-- Language Tabs -->
            <div class="flex overflow-hidden rounded-xl border border-border bg-surface-input">
              <button
                v-for="loc in SUPPORTED_LOCALES"
                :key="loc"
                type="button"
                @click="formLocaleLang = loc"
                :class="[
                  'relative flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition-all',
                  formLocaleLang === loc
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'text-text-muted hover:text-text-primary',
                ]"
              >
                <span>{{ t(`common.languages.${loc}`) }}</span>
                <span
                  v-if="hasLocaleContent(loc)"
                  :class="[
                    'absolute right-2 top-2 h-1.5 w-1.5 rounded-full',
                    formLocaleLang === loc ? 'bg-primary-500' : 'bg-emerald-400',
                  ]"
                />
              </button>
            </div>

            <div>
              <label class="mb-1.5 block text-sm font-medium text-text-secondary">{{ t('admin.common.name') }}</label>
              <input
                v-model="activeLocaleName"
                type="text"
                :placeholder="t('admin.categories.namePlaceholder')"
                class="w-full rounded-lg border-0 bg-surface-input px-4 py-3 text-sm text-text-primary outline-none ring-1 ring-transparent placeholder:text-text-muted focus:ring-2 focus:ring-primary-600"
                @keyup.enter="emit('save')"
              />
            </div>
          </div>

          <div class="mt-6 flex gap-3">
            <button
              class="flex-1 rounded-xl bg-gradient-to-b from-primary-600 to-[#0048B5] py-3 text-sm font-extrabold text-white shadow-button transition-all hover:brightness-110 disabled:opacity-50"
              :disabled="isSaving || !form.name"
              @click="emit('save')"
            >
              {{ isSaving ? t('admin.common.saving') : t('admin.common.save') }}
            </button>
            <button
              class="flex-1 rounded-xl bg-surface-secondary py-3 text-sm font-bold text-text-dim transition-all hover:bg-surface-input"
              @click="emit('close')"
            >
              {{ t('admin.common.cancel') }}
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
