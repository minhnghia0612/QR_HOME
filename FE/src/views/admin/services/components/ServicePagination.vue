<script setup lang="ts">
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-vue-next'

const props = defineProps<{
  totalPages: number
  displayedPages: (number | string)[]
}>()

const page = defineModel<number>('page', { required: true })
</script>

<template>
  <div v-if="totalPages > 1" class="mt-8 flex items-center justify-center gap-2">
    <!-- First -->
    <button 
      :disabled="page === 1" 
      @click="page = 1" 
      class="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-secondary text-text-muted transition-all hover:bg-surface-input disabled:opacity-30"
    >
      <ChevronsLeft class="h-4 w-4" />
    </button>

    <!-- Previous -->
    <button 
      :disabled="page === 1" 
      @click="page--" 
      class="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-secondary text-text-muted transition-all hover:bg-surface-input disabled:opacity-30"
    >
      <ChevronLeft class="h-4 w-4" />
    </button>

    <!-- Page Numbers -->
    <button 
      v-for="p in displayedPages" 
      :key="p === '...' ? 'dot-' + Math.random() : p"
      :disabled="p === '...'"
      @click="typeof p === 'number' ? page = p : null"
      :class="[
        'flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold transition-all',
        p === page 
          ? 'bg-primary-600 text-white shadow-button ring-1 ring-primary-400' 
          : p === '...' 
            ? 'text-text-muted cursor-default' 
            : 'bg-surface-secondary text-text-secondary hover:bg-surface-input'
      ]"
    >
      {{ p }}
    </button>

    <!-- Next -->
    <button 
      :disabled="page === totalPages" 
      @click="page++" 
      class="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-secondary text-text-muted transition-all hover:bg-surface-input disabled:opacity-30"
    >
      <ChevronRight class="h-4 w-4" />
    </button>

    <!-- Last -->
    <button 
      :disabled="page === totalPages" 
      @click="page = totalPages" 
      class="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-secondary text-text-muted transition-all hover:bg-surface-input disabled:opacity-30"
    >
      <ChevronsRight class="h-4 w-4" />
    </button>
  </div>
</template>
