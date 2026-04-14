<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLocale, type AppLocale, SUPPORTED_LOCALES } from '@/i18n'
import { ChevronDown, Globe } from 'lucide-vue-next'

const { locale, t } = useI18n({ useScope: 'global' })
const isOpen = ref(false)
const containerRef = ref<HTMLElement | null>(null)

const currentLocale = computed(() => locale.value as AppLocale)

const localesInfo = [
  { code: 'vi', label: 'Tiếng Việt', flag: 'vn' },
  { code: 'en', label: 'English', flag: 'us' },
  { code: 'de', label: 'Deutsch', flag: 'de' },
]

const currentInfo = computed(() => {
  return localesInfo.find(l => l.code === currentLocale.value) || localesInfo[1]
})

function selectLocale(code: string) {
  setLocale(code as AppLocale)
  isOpen.value = false
}

// Close on outside click
if (typeof window !== 'undefined') {
  window.addEventListener('click', (e) => {
    if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
      isOpen.value = false
    }
  })
}
</script>

<template>
  <div class="relative" ref="containerRef">
    <button 
      @click="isOpen = !isOpen"
      class="flex items-center gap-2 rounded-2xl bg-white/80 px-3 py-2 text-xs font-bold text-text-primary shadow-lg ring-1 ring-border backdrop-blur-xl transition-all hover:bg-white active:scale-95"
    >
      <img 
        :src="`https://flagcdn.com/w40/${currentInfo.flag}.png`" 
        class="h-3 w-4.5 object-cover rounded-sm shadow-sm" 
        alt="flag"
      />
      <span class="hidden sm:inline">{{ currentInfo.label }}</span>
      <ChevronDown :class="['h-3 w-3 transition-transform text-text-muted', isOpen ? 'rotate-180' : '']" />
    </button>

    <Transition name="fade-down">
      <div v-if="isOpen" class="absolute right-0 mt-2 w-48 overflow-hidden rounded-2xl border border-border bg-white shadow-2xl ring-1 ring-black/5 z-50">
        <div class="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-text-muted opacity-50 border-b border-border/50">
          {{ t('common.language') }}
        </div>
        <button 
          v-for="item in localesInfo" 
          :key="item.code"
          @click="selectLocale(item.code)"
          :class="[
            'flex w-full items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-surface-input',
            currentLocale === item.code ? 'bg-primary-50 font-bold text-primary-700' : 'text-text-primary'
          ]"
        >
          <img 
            :src="`https://flagcdn.com/w40/${item.flag}.png`" 
            class="h-4 w-6 object-cover rounded-sm shadow-xs" 
            alt="flag"
          />
          <span>{{ item.label }}</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-down-enter-active,
.fade-down-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-down-enter-from,
.fade-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
