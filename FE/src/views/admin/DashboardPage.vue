<script setup lang="ts">
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { trafficApi } from '@/api/traffic.api'
import { Download } from 'lucide-vue-next'
import { qrConfigApi } from '@/api/qr-config.api'
import { categoriesApi } from '@/api/categories.api'
import { servicesApi } from '@/api/services.api'
import { computed, onBeforeUnmount, watch, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { io, type Socket } from 'socket.io-client'
import { useAuthStore } from '@/stores/auth.store'
import { useStoreManager } from '@/stores/store-manager.store'
import imgFallback from '@/assets/img_fallback.png'

const storeManager = useStoreManager()
const queryClient = useQueryClient()
const authStore = useAuthStore()
const { t } = useI18n({ useScope: 'global' })
let dashboardSocket: Socket | null = null

const { data: dashboard, isLoading: loadingDashboard } = useQuery({
  queryKey: ['dashboard', computed(() => storeManager.currentStoreId)],
  queryFn: async () => {
    const { data } = await trafficApi.getDashboard()
    return data.data
  },
  staleTime: 0,
  refetchOnMount: 'always',
  refetchOnWindowFocus: false,
})

const { data: qrConfig, isLoading: loadingQrConfig } = useQuery({
  queryKey: ['qr-config', computed(() => storeManager.currentStoreId)],
  queryFn: async () => {
    const { data } = await qrConfigApi.getConfig()
    return data.data
  },
  staleTime: 0,
  refetchOnMount: 'always',
})

const { data: categories } = useQuery({
  queryKey: ['categories', computed(() => storeManager.currentStoreId)],
  queryFn: async () => {
    const { data } = await categoriesApi.getAll()
    return data.data
  }
})

const { data: services } = useQuery({
  queryKey: ['services-count', computed(() => storeManager.currentStoreId)],
  queryFn: async () => {
    const { data } = await servicesApi.getAll({ limit: 1 })
    return data.data
  }
})

const { data: qrImageRes } = useQuery({
  queryKey: computed(() => ['qr-image', storeManager.currentStoreId, qrConfig.value?.status, qrConfig.value?.qrUrl]),
  queryFn: async () => {
    const { data } = await qrConfigApi.downloadQr()
    return data.data
  },
  enabled: computed(() => qrConfig.value?.status === 'active' && !!qrConfig.value?.qrUrl),
  staleTime: 0,
  refetchOnMount: 'always',
})

const setupProgress = computed(() => {
  const steps = [
    { id: 'settings', label: t('admin.dashboard.setupProgress.spaInfo'), done: !!qrConfig.value?.spaName, link: '/admin/qr' },
    { id: 'category', label: t('admin.dashboard.setupProgress.firstCategory'), done: !!categories.value?.length, link: '/admin/categories' },
    { id: 'service', label: t('admin.dashboard.setupProgress.firstService'), done: !!services.value?.total, link: '/admin/services' }
  ]
  const completed = steps.filter(s => s.done).length
  return { steps, completed, allDone: completed === steps.length }
})

const pageLoading = computed(() => loadingDashboard.value || loadingQrConfig.value)

const { mutate: updateQrStatus, isPending: updatingStatus } = useMutation({
  mutationFn: async (status: 'active' | 'paused' | 'inactive') => {
    await qrConfigApi.updateStatus(status)
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['qr-config'] })
  },
})

const generating = ref(false)
async function generateQr() {
  if (generating.value) return
  generating.value = true
  try {
    const { data } = await qrConfigApi.generate()
    if (data.data) {
      queryClient.invalidateQueries({ queryKey: ['qr-config'] })
    }
  } catch (error) {
    console.error('Failed to generate QR:', error)
  } finally {
    generating.value = false
  }
}

function connectDashboardSocket(adminId: string) {
  if (dashboardSocket?.connected) {
    dashboardSocket.emit('dashboard:subscribe', { adminId })
    return
  }

  const token = localStorage.getItem('qr_home_token') || ''

  dashboardSocket = io('/traffic', {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    auth: { token },
    withCredentials: true,
  })

  dashboardSocket.on('connect', () => {
    dashboardSocket?.emit('dashboard:subscribe', { adminId })
  })

  dashboardSocket.on('traffic:dashboard-updated', (payload: any) => {
    if (!payload?.dashboard) return
    if (String(payload?.adminId || '') !== adminId) return
    queryClient.setQueryData(['dashboard'], payload.dashboard)
  })
}

watch(
  () => authStore.admin?.id,
  (adminId) => {
    const normalized = String(adminId || '').trim()
    if (!normalized) return
    connectDashboardSocket(normalized)
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  dashboardSocket?.disconnect()
  dashboardSocket = null
})

const weeklyWithData = computed(() => {
  const weekly = dashboard.value?.weekly ?? []
  const since = new Date()
  since.setHours(0, 0, 0, 0)
  since.setDate(since.getDate() - 6)

  return weekly.filter((day: any) => {
    const date = new Date(day.date)
    date.setHours(0, 0, 0, 0)
    return date >= since && Number(day.count) > 0
  })
})

function handleImgError(e: Event) {
  const target = e.target as HTMLImageElement
  if (target.src !== imgFallback) {
    target.src = imgFallback
  }
}

const maxBarValue = computed(() => {
  if (!weeklyWithData.value.length) return 1
  return Math.max(...weeklyWithData.value.map((d: any) => d.count), 1)
})

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

function formatLastUpdated(dateStr: string) {
  const d = new Date(dateStr)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const mth = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${hh}:${mm} ${dd}/${mth}/${yyyy}`
}

async function downloadQr() {
  try {
    const { data } = await qrConfigApi.downloadQr()
    const url = data.data
    if (url) {
      const a = document.createElement('a')
      a.href = url
      a.download = t('admin.dashboard.qrFilename')
      a.click()
    }
  } catch { /* skip */ }
}
</script>

<template>
  <div class="space-y-12 pb-20">
    <!-- Welcome Section -->
    <div v-if="pageLoading" class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div class="h-10 w-72 rounded-lg bg-surface-input animate-pulse"></div>
      </div>
      <div class="h-12 w-40 rounded-xl bg-surface-input animate-pulse"></div>
    </div>
    <div v-else class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 class="text-4xl font-bold tracking-tight text-text-primary">
          {{ t('admin.dashboard.welcome') }}, {{ qrConfig?.spaName || storeManager.currentStore?.name }}
        </h2>
      </div>
      <button
        class="flex items-center gap-2 rounded-xl bg-surface-secondary px-6 py-3 text-sm font-bold text-text-dim transition-all hover:bg-surface-input disabled:opacity-50"
        :disabled="!qrConfig"
        @click="downloadQr"
      >
        <Download class="h-4 w-4" />
        {{ t('admin.dashboard.downloadQr') }}
      </button>
    </div>

    <!-- Bento Grid: Chart + QR Status -->
    <div class="flex flex-col gap-6 lg:flex-row">
      <!-- Traffic View Card (Always visible) -->
      <div class="flex-1 rounded-4xl bg-white p-8 shadow-card">
        <div class="mb-6 flex items-center justify-between">
          <h3 class="text-2xl font-bold tracking-tight text-text-primary">{{ t('admin.dashboard.trafficView') }}</h3>
          <span v-if="weeklyWithData.length" class="text-[10px] font-black uppercase tracking-widest text-primary-600">{{ t('admin.dashboard.last7Days') }}</span>
        </div>

        <div v-if="loadingDashboard" class="grid h-[220px] grid-cols-7 items-end gap-4 px-2 sm:px-4">
          <div v-for="i in 7" :key="`chart-skeleton-${i}`" class="flex flex-col items-center gap-3">
            <div class="w-10 rounded-t-lg bg-surface-input animate-pulse" :style="{ height: `${30 + (i % 4) * 20}px` }"></div>
            <div class="h-3 w-10 rounded bg-surface-input animate-pulse"></div>
          </div>
        </div>
        <div v-else-if="weeklyWithData.length" class="flex items-end justify-start h-[220px] w-full px-2 sm:px-4 gap-6 overflow-x-auto overflow-y-visible no-scrollbar pt-14 pb-2">
          <div
            v-for="(day, i) in weeklyWithData"
            :key="i"
            class="flex h-full flex-col items-center justify-end group gap-3 min-w-[70px]"
          >
            <!-- Bar -->
            <div
              class="relative w-12 cursor-pointer rounded-t-lg transition-all duration-300 bg-primary-600 shadow-[0_4px_12px_rgba(37,99,235,0.3)] hover:brightness-110"
              :style="{ height: Math.max((day.count / maxBarValue) * 100, 18) + '%' }"
            >
              <!-- Tooltip (Force visible on hover/group-hover) -->
              <div class="absolute -top-12 left-1/2 -translate-x-1/2 rounded-lg bg-text-primary px-3 py-2 text-[11px] font-black text-white opacity-0 transition-all group-hover:opacity-100 group-hover:-translate-y-2 pointer-events-none shadow-xl z-30 flex flex-col items-center min-w-[50px]">
                {{ day.count }}
                <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-text-primary rotate-45"></div>
              </div>
            </div>
            
            <span class="text-[11px] font-black text-primary-600 uppercase tracking-widest whitespace-nowrap">
              {{ formatDate(day.date) }}
            </span>
          </div>
        </div>
        
        <!-- Empty State for Chart -->
        <div v-else class="flex h-[200px] flex-col items-center justify-center text-text-muted gap-4">
          <div class="rounded-full bg-surface-input p-6">
            <BarChart3 class="h-10 w-10 opacity-20" />
          </div>
          <p class="text-sm font-bold uppercase tracking-widest opacity-60">{{ t('admin.dashboard.noTraffic7Days') }}</p>
        </div>
      </div>

      <!-- QR Status Card -->
      <div class="w-full rounded-4xl bg-white p-8 shadow-card lg:w-80">
        <p class="text-xs font-bold uppercase tracking-widest text-text-secondary">
          {{ t('admin.dashboard.qrStatus') }}
        </p>
        
        <div v-if="loadingQrConfig || !qrConfig" class="mt-4 flex items-center gap-3">
          <div class="skeleton h-4 w-4 rounded-full"></div>
          <div class="skeleton h-8 w-24"></div>
        </div>
        <div v-else class="mt-4 flex items-center gap-3">
          <span :class="['inline-block h-4 w-4 rounded-full', qrConfig?.status === 'active' ? 'bg-success' : 'bg-danger']" />
          <span class="text-2xl font-bold text-text-primary">
            {{ qrConfig?.status === 'active' ? t('admin.common.active') : (qrConfig?.status === 'paused' ? t('admin.common.paused') : t('admin.common.inactive')) }}
          </span>
        </div>

        <div class="mt-6 flex justify-center">
          <div class="flex h-48 w-48 items-center justify-center rounded-3xl bg-surface-input overflow-hidden ring-1 ring-border shadow-inner p-4">
            <template v-if="loadingQrConfig">
              <div class="h-full w-full rounded-2xl bg-white/80 animate-pulse"></div>
            </template>
            <template v-else-if="qrConfig?.status === 'active' && qrImageRes">
               <img :src="qrImageRes" alt="QR Code" class="h-full w-full object-contain mix-blend-multiply" />
            </template>
            <div v-else class="text-center p-4">
              <span class="text-4xl opacity-20">📵</span>
            </div>
          </div>
        </div>

        <div v-if="(qrConfig?.status as string) === 'inactive'" class="mt-6 flex flex-col gap-3">
           <p class="text-[11px] text-primary-700 font-medium px-1">{{ t('admin.dashboard.generateQrHint') }}</p>
           <button
             @click="generateQr"
             :disabled="generating"
             class="w-full rounded-xl bg-primary-600 py-3 text-sm font-bold text-white shadow-md hover:bg-primary-700 active:scale-95 disabled:opacity-50"
           >
             {{ t('admin.dashboard.generateQr') }}
           </button>
        </div>
        <button
          v-else-if="!loadingQrConfig && qrConfig?.status !== 'inactive'"
          @click="updateQrStatus(qrConfig?.status === 'active' ? 'paused' : 'active')"
          :disabled="updatingStatus"
          class="mt-6 w-full rounded-xl py-3 text-sm font-bold transition-all"
          :class="qrConfig?.status === 'active' ? 'bg-danger/10 text-danger hover:bg-danger/20' : 'bg-success/10 text-success hover:bg-success/20'"
        >
          {{ qrConfig?.status === 'active' ? t('admin.dashboard.pauseService') : t('admin.dashboard.resumeService') }}
        </button>
        <div v-else-if="loadingQrConfig" class="mt-6 h-11 w-full rounded-xl bg-surface-input animate-pulse"></div>

        <p v-if="!loadingQrConfig" class="mt-4 text-center text-[10px] text-text-muted">
          {{ t('admin.dashboard.lastUpdated') }}: {{ qrConfig?.updatedAt ? formatLastUpdated(qrConfig.updatedAt) : '—' }}
        </p>
        <div v-else class="mx-auto mt-4 h-3 w-36 rounded bg-surface-input animate-pulse"></div>
      </div>
    </div>

    <!-- Top 5 Most Viewed Services -->
    <div>
      <h3 class="mb-6 text-xl font-bold tracking-tight text-text-primary">
        {{ t('admin.dashboard.top5') }}
      </h3>

      <div v-if="loadingDashboard" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div v-for="i in 5" :key="`top5-skeleton-${i}`" class="overflow-hidden rounded-3xl bg-white p-3 shadow-card">
          <div class="h-28 w-full rounded-2xl bg-surface-input animate-pulse"></div>
          <div class="mt-3 h-4 w-3/4 rounded bg-surface-input animate-pulse"></div>
          <div class="mt-2 h-3 w-1/2 rounded bg-surface-input animate-pulse"></div>
        </div>
      </div>
      
      <div v-else-if="dashboard?.top5?.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div
          v-for="(svc, i) in (dashboard?.top5 as any[])?.slice(0, 5)"
          :key="svc.serviceId"
          class="overflow-hidden rounded-3xl bg-white shadow-card transition-shadow hover:shadow-elevated"
        >
          <div class="relative h-28 w-full overflow-hidden rounded-2xl bg-surface-input">
            <img :src="svc.imageUrl || imgFallback" :alt="svc.serviceName" class="h-full w-full object-cover" @error="handleImgError" />
            <div class="absolute left-2 top-2 rounded-lg bg-white/60 px-2 py-0.5 text-xs font-bold text-text-primary backdrop-blur-sm">
              #{{ i + 1 }}
            </div>
          </div>
          <div class="p-3">
            <h4 class="truncate text-sm font-bold text-text-primary">{{ svc.serviceName }}</h4>
            <p class="mt-1 text-xs text-text-secondary">{{ svc.viewCount?.toLocaleString() }} {{ t('admin.dashboard.views') }}</p>
          </div>
        </div>
      </div>
      <div v-else class="col-span-full rounded-3xl bg-white p-12 text-center text-text-muted shadow-card">
        {{ t('admin.dashboard.noTrafficYet') }}
      </div>
    </div>
  </div>
</template>
