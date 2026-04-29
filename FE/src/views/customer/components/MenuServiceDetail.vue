<script setup lang="ts">
import { Teleport, Transition } from 'vue'
import { useI18n } from 'vue-i18n'
import { useServiceLocale } from '@/composables/useServiceLocale'
import { Clock, DollarSign, X } from 'lucide-vue-next'
import { imgFallback as imgFallbackAsset, handleImgError } from '@/utils/image.utils'

interface VariantOption {
  name: string
  price: number
}

interface Props {
  show: boolean
  service: any | null
  menuSize: string
  customerInterfaceStyle: Record<string, string>
  themeId: string
  getServiceDisplayPrice: (svc: any) => string
  formatCurrencySingle: (value: number) => string
  getServiceLabelItems: (svc: any) => { key: string; label: string }[]
  getBadgeClasses: (key: string) => string
  getDetailVariantOptions: (svc: any) => VariantOption[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { t } = useI18n({ useScope: 'global' })
const { getServiceName, getServiceDescription } = useServiceLocale()


</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="show && service"
        :class="[
          'fixed inset-0 z-50 flex justify-center items-start bg-black/60 backdrop-blur-sm overflow-y-auto',
          `theme-${themeId}`,
        ]"
      >
        <div
          :class="[
            'menu-detail-root relative w-full max-w-[800px] min-h-screen bg-surface-page shadow-2xl flex flex-col',
            `menu-size-${menuSize}`,
          ]"
          :style="customerInterfaceStyle"
        >
          <!-- Close Button -->
          <button
            @click="emit('close')"
            class="absolute right-5 top-5 z-[60] flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-all active:scale-90"
          >
            <X class="h-5 w-5" />
          </button>

          <!-- Full Width Hero Image -->
          <div class="relative w-full overflow-hidden h-[360px] shadow-lg bg-surface-input flex-shrink-0">
            <img
              :src="service.imageUrl || imgFallbackAsset"
              :alt="service.name"
              class="h-full w-full object-cover"
              @error="handleImgError"
            />
          </div>

          <!-- Content -->
          <div class="relative -mt-6 rounded-t-[28px] bg-surface-page px-6 pt-6 pb-20 flex-1">
            <h2 class="text-3xl font-black tracking-tight text-text-primary leading-tight break-all">
              {{ getServiceName(service) }}
            </h2>

            <!-- Badges -->
            <div v-if="getServiceLabelItems(service).length" class="mt-4 flex flex-wrap gap-2">
              <span
                v-for="label in getServiceLabelItems(service)"
                :key="label.key"
                :class="['inline-flex items-center rounded-full px-3 py-1 text-[11px] font-extrabold', getBadgeClasses(label.key)]"
              >
                {{ label.label }}
              </span>
            </div>

            <!-- Quick Info Pills -->
            <div class="mt-6 flex flex-wrap gap-3">
              <div class="flex items-center gap-2 rounded-2xl bg-surface-input px-5 py-3.5">
                <Clock class="h-4 w-4 text-primary-600" />
                <span class="text-sm font-black text-text-primary">
                  {{ service.duration || 60 }} {{ t('menu.minutes') }}
                </span>
              </div>
              <div
                v-if="getServiceDisplayPrice(service)"
                class="flex items-center gap-2 rounded-2xl bg-surface-input px-5 py-3.5"
              >
                <div class="flex h-5 w-5 items-center justify-center rounded-md bg-badge-bestseller-bg/20 text-[#B44CFF]">
                  <DollarSign class="h-3.5 w-3.5" />
                </div>
                <span class="text-sm font-black text-text-primary">
                  {{ getServiceDisplayPrice(service) }}
                </span>
              </div>
            </div>

            <!-- Description -->
            <div class="mt-10">
              <h3 class="mb-5 text-xs font-black uppercase tracking-[0.2em] text-text-muted">
                {{ t('menu.description') }}
              </h3>
              <p class="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-text-secondary font-medium">
                {{ getServiceDescription(service) }}
              </p>
            </div>

            <!-- Variant Options -->
            <div v-if="getDetailVariantOptions(service).length" class="mt-8">
              <h3 class="mb-4 text-xs font-black uppercase tracking-[0.2em] text-text-muted">
                {{ t('menu.options') }}
              </h3>
              <div class="space-y-2">
                <div
                  v-for="(opt, index) in getDetailVariantOptions(service)"
                  :key="`${opt.name}-${index}`"
                  class="flex items-center justify-between rounded-xl bg-surface-input px-4 py-3"
                >
                  <span class="text-sm font-bold text-text-primary">{{ opt.name }}</span>
                  <span class="text-sm font-black text-primary-700">
                    {{ formatCurrencySingle(opt.price) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* .modal-fade transition */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.22s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-active .menu-detail-root,
.modal-fade-leave-active .menu-detail-root {
  transition: transform 0.24s cubic-bezier(0.22, 0.8, 0.22, 1), opacity 0.24s ease;
  will-change: transform, opacity;
}
.modal-fade-enter-from .menu-detail-root,
.modal-fade-leave-to .menu-detail-root {
  transform: translateY(12px) scale(0.995);
  opacity: 0.96;
}

/* Font inheritance via global .menu-detail-root rule in style.css */
</style>
