<script setup lang="ts">
import { Pencil, Trash2 } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import imgFallback from '@/assets/img_fallback.png'
import { useServiceLocale } from '@/composables/useServiceLocale'
import { getServiceLabelItems, getLabelBadgeClass, getServiceDisplayPrice } from '@/utils/service.utils'

const props = defineProps<{
  services: any[]
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle-status', svc: any): void
  (e: 'open-edit', svc: any): void
  (e: 'delete', id: string): void
}>()

const { t } = useI18n({ useScope: 'global' })
const { getServiceName, getServiceShortDescription, getServiceDescription, getServiceSpecialTags } = useServiceLocale()

function handleImgError(e: Event) {
  const target = e.target as HTMLImageElement
  if (target.src !== imgFallback) {
    target.src = imgFallback
  }
}
</script>

<template>
  <div v-if="loading" class="grid grid-cols-1 gap-6 xl:grid-cols-2">
    <div
      v-for="i in 4"
      :key="`svc-skeleton-${i}`"
      class="relative flex items-center overflow-hidden rounded-[24px] bg-white p-5 shadow-sm ring-1 ring-border"
    >
      <div class="h-32 w-32 flex-shrink-0 rounded-[20px] bg-surface-input animate-pulse"></div>
      <div class="ml-5 flex flex-1 flex-col gap-3">
        <div class="h-5 w-2/3 rounded bg-surface-input animate-pulse"></div>
        <div class="h-3 w-1/3 rounded bg-surface-input animate-pulse"></div>
        <div class="h-3 w-full rounded bg-surface-input animate-pulse"></div>
        <div class="h-3 w-5/6 rounded bg-surface-input animate-pulse"></div>
        <div class="mt-3 h-6 w-28 rounded bg-surface-input animate-pulse"></div>
      </div>
    </div>
  </div>
  <div v-else-if="!services.length" class="flex flex-col items-center justify-center rounded-3xl bg-white py-20 text-center shadow-card">
    <p class="text-lg font-bold text-text-primary">{{ t('menu.noServicesFound') }}</p>
    <p class="mt-1 text-sm text-text-muted">{{ t('admin.serviceManager.emptyHint') }}</p>
  </div>
  <div v-else class="grid grid-cols-1 gap-6 xl:grid-cols-2">
    <div
      v-for="svc in services"
      :key="svc.id"
      class="group relative flex items-center overflow-hidden rounded-[24px] bg-white p-5 shadow-sm ring-1 ring-border transition-all hover:shadow-card"
    >
      <!-- Horizontal Image -->
      <div class="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-[20px] bg-surface-input">
        <img
          :src="svc.imageUrl || imgFallback"
          :alt="svc.name"
          class="h-full w-full object-cover"
          @error="handleImgError"
        />
        
        <!-- Inactive Overlay -->
        <div v-if="!svc.isActive" class="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <span class="rounded-full bg-white/20 px-2 py-0.5 text-[8px] font-black uppercase text-white backdrop-blur-md">{{ t('admin.common.inactive') }}</span>
        </div>
      </div>

      <!-- Content Right -->
      <div class="ml-5 flex flex-1 flex-col justify-between self-stretch py-1">
        <div class="relative">
          <router-link :to="`/menu/${svc.storeId}?service=${svc.id}`" class="block">
            <h4 class="pr-8 text-lg font-bold leading-tight text-text-primary line-clamp-1 hover:text-primary-600">{{ getServiceName(svc) }}</h4>
          </router-link>
          
          <!-- Badges -->
          <div class="mt-1.5 flex flex-wrap gap-1.5">
            <span
              v-for="label in getServiceLabelItems(svc, getServiceSpecialTags, t)"
              :key="label.key"
              :class="['rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider', getLabelBadgeClass(label.key)]"
            >
              {{ label.label }}
            </span>
          </div>

          <p class="mt-2 line-clamp-2 text-sm leading-relaxed text-text-secondary">
            {{ getServiceShortDescription(svc) || getServiceDescription(svc) || t('admin.serviceManager.noDescription') }}
          </p>
        </div>
        
        <div class="mt-3 flex items-center justify-between">
          <div>
            <span class="text-xl font-black text-[#0048B5]">{{ getServiceDisplayPrice(svc) }}</span>
          </div>
          <button
            @click="emit('toggle-status', svc)"
            :class="[
              'relative h-6 w-10 rounded-full transition-colors duration-300',
              svc.isActive ? 'bg-primary-600' : 'bg-surface-input ring-1 ring-inset ring-border'
            ]"
          >
            <span
              :class="[
                'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300',
                svc.isActive ? 'translate-x-4' : 'translate-x-0'
              ]"
            />
          </button>
        </div>
      </div>

      <!-- Float Actions Menu/Button -->
      <div class="absolute right-4 top-5 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
         <button
          @click="emit('open-edit', svc)"
          class="flex h-8 w-8 items-center justify-center rounded-full bg-white text-text-primary shadow-sm ring-1 ring-border hover:bg-surface-input"
          :title="t('admin.serviceManager.edit')"
        >
          <Pencil class="h-3.5 w-3.5" />
        </button>
        <button
          @click="emit('delete', svc.id)"
          class="flex h-8 w-8 items-center justify-center rounded-full bg-danger/10 text-danger shadow-sm ring-1 ring-danger/20 hover:bg-danger/20"
          :title="t('admin.serviceManager.delete')"
        >
          <Trash2 class="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  </div>
</template>
