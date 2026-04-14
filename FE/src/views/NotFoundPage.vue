<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-surface-dim px-4 text-center">
    <h1 class="text-8xl font-bold text-navy-200">404</h1>
    <p class="mt-4 text-xl font-semibold text-navy-900">{{ t('notFound.title') }}</p>
    <p class="mt-2 text-text-muted">{{ t('notFound.description') }}</p>
    <RouterLink
      to="/"
      class="mt-6 rounded-xl bg-navy-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-navy-800"
    >
      {{ t('notFound.goHome') }}
    </RouterLink>
  </div>
</template>
