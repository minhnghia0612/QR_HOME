<script setup lang="ts">
import { Hammer } from 'lucide-vue-next'
import { onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n({ useScope: 'global' })

defineProps<{
  spaName?: string
}>()

onMounted(() => {
  document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#FDFCFB] px-6 text-center">
    <!-- Background Aesthetic Elements (Blurs/Gradients) -->
    <div class="absolute -left-20 top-1/4 h-64 w-64 rounded-full bg-[#f395ee]/20 blur-[100px]"></div>
    <div class="absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-[#789dff]/20 blur-[120px]"></div>

    <div class="relative z-10 flex flex-col items-center max-w-2xl">
      <!-- Visual Anchor -->
      <div class="mb-10 flex h-20 w-20 items-center justify-center rounded-[24px] bg-white shadow-[0_16px_32px_rgba(44,47,50,0.06)] ring-1 ring-black/5">
        <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0253CD]/10 text-[#0253CD]">
          <Hammer class="h-6 w-6" />
        </div>
      </div>

      <!-- Content -->
      <div class="space-y-4">
        <p class="text-sm font-semibold uppercase tracking-[0.2em] text-[#0253CD]">
          {{ t('maintenance.badge') }}
        </p>
        <h1 class="text-5xl md:text-6xl font-extrabold tracking-tight text-[#2C2F32] leading-[1.1]">
          {{ t('maintenance.title') }}
        </h1>
        <p class="mt-8 text-lg md:text-lg font-medium text-[#595C5E] leading-relaxed mx-auto max-w-lg">
          {{ t('maintenance.description') }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
h1 {
  font-family: 'Manrope', 'Inter', sans-serif;
}
</style>
