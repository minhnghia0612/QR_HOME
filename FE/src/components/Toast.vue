<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{
  show: boolean
  message: string
  type?: 'success' | 'danger' | 'warning'
}>()

const emit = defineEmits(['close'])

onMounted(() => {
  setTimeout(() => {
    emit('close')
  }, 3000)
})
</script>

<template>
  <Transition name="toast">
    <div
      v-if="show"
      class="fixed bottom-10 left-1/2 z-[100] -translate-x-1/2 rounded-2xl px-6 py-4 text-sm font-bold text-white shadow-popup"
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
.toast-enter-from { transform: translate(-50%, 20px); opacity: 0; }
.toast-leave-to { transform: translate(-50%, 20px); opacity: 0; }
</style>
