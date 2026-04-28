<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Settings as SettingsIcon, Image as ImageIcon, Upload, AlertCircle } from 'lucide-vue-next'
import type { CurrencyUnit } from '@/composables/settings/useSettingsForm'

const { t } = useI18n({ useScope: 'global' })

const props = defineProps<{
  form: any
  phoneError: string
  uploadLoading: string | null
}>()

const emit = defineEmits<{
  (e: 'validate-phone'): void
  (e: 'upload', event: Event, field: 'spaLogo' | 'bannerUrl'): void
  (e: 'drop', event: DragEvent, field: 'spaLogo' | 'bannerUrl'): void
}>()

const isDraggingLogo = ref(false)
const isDraggingBanner = ref(false)
</script>

<template>
  <div class="space-y-6">
    <div class="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-border">
      <div class="mb-8 flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
          <SettingsIcon class="h-5 w-5" />
        </div>
        <h3 class="text-lg font-bold text-text-primary">{{ t('admin.settings.basicInfo') }}</h3>
      </div>

      <div class="space-y-6">
        <!-- Logo Section -->
        <div class="flex items-center gap-6">
          <div 
            class="relative h-20 w-20 overflow-hidden rounded-2xl transition-all"
            :class="[isDraggingLogo ? 'ring-2 ring-primary-600 bg-primary-50/50' : 'bg-surface-input']"
            @dragover.prevent="isDraggingLogo = true"
            @dragleave.prevent="isDraggingLogo = false"
            @drop.prevent="e => { isDraggingLogo = false; emit('drop', e, 'spaLogo') }"
          >
            <img v-if="form.spaLogo" :src="form.spaLogo" class="h-full w-full object-cover" />
            <div v-else class="flex h-full w-full items-center justify-center text-2xl">⠿</div>
            <label class="absolute bottom-1 right-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-border hover:bg-surface-input">
              <Upload class="h-3 w-3 text-text-primary" />
              <input type="file" accept="image/*" class="hidden" :disabled="uploadLoading === 'spaLogo'" @change="e => emit('upload', e, 'spaLogo')" />
            </label>
          </div>
          <div>
            <p class="font-bold text-text-primary text-sm">{{ t('admin.settings.logo') }}</p>
            <p class="text-xs text-text-muted mt-1">{{ uploadLoading === 'spaLogo' ? t('admin.settings.uploadingLogo') : t('admin.settings.logoHint') }}</p>
          </div>
        </div>

        <!-- Name -->
        <div>
          <label class="mb-1.5 block text-xs font-bold text-text-secondary uppercase tracking-wider">{{ t('admin.settings.storeName') }}</label>
          <input
            v-model="form.spaName"
            type="text"
            :placeholder="t('admin.settings.storeNamePlaceholder')"
            class="w-full rounded-xl border-0 bg-surface-input px-4 py-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary-600"
          />
        </div>

        <!-- Address -->
        <div>
          <label class="mb-1.5 block text-xs font-bold text-text-secondary uppercase tracking-wider">{{ t('admin.common.address') }}</label>
          <input
            v-model="form.spaAddress"
            type="text"
            :placeholder="t('admin.settings.addressPlaceholder')"
            class="w-full rounded-xl border-0 bg-surface-input px-4 py-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary-600"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="relative">
            <label class="mb-1.5 block text-xs font-bold text-text-secondary uppercase tracking-wider">{{ t('admin.common.phone') }}</label>
            <div class="relative">
              <input
                v-model="form.spaPhone"
                type="text"
                placeholder="098 765 4321"
                :class="[
                  'w-full rounded-xl border-0 bg-surface-input px-4 py-3 text-sm text-text-primary outline-none transition-all duration-200',
                  phoneError 
                    ? 'bg-danger/5 ring-2 ring-danger/20 text-danger placeholder:text-danger/40' 
                    : 'focus:ring-2 focus:ring-primary-600'
                ]"
                @blur="emit('validate-phone')"
                @input="emit('validate-phone')"
              />
              <AlertCircle 
                v-if="phoneError"
                class="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-danger animate-pulse"
              />
            </div>
            <Transition name="fade-slide">
              <p
                v-if="phoneError"
                class="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold text-danger"
              >
                {{ phoneError }}
              </p>
            </Transition>
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-bold text-text-secondary uppercase tracking-wider">{{ t('admin.common.email') }}</label>
            <input
              v-model="form.spaEmail"
              type="text"
              :placeholder="t('admin.settings.emailPlaceholder')"
              class="w-full rounded-xl border-0 bg-surface-input px-4 py-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary-600"
            />
          </div>
        </div>

        <div>
          <label class="mb-1.5 block text-xs font-bold text-text-secondary uppercase tracking-wider">{{ t('admin.settings.currencyUnit') }}</label>
          <div class="flex w-fit items-center gap-1.5 rounded-2xl bg-surface-input p-1.5 ring-1 ring-border">
            <button
              v-for="unit in ['VND', 'USD', 'EUR']"
              :key="unit"
              type="button"
              :class="[
                'min-w-[90px] rounded-xl px-4 py-2.5 text-[11px] font-black tracking-widest transition-all',
                form.currencyUnit === unit
                  ? 'bg-primary-600 text-white shadow-button ring-1 ring-primary-500'
                  : 'text-text-secondary hover:bg-white hover:text-text-primary hover:shadow-card'
              ]"
              @click="form.currencyUnit = unit as CurrencyUnit"
            >
              {{ unit }}
            </button>
          </div>
        </div>

        <!-- Banner Upload -->
        <div>
          <label class="mb-1.5 block text-xs font-bold text-text-secondary uppercase tracking-wider">{{ t('admin.settings.banner') }}</label>
          <label 
            class="flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 transition-colors" 
            :class="[
              uploadLoading === 'bannerUrl' ? 'opacity-70 pointer-events-none' : '',
              isDraggingBanner ? 'border-primary-600 bg-primary-50/50' : 'border-border bg-surface-input hover:border-primary-600'
            ]"
            @dragover.prevent="isDraggingBanner = true"
            @dragleave.prevent="isDraggingBanner = false"
            @drop.prevent="e => { isDraggingBanner = false; emit('drop', e, 'bannerUrl') }"
          >
            <template v-if="!form.bannerUrl">
              <div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-600 mb-3">
                <ImageIcon class="h-6 w-6" />
              </div>
              <p class="text-sm font-bold text-text-primary">{{ uploadLoading === 'bannerUrl' ? t('admin.settings.uploadingBanner') : t('admin.settings.uploadHint') }}</p>
              <p class="mt-1 text-xs text-text-muted">{{ t('admin.settings.bannerHint') }}</p>
            </template>
            <img v-else :src="form.bannerUrl" class="max-h-32 rounded-lg object-contain" />
            <input type="file" accept="image/*" class="hidden" :disabled="uploadLoading === 'bannerUrl'" @change="e => emit('upload', e, 'bannerUrl')" />
          </label>
        </div>

        <!-- Welcome Message -->
        <div>
          <label class="mb-1.5 block text-xs font-bold text-text-secondary uppercase tracking-wider">{{ t('admin.settings.welcomeMessage') }}</label>
          <div class="rounded-2xl bg-surface-input p-4">
            <textarea
              v-model="form.welcomeMessage"
              rows="4"
              :placeholder="t('admin.settings.welcomePlaceholder')"
              class="w-full resize-none border-0 bg-transparent p-0 text-sm text-text-secondary outline-none placeholder:text-text-muted"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-slide-enter-active, .fade-slide-leave-active {
  transition: all 0.3s ease;
}
.fade-slide-enter-from, .fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
