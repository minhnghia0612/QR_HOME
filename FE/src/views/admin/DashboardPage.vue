<script setup lang="ts">
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { trafficApi } from '@/api/traffic.api'
import { useAuthStore } from '@/stores/auth.store'
import { Download } from 'lucide-vue-next'
import { qrConfigApi } from '@/api/qr-config.api'
import { categoriesApi } from '@/api/categories.api'
import { servicesApi } from '@/api/services.api'
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

const authStore = useAuthStore()
const queryClient = useQueryClient()

const { data: dashboard } = useQuery({
  queryKey: ['dashboard'],
  queryFn: async () => {
    const { data } = await trafficApi.getDashboard()
    return data.data
  },
  refetchInterval: 30000,
})

const { data: topViewed } = useQuery({
  queryKey: ['top-viewed'],
  queryFn: async () => {
    const { data } = await trafficApi.getTopViewed()
    return data.data
  },
})

const { data: qrConfig } = useQuery({
  queryKey: ['qr-config'],
  queryFn: async () => {
    const { data } = await qrConfigApi.getConfig()
    return data.data
  },
})

const { data: categories } = useQuery({
  queryKey: ['categories'],
  queryFn: async () => {
    const { data } = await categoriesApi.getAll()
    return data.data
  }
})

const { data: services } = useQuery({
  queryKey: ['services-count'],
  queryFn: async () => {
    const { data } = await servicesApi.getAll({ limit: 1 })
    return data.data
  }
})

const { data: qrImageRes } = useQuery({
  queryKey: ['qr-image'],
  queryFn: async () => {
    const { data } = await qrConfigApi.downloadQr()
    return data.data
  },
  enabled: computed(() => qrConfig.value?.status === 'active' && !!qrConfig.value?.qrUrl),
})

const setupProgress = computed(() => {
  const steps = [
    { id: 'settings', label: 'Spa Information', done: !!qrConfig.value?.spaName, link: '/admin/qr' },
    { id: 'category', label: 'First Category', done: !!categories.value?.length, link: '/admin/categories' },
    { id: 'service', label: 'First Service', done: !!services.value?.total, link: '/admin/services' }
  ]
  const completed = steps.filter(s => s.done).length
  return { steps, completed, allDone: completed === steps.length }
})

const { mutate: updateQrStatus, isPending: updatingStatus } = useMutation({
  mutationFn: async (status: 'active' | 'paused' | 'inactive') => {
    await qrConfigApi.updateStatus(status)
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['qr-config'] })
  },
})

const maxBarValue = computed(() => {
  if (!dashboard.value?.weekly) return 1
  return Math.max(...dashboard.value.weekly.map((d: any) => d.count), 1)
})

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

async function downloadQr() {
  try {
    const { data } = await qrConfigApi.downloadQr()
    const url = data.data
    if (url) {
      const a = document.createElement('a')
      a.href = url
      a.download = 'qr-code.png'
      a.click()
    }
  } catch { /* skip */ }
}
</script>

<template>
  <div class="space-y-12">
    <!-- Welcome Section -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 class="text-4xl font-bold tracking-tight text-text-primary">
          Welcome, Spa Manager
        </h2>
        <p class="mt-2 text-base font-medium text-text-secondary">
          Your Spa management system is running smoothly today.
        </p>
      </div>
      <button
        class="flex items-center gap-2 rounded-xl bg-surface-secondary px-6 py-3 text-sm font-bold text-text-dim transition-all hover:bg-surface-input disabled:opacity-50"
        :disabled="!qrConfig"
        @click="downloadQr"
      >
        <Download class="h-4 w-4" />
        Download QR
      </button>
    </div>
    
    <!-- Setup Checklist (Only show if not complete) -->
    <div v-if="!setupProgress.allDone" class="grid grid-cols-1 gap-6 md:grid-cols-3">
      <div v-for="step in setupProgress.steps" :key="step.id" 
        class="relative overflow-hidden rounded-3xl border border-border bg-white p-6 shadow-sm transition-all hover:shadow-card"
        :class="{ 'opacity-70': step.done }"
      >
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl" 
            :class="step.done ? 'bg-success-50 text-success-600' : 'bg-primary-50 text-primary-600'"
          >
            <component :is="step.done ? 'CheckCircle2' : 'ArrowRight'" class="h-6 w-6" />
          </div>
          <div class="flex-1">
            <h4 class="text-sm font-black text-text-primary">{{ step.label }}</h4>
            <p class="text-[11px] font-bold text-text-secondary">
              {{ step.done ? 'Completed' : 'Requires Setup' }}
            </p>
          </div>
          <RouterLink v-if="!step.done" :to="step.link" 
            class="rounded-xl bg-primary-600 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-white shadow-button hover:brightness-110 active:scale-95"
          >
            Setup
          </RouterLink>
        </div>
      </div>
    </div>

    <!-- Bento Grid: Chart + QR Status -->
    <div class="flex flex-col gap-6 lg:flex-row">
      <!-- Traffic View Card -->
      <div class="flex-1 rounded-4xl bg-white p-8 shadow-card">
        <div class="mb-6">
          <h3 class="text-2xl font-bold tracking-tight text-text-primary">Traffic View</h3>
        </div>

        <!-- SKELETON: Bar Chart -->
        <div v-if="!dashboard" class="flex items-end gap-3 sm:gap-5" style="height: 200px;">
          <div v-for="i in 7" :key="i" class="flex flex-1 flex-col items-center gap-2">
            <div class="skeleton w-full rounded-t-xl" :style="{ height: [40, 70, 30, 90, 50, 80, 45][i-1] + '%' }"></div>
            <div class="skeleton h-3 w-8"></div>
          </div>
        </div>

        <!-- Bar Chart -->
        <div v-else class="flex items-end gap-3 sm:gap-5" style="height: 200px;">
          <div
            v-for="(day, i) in dashboard?.weekly"
            :key="i"
            class="flex flex-1 flex-col items-center gap-2"
          >
            <!-- Tooltip -->
            <span class="text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
              {{ day.count }}
            </span>
            <!-- Bar -->
            <div
              class="group relative w-full cursor-pointer rounded-t-xl transition-all hover:opacity-80"
              :class="i === (dashboard?.weekly?.length ?? 1) - 1 ? 'bg-primary-600' : 'bg-primary-100'"
              :style="{ height: (day.count / maxBarValue) * 100 + '%', minHeight: '16px' }"
            >
              <span class="absolute -top-7 left-1/2 -translate-x-1/2 rounded-md bg-text-primary px-2 py-0.5 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                {{ day.count }}
              </span>
            </div>
            <!-- Label -->
            <span
              class="text-[10px] font-bold uppercase tracking-wide"
              :class="i === (dashboard?.weekly?.length ?? 1) - 1 ? 'text-primary-600' : 'text-text-secondary'"
            >
              {{ formatDate(day.date) }}
            </span>
          </div>
        </div>
      </div>

      <!-- QR Status Card -->
      <div class="w-full rounded-4xl bg-white p-8 shadow-card lg:w-80">
        <p class="text-xs font-bold uppercase tracking-widest text-text-secondary">
          QR Code Status
        </p>
        
        <!-- SKELETON: QR Status -->
        <div v-if="!qrConfig" class="mt-4 flex items-center gap-3">
          <div class="skeleton h-4 w-4 rounded-full"></div>
          <div class="skeleton h-8 w-24"></div>
        </div>
        <div v-else class="mt-4 flex items-center gap-3">
          <span :class="['inline-block h-4 w-4 rounded-full', qrConfig?.status === 'active' ? 'bg-success' : 'bg-danger']" />
          <span class="text-2xl font-bold text-text-primary">
            {{ qrConfig?.status === 'active' ? 'Active' : (qrConfig?.status === 'paused' ? 'Paused' : 'Inactive') }}
          </span>
        </div>

        <!-- QR Preview Area -->
        <div class="mt-6 flex justify-center">
          <div class="flex h-48 w-48 items-center justify-center rounded-3xl bg-surface-input overflow-hidden ring-1 ring-border shadow-inner p-4">
            <!-- SKELETON: Image -->
            <div v-if="!qrConfig" class="skeleton h-full w-full rounded-2xl"></div>
            
            <template v-else-if="qrConfig?.status === 'active' && qrImageRes">
               <img :src="qrImageRes" alt="QR Code" class="h-full w-full object-contain mix-blend-multiply" />
            </template>
            <div v-else-if="qrConfig?.status === 'paused'" class="text-center p-4">
              <div class="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-warning-50 text-warning-600">
                <span class="text-2xl">⏳</span>
              </div>
              <p class="text-[10px] font-bold text-warning-700 uppercase tracking-wider">Paused</p>
              <p class="text-[9px] text-text-muted mt-1 px-4 leading-tight">Resume to view QR code</p>
            </div>
            <div v-else class="text-center p-4">
              <div class="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-surface-secondary text-text-muted">
                <span class="text-2xl">📴</span>
              </div>
              <p class="text-[10px] font-bold text-text-muted uppercase tracking-wider">Offline</p>
              <p class="text-[9px] text-text-muted mt-1 px-4 leading-tight">Complete setup to activate</p>
            </div>
          </div>
        </div>

        <!-- SKELETON: Toggle Button -->
        <div v-if="!qrConfig" class="skeleton mt-6 h-12 w-full rounded-xl"></div>
        <button
          v-else-if="qrConfig?.status !== 'inactive'"
          @click="updateQrStatus(qrConfig?.status === 'active' ? 'paused' : 'active')"
          :disabled="updatingStatus"
          class="mt-6 w-full rounded-xl py-3 text-sm font-bold transition-all"
          :class="qrConfig?.status === 'active' ? 'bg-danger/10 text-danger hover:bg-danger/20' : 'bg-success/10 text-success hover:bg-success/20'"
        >
          {{ qrConfig?.status === 'active' ? 'Pause Service' : 'Resume Service' }}
        </button>

        <p class="mt-4 text-center text-[10px] text-text-muted">
          Last updated: {{ qrConfig?.updatedAt ? new Date(qrConfig.updatedAt).toLocaleTimeString() : '—' }}
        </p>
      </div>
    </div>

    <!-- Top 5 Most Viewed Services -->
    <div>
      <h3 class="mb-6 text-xl font-bold tracking-tight text-text-primary">
        Top 5 Most Viewed Services
      </h3>
      
      <!-- SKELETON: Cards -->
      <div v-if="!topViewed" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div v-for="i in 5" :key="i" class="overflow-hidden rounded-3xl bg-white p-3 shadow-card">
          <div class="skeleton h-28 w-full rounded-2xl mb-3"></div>
          <div class="skeleton h-4 w-3/4 mb-2"></div>
          <div class="skeleton h-3 w-1/2"></div>
        </div>
      </div>

      <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div
          v-for="(svc, i) in topViewed?.slice(0, 5)"
          :key="svc.serviceId"
          class="overflow-hidden rounded-3xl bg-white shadow-card transition-shadow hover:shadow-elevated"
        >
          <!-- Image -->
          <div class="relative h-28 w-full overflow-hidden rounded-2xl bg-surface-input">
            <img
              v-if="svc.imageUrl"
              :src="svc.imageUrl"
              :alt="svc.serviceName"
              class="h-full w-full object-cover"
            />
            <!-- Rank Badge -->
            <div class="absolute left-2 top-2 rounded-lg bg-white/60 px-2 py-0.5 text-xs font-bold text-text-primary backdrop-blur-sm">
              #{{ i + 1 }}
            </div>
          </div>
          <!-- Info -->
          <div class="p-3">
            <h4 class="truncate text-sm font-bold text-text-primary">{{ svc.serviceName }}</h4>
            <p class="mt-1 text-xs text-text-secondary">{{ svc.viewCount?.toLocaleString() }} views</p>
          </div>
        </div>
        <div v-if="!topViewed?.length" class="col-span-full rounded-3xl bg-white p-12 text-center text-text-muted shadow-card">
          No traffic data yet. Views will appear here once customers visit.
        </div>
      </div>
    </div>
  </div>
</template>
