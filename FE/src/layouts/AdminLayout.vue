<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useQuery } from '@tanstack/vue-query'
import { qrConfigApi } from '@/api/qr-config.api'
import { categoriesApi } from '@/api/categories.api'
import { servicesApi } from '@/api/services.api'
import { LayoutDashboard, BookOpen, Settings, LogOut, Menu, X } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const sidebarOpen = ref(false)

// Config Status
const { data: configRes } = useQuery({
  queryKey: ['admin-config'],
  queryFn: async () => {
    const { data } = await qrConfigApi.getConfig()
    return (data as any).data || data
  },
})

// Categories Status
const { data: catsRes } = useQuery({
  queryKey: ['admin-categories'],
  queryFn: async () => {
    const { data } = await categoriesApi.getAll()
    return (data as any).data || data
  },
})

// Services Status
const { data: servicesRes } = useQuery({
  queryKey: ['admin-services'],
  queryFn: async () => {
    const { data } = await servicesApi.getAll()
    return (data as any).data || data
  },
})

// Step Completion Logic
const isStep1Complete = computed(() => !!configRes.value?.spaName && !!configRes.value?.spaPhone)
const isStep2Complete = computed(() => !!catsRes.value?.length && catsRes.value.length > 0)
const isStep3Complete = computed(() => {
  const items = servicesRes.value?.items || servicesRes.value
  return !!items?.length && items.length > 0
})

const isSetupComplete = computed(() => isStep1Complete.value && isStep2Complete.value && isStep3Complete.value)

// Dynamic Navigation (Simplified Order: Dashboard -> Categories -> Services -> Settings)
const availableNavLinks = computed(() => {
  const allLinks = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, visible: isStep3Complete.value },
    { to: '/admin/categories', label: 'Categories', icon: BookOpen, visible: isStep1Complete.value },
    { to: '/admin/services', label: 'Service Manager', icon: BookOpen, visible: isStep2Complete.value },
    { to: '/admin/qr', label: 'Settings', icon: Settings, visible: true },
  ]
  
  return allLinks.filter(link => link.visible)
})

const currentRoute = computed(() => route.path)

function isActive(path: string) {
  return currentRoute.value === path || currentRoute.value.startsWith(path + '/')
}

function logout() {
  authStore.logout()
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
          Admin Panel
        </h1>
        <p class="mt-0.5 text-xs font-medium text-text-muted opacity-70">
          Service Management
        </p>
      </div>

      <!-- Nav -->
      <nav class="flex flex-1 flex-col gap-1 pt-2">
        <router-link
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
        <div v-if="!isSetupComplete" class="mt-6 px-4 py-4 rounded-xl bg-primary-50/30 border border-primary-100/30">
          <p class="text-[10px] font-bold text-primary-800 uppercase tracking-widest mb-1.5 flex items-center gap-2">
            <span class="flex h-1.5 w-1.5 rounded-full bg-primary-500 animate-pulse"></span>
            Setup Progress
          </p>
          <div class="space-y-2">
             <div class="flex items-center justify-between text-[9px] text-text-muted">
               <span>Business Profile</span>
               <span v-if="isStep1Complete" class="text-success-600 font-bold">Done</span>
               <span v-else class="text-primary-400">Step 1</span>
             </div>
             <div class="flex items-center justify-between text-[9px] text-text-muted">
               <span>Categories</span>
               <span v-if="isStep2Complete" class="text-success-600 font-bold">Done</span>
               <span v-else class="text-primary-400">Step 2</span>
             </div>
             <div class="flex items-center justify-between text-[9px] text-text-muted">
               <span>Services</span>
               <span v-if="isStep3Complete" class="text-success-600 font-bold">Done</span>
               <span v-else class="text-primary-400">Step 3</span>
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
          Logout
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
            QRHome Admin
          </span>
        </div>
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2 text-sm text-text-secondary">
            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-surface-input text-xs font-bold text-primary-600">
              {{ authStore.admin?.username?.charAt(0)?.toUpperCase() || 'A' }}
            </div>
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
