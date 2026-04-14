<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useQuery } from '@tanstack/vue-query'
import { qrConfigApi } from '@/api/qr-config.api'
import { categoriesApi } from '@/api/categories.api'
import { servicesApi } from '@/api/services.api'
import { LayoutDashboard, BookOpen, Settings, LogOut, Menu, X, Palette, Globe, ChevronDown } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { SUPPORTED_LOCALES, setLocale, type AppLocale } from '@/i18n'

const { t, locale } = useI18n()
const showLangMenu = ref(false)
const langMenuRef = ref<HTMLElement | null>(null)

const route = useRoute()
const router = useRouter()

const currentLangData = computed(() => {
  if (locale.value === 'vi') return { label: 'Tiếng Việt', flag: 'vn' }
  if (locale.value === 'de') return { label: 'Deutsch', flag: 'de' }
  return { label: 'English', flag: 'us' }
})

function changeLanguage(lang: AppLocale) {
  setLocale(lang)
  showLangMenu.value = false
}

// Close lang menu on outside click
if (typeof window !== 'undefined') {
  window.addEventListener('click', (e) => {
    if (langMenuRef.value && !langMenuRef.value.contains(e.target as Node)) {
      showLangMenu.value = false
    }
  })
}

const authStore = useAuthStore()
const sidebarOpen = ref(false)

// Config Status
const { data: configRes, isLoading: loadingConfig } = useQuery({
  queryKey: ['qr-config'],
  queryFn: async () => {
    const { data } = await qrConfigApi.getConfig()
    return (data as any).data || data
  },
  staleTime: 0,
  refetchOnMount: 'always',
  refetchOnWindowFocus: false,
})

// Categories Status
const { data: catsRes, isLoading: loadingCats } = useQuery({
  queryKey: ['categories'],
  queryFn: async () => {
    const { data } = await categoriesApi.getAll()
    return (data as any).data || data
  },
  staleTime: 0,
  refetchOnMount: 'always',
  refetchOnWindowFocus: false,
})

// Services Status
const { data: servicesRes, isLoading: loadingServices } = useQuery({
  queryKey: ['nav-services-count'],
  queryFn: async () => {
    const { data } = await servicesApi.getAll({ limit: 1 })
    return (data as any).data || data
  },
  staleTime: 0,
  refetchOnMount: 'always',
  refetchOnWindowFocus: false,
})

// Step Completion Logic
const isStep1Complete = computed(() => !!configRes.value?.spaName && !!configRes.value?.spaPhone)
const isStep2Complete = computed(() => !!catsRes.value?.length && catsRes.value.length > 0)
const isStep3Complete = computed(() => {
  const items = servicesRes.value?.items || servicesRes.value
  return !!items?.length && items.length > 0
})

const isSetupComplete = computed(() => isStep1Complete.value && isStep2Complete.value && isStep3Complete.value)
const navLoading = computed(() => loadingConfig.value || loadingCats.value || loadingServices.value)

// Dynamic Navigation (Simplified Order: Dashboard -> Categories -> Services -> Settings)
const availableNavLinks = computed(() => {
  const allLinks = [
    { to: '/admin/dashboard', label: t('admin.common.nav.dashboard'), icon: LayoutDashboard, visible: isStep3Complete.value },
    { to: '/admin/categories', label: t('admin.common.nav.categories'), icon: BookOpen, visible: isStep1Complete.value },
    { to: '/admin/services', label: t('admin.common.nav.services'), icon: BookOpen, visible: isStep2Complete.value },
    { to: '/admin/qr', label: t('admin.common.nav.settings'), icon: Settings, visible: true },
    { to: '/admin/themes', label: t('admin.common.nav.themeSettings'), icon: Palette, visible: isStep3Complete.value },
  ]
  
  return allLinks.filter(link => link.visible)
})

const currentRoute = computed(() => route.path)

function isActive(path: string) {
  return currentRoute.value === path || currentRoute.value.startsWith(path + '/')
}

async function logout() {
  await authStore.logout()
}
</script>

<template>
  <div class="flex min-h-screen bg-surface-page">
    <!-- Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-border bg-surface-sidebar p-4 transition-transform duration-300 lg:static lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      ]"
    >
      <!-- Logo Area -->
      <div class="px-2 pb-8">
        <h1 class="text-lg font-black tracking-tight text-primary-700">
          {{ t('admin.common.layout.adminPanel') }}
        </h1>
        <p class="mt-0.5 text-xs font-medium text-text-muted opacity-70">
          {{ t('admin.common.layout.serviceManagement') }}
        </p>
      </div>

      <!-- Nav -->
      <nav class="flex flex-1 flex-col gap-1 pt-2">
        <template v-if="navLoading">
          <div
            v-for="i in 4"
            :key="`nav-skeleton-${i}`"
            class="h-10 rounded-lg bg-white/60 animate-pulse"
          ></div>
        </template>
        <router-link
          v-else
          v-for="link in availableNavLinks"
          :key="link.to"
          :to="link.to"
          :class="[
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
            isActive(link.to)
              ? 'bg-white text-primary-700 shadow-card'
              : 'text-text-dim hover:bg-white/60 hover:text-text-primary',
          ]"
          @click="sidebarOpen = false"
        >
          <component :is="link.icon" class="h-[18px] w-[18px]" />
          {{ link.label }}
        </router-link>

        <!-- Onboarding Hint (Subtle) -->
        <div v-if="!navLoading && !isSetupComplete" class="mt-6 px-4 py-4 rounded-xl bg-primary-50/30 border border-primary-100/30">
          <p class="text-[15px] font-bold text-primary-800 uppercase tracking-widest mb-1.5 flex items-center gap-2">
            <span class="flex h-1.5 w-1.5 rounded-full bg-primary-500 animate-pulse"></span>
            {{ t('admin.common.nav.setupProgress') }}
          </p>
          <div class="space-y-2">
             <div class="flex items-center justify-between text-[12px] text-text-muted">
               <span>{{ t('admin.common.nav.businessProfile') }}</span>
               <span v-if="isStep1Complete" class="text-success-600 font-bold">{{ t('admin.common.layout.done') }}</span>
               <span v-else class="text-primary-400">{{ t('admin.common.layout.step') }} 1</span>
             </div>
             <div class="flex items-center justify-between text-[12px] text-text-muted">
               <span>{{ t('admin.common.nav.categories') }}</span>
               <span v-if="isStep2Complete" class="text-success-600 font-bold">{{ t('admin.common.layout.done') }}</span>
               <span v-else class="text-primary-400">{{ t('admin.common.layout.step') }} 2</span>
             </div>
             <div class="flex items-center justify-between text-[12px] text-text-muted">
               <span>{{ t('admin.common.nav.services') }}</span>
               <span v-if="isStep3Complete" class="text-success-600 font-bold">{{ t('admin.common.layout.done') }}</span>
               <span v-else class="text-primary-400">{{ t('admin.common.layout.step') }} 3</span>
             </div>
          </div>
        </div>
      </nav>

      <!-- Bottom -->
      <div class="mt-auto border-t border-border pt-4">
        <button
          class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text-dim hover:bg-white/60 hover:text-danger"
          @click="logout"
        >
          <LogOut class="h-[18px] w-[18px]" />
          {{ t('admin.common.nav.logout') }}
        </button>
      </div>
    </aside>

    <!-- Overlay -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-20 bg-black/30 lg:hidden"
      @click="sidebarOpen = false"
    />

    <!-- Main -->
    <div class="flex flex-1 flex-col">
      <!-- Top Bar -->
      <header class="sticky top-0 z-10 flex items-center justify-between border-b border-border px-4 py-3 glass lg:px-8">
        <div class="flex items-center gap-4">
          <button
            class="rounded-lg p-1.5 text-text-muted hover:bg-surface-input lg:hidden"
            @click="sidebarOpen = !sidebarOpen"
          >
            <Menu v-if="!sidebarOpen" class="h-5 w-5" />
            <X v-else class="h-5 w-5" />
          </button>
          <span class="text-lg font-black uppercase tracking-tight text-primary-900">
            {{ t('admin.common.layout.qrHomeAdmin') }}
          </span>
        </div>
        <div class="flex items-center gap-6">
          <!-- Language Switcher -->
          <div class="relative" ref="langMenuRef">
            <button 
              @click="showLangMenu = !showLangMenu"
              class="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-bold text-text-primary transition-all hover:bg-surface-input active:scale-95"
            >
              <img 
                :src="`https://flagcdn.com/w40/${currentLangData.flag}.png`" 
                class="h-3 w-4.5 object-cover rounded-sm shadow-sm" 
                alt="flag"
              />
              <span>{{ currentLangData.label }}</span>
              <ChevronDown :class="['h-3 w-3 transition-transform', showLangMenu ? 'rotate-180' : '']" />
            </button>
            
            <transition name="fade-down">
              <div v-if="showLangMenu" class="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border border-border bg-white shadow-popup ring-1 ring-black/5">
                <button 
                  v-for="lang in SUPPORTED_LOCALES" 
                  :key="lang"
                  @click="changeLanguage(lang)"
                  :class="[
                    'flex w-full items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-surface-input',
                    locale === lang ? 'bg-primary-50 font-bold text-primary-700' : 'text-text-primary'
                  ]"
                >
                  <img 
                    :src="`https://flagcdn.com/w40/${lang === 'en' ? 'us' : lang === 'vi' ? 'vn' : lang}.png`" 
                    class="h-3.5 w-5 object-cover rounded-sm shadow-xs" 
                    alt="flag"
                  />
                  <span>{{ lang === 'vi' ? 'Tiếng Việt' : lang === 'de' ? 'Deutsch' : 'English' }}</span>
                </button>
              </div>
            </transition>
          </div>

          <div class="flex items-center gap-2 text-sm text-text-secondary">
            <div v-if="authStore.admin" class="flex h-8 w-8 items-center justify-center rounded-full bg-surface-input text-xs font-bold text-primary-600">
              {{ authStore.admin?.username?.charAt(0)?.toUpperCase() || 'A' }}
            </div>
            <div v-else class="h-8 w-8 rounded-full bg-surface-input animate-pulse"></div>
          </div>
        </div>
      </header>

      <!-- Content -->
      <main class="flex-1 p-4 lg:p-12">
        <router-view />
      </main>
    </div>
  </div>
</template>
