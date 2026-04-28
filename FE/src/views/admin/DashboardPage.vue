<script setup lang="ts">
import { computed } from 'vue'
import { useStoreManager } from '@/stores/store-manager.store'
import { useDashboardTraffic } from '@/composables/useDashboardTraffic'
import { useQrManagement } from '@/composables/useQrManagement'
import DashboardWelcome from './dashboard/components/DashboardWelcome.vue'
import TrafficChart from './dashboard/components/TrafficChart.vue'
import QrStatusCard from './dashboard/components/QrStatusCard.vue'
import TopServices from './dashboard/components/TopServices.vue'

const storeManager = useStoreManager()

const { dashboard, loadingDashboard, weeklyWithData, maxBarValue } = useDashboardTraffic()
const { qrConfig, loadingQrConfig, qrImageRes, loadingQrImage, updateQrStatus, updatingStatus, downloadQr } = useQrManagement()

const pageLoading = computed(() => loadingDashboard.value || loadingQrConfig.value)

function handleToggleStatus() {
  if (!qrConfig.value) return
  const nextStatus = qrConfig.value.status === 'active' ? 'paused' : 'active'
  updateQrStatus(nextStatus)
}
</script>

<template>
  <div class="space-y-12 pb-20">
    <DashboardWelcome
      :spa-name="qrConfig?.spaName || storeManager.currentStore?.name"
      :is-loading="pageLoading"
      :can-download="!!qrConfig"
      @download="downloadQr"
    />

    <!-- Bento Grid: Chart + QR Status -->
    <div class="flex flex-col gap-6 lg:flex-row">
      <TrafficChart
        :weekly-data="weeklyWithData"
        :max-bar-value="maxBarValue"
        :is-loading="loadingDashboard"
      />
      
      <QrStatusCard
        :qr-config="qrConfig"
        :qr-image-res="qrImageRes"
        :is-loading="loadingQrConfig"
        :is-image-loading="loadingQrImage"
        :is-updating="updatingStatus"
        @toggle-status="handleToggleStatus"
      />
    </div>

    <!-- Top 5 Most Viewed Services -->
    <TopServices
      :top5-list="(dashboard?.top5 as any[])?.slice(0, 5) || []"
      :is-loading="loadingDashboard"
    />
  </div>
</template>
