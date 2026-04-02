<script setup lang="ts">
import { watch } from 'vue'

const props = defineProps<{
  show: boolean
  message: string
  type?: 'success' | 'danger' | 'warning'
}>()

const emit = defineEmits(['close'])

watch(() => props.show, (val) => {
  if (val) {
    setTimeout(() => {
      emit('close')
    }, 3000)
  }
}, { immediate: true })
</script>

<template>
  <Transition name="toast">
    <div
      v-if="show"
      class="fixed right-10 top-10 z-[100] rounded-2xl px-6 py-4 text-sm font-bold text-white shadow-popup"
      :class="{
        'bg-success': type === 'success',
        'bg-danger': type === 'danger' || !type,
        'bg-warning text-white': type === 'warning'
      }"
    >
      {{ message }}
    </div>
  </Transition>
</template>

<style scoped>
.toast-enter-active { transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); }
.toast-leave-active { transition: all 0.2s ease-in; }
.toast-enter-from { transform: translateX(20px); opacity: 0; }
.toast-leave-to { transform: translateX(20px); opacity: 0; }
</style>
