<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AdminLayout from '@/layouts/AdminLayout.vue'
import CustomerLayout from '@/layouts/CustomerLayout.vue'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'

const route = useRoute()

const layout = computed(() => {
  const meta = route.meta.layout as string
  if (meta === 'admin') return AdminLayout
  if (meta === 'customer') return CustomerLayout
  return null // blank layout
})
</script>

<template>
  <component :is="layout" v-if="layout">
    <RouterView />
  </component>
  <RouterView v-else />
</template>
