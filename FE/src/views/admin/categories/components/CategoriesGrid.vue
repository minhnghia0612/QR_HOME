<script setup lang="ts">
import { Pencil, Trash2, FolderOpen } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { useCategoryLocale } from '@/composables/useCategoryLocale'

const props = defineProps<{
  categories: any[] | undefined
  isLoading: boolean
}>()

const emit = defineEmits<{
  (e: 'edit', cat: any): void
  (e: 'delete', id: string): void
}>()

const { t } = useI18n({ useScope: 'global' })
const { getCategoryName } = useCategoryLocale()
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    <div
      v-for="cat in categories"
      :key="cat.id"
      class="group rounded-3xl bg-white p-6 shadow-card transition-all hover:shadow-elevated"
    >
      <div class="flex items-start justify-between gap-4">
        <div class="flex min-w-0 flex-1 items-center gap-3">
          <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
            <FolderOpen class="h-5 w-5" />
          </div>
          <div class="min-w-0 flex-1">
            <h3 class="line-clamp-2 break-words text-base font-bold text-text-primary" :title="getCategoryName(cat)">{{ getCategoryName(cat) }}</h3>
          </div>
        </div>
        <div class="flex flex-shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            class="rounded-lg p-1.5 text-text-muted hover:bg-primary-100 hover:text-primary-600"
            @click="emit('edit', cat)"
          >
            <Pencil class="h-4 w-4" />
          </button>
          <button
            class="rounded-lg p-1.5 text-text-muted hover:bg-danger/10 hover:text-danger"
            @click="emit('delete', cat.id)"
          >
            <Trash2 class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  </div>

  <div v-if="isLoading" class="flex items-center justify-center py-16 text-text-muted">
    <span class="animate-spin text-2xl">⏳</span>
  </div>
  <div v-else-if="!categories?.length" class="rounded-3xl bg-white p-16 text-center shadow-card">
    <FolderOpen class="mx-auto h-12 w-12 text-text-muted" />
    <p class="mt-4 text-sm font-medium text-text-secondary">{{ t('admin.categories.emptyTitle') }}</p>
    <p class="mt-1 text-xs text-text-muted">{{ t('admin.categories.emptyHint') }}</p>
  </div>
</template>
