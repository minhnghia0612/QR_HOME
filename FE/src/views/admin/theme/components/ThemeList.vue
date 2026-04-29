<script setup lang="ts">
import { CheckCircle2 } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { THEMES } from '@/constants/theme.constant'

const props = defineProps<{
  modelValue: string
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <div class="w-full min-h-0 rounded-3xl bg-white shadow-sm ring-1 ring-border lg:w-1/2 lg:overflow-hidden">
    <div class="p-6 border-b border-border bg-surface-page/50 flex-shrink-0">
      <h3 class="text-lg font-bold text-text-primary">{{ t('admin.theme.sectionTitle') }}</h3>
    </div>
    <div class="p-6 lg:flex-1 lg:overflow-y-auto">
      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="i in 8"
          :key="`theme-skeleton-${i}`"
          class="rounded-2xl border border-border bg-white p-5"
        >
          <div class="flex gap-4">
            <div class="h-10 w-10 rounded-full bg-surface-input animate-pulse"></div>
            <div class="flex-1">
              <div class="h-4 w-24 rounded bg-surface-input animate-pulse"></div>
              <div class="mt-2 h-3 w-full rounded bg-surface-input animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="theme in THEMES" :key="theme.id"
          @click="emit('update:modelValue', theme.id)"
          class="relative cursor-pointer rounded-2xl border-2 p-5 transition-all"
          :class="modelValue === theme.id ? 'border-primary-500 bg-primary-50/30' : 'border-border bg-white hover:border-text-muted hover:bg-surface-page'"
        >
          <div class="flex gap-4">
            <div class="h-10 w-10 flex-shrink-0 rounded-full" :style="{ backgroundColor: theme.color }"></div>
            <div>
              <div class="flex items-center gap-2">
                <h4 class="font-bold text-text-primary" :class="modelValue === theme.id ? 'text-primary-700' : ''">{{ theme.name }}</h4>
              </div>
              <p class="mt-1 flex-1 text-xs text-text-secondary line-clamp-2 leading-relaxed">{{ theme.desc }}</p>
            </div>
          </div>

          <!-- Active Check -->
          <div v-if="modelValue === theme.id" class="absolute right-3 top-3 text-primary-500">
            <CheckCircle2 class="h-5 w-5" />
          </div>
        </div>
      </div>
      
      <slot name="customizer"></slot>
    </div>
  </div>
</template>
