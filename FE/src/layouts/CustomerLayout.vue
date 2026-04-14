<script setup lang="ts">
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
</script>

<template>
  <div class="min-h-screen bg-surface-page">
    <div class="fixed right-4 top-4 z-50">
      <LanguageSwitcher />
    </div>
    <slot />
  </div>
</template>
