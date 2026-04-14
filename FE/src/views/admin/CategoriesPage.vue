<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { categoriesApi } from '@/api/categories.api'
import { Plus, Pencil, Trash2, X, FolderOpen, ArrowRight } from 'lucide-vue-next'
import Toast from '@/components/Toast.vue'

const router = useRouter()
const queryClient = useQueryClient()
const { t } = useI18n({ useScope: 'global' })
const showForm = ref(false)
const editingCategory = ref<any>(null)
const form = ref({ name: '', isActive: true })

const toast = ref({ show: false, message: '', type: 'success' as 'success' | 'danger' | 'warning' })
const showConflictDialog = ref(false)
const existingCategory = ref<any>(null)

function showToast(message: string, type: 'success' | 'danger' | 'warning' = 'success') {
  toast.value = { show: true, message, type }
}

const { data: categories, isLoading } = useQuery({
  queryKey: ['categories'],
  queryFn: async () => {
    const { data } = await categoriesApi.getAll()
    return data.data
  },
})


const { mutate: saveCategory, isPending: saving } = useMutation({
  mutationFn: async () => {
    const payload = { ...form.value }

    if (editingCategory.value) {
      const { data } = await categoriesApi.update(editingCategory.value.id, payload)
      return data
    } else {
      const { data } = await categoriesApi.create(payload)
      return data
    }
  },
  onSuccess: async () => {
    // const isCreating = !editingCategory.value
    // const hadNoCategoryBefore = (categories.value?.length || 0) === 0

    await queryClient.invalidateQueries({ queryKey: ['categories'] })
    showToast(t('admin.categories.saved'), 'success')
    resetForm()

    // Onboarding flow: Chuyển sang service nếu đây là danh mục đầu tiên
    // Dùng hadNoCategoryBefore (tính TRƯỚC invalidate) để tránh race condition
    // if (isCreating && hadNoCategoryBefore) {
    //   setTimeout(() => {
    //     router.push('/admin/services')
    //   }, 800)
    // }
  },
  onError: (err: any) => {
    const errorData = err.response?.data
    if (err.response?.status === 409 && errorData?.existingCategory) {
      existingCategory.value = errorData.existingCategory
      showConflictDialog.value = true
      return
    }
    const message = errorData?.message || err.message || t('admin.categories.saveFailed')
    showToast(message, 'danger')
  },
})

function handleConflictYes() {
  if (existingCategory.value) {
    openEdit(existingCategory.value)
  }
  showConflictDialog.value = false
}

function handleConflictNo() {
  showConflictDialog.value = false
  // Stay in create mode, maybe clear the name or let user change it
}

const { mutate: deleteCategory } = useMutation({
  mutationFn: (id: string) => categoriesApi.delete(id),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
})

function openCreate() {
  editingCategory.value = null
  form.value = { name: '', isActive: true }
  showForm.value = true
}

function openEdit(cat: any) {
  editingCategory.value = cat
  form.value = { name: cat.name || '', isActive: cat.isActive !== undefined ? cat.isActive : true }
  showForm.value = true
}

function resetForm() {
  showForm.value = false
  editingCategory.value = null
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-4xl font-bold tracking-tight text-text-primary">{{ t('admin.categories.title') }}</h2>
        <p class="mt-1 text-sm text-text-secondary">{{ t('admin.categories.subtitle') }}</p>
      </div>
      <button
        class="flex items-center gap-2 rounded-xl bg-gradient-to-b from-primary-600 to-[#0048B5] px-5 py-3 text-sm font-extrabold text-white shadow-button transition-all hover:brightness-110 active:scale-95"
        @click="openCreate"
      >
        <Plus class="h-4 w-4" />
        {{ t('admin.categories.addCategory') }}
      </button>
    </div>

    <!-- Categories Grid -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="cat in categories"
        :key="cat.id"
        class="group rounded-3xl bg-white p-6 shadow-card transition-all hover:shadow-elevated"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
              <FolderOpen class="h-5 w-5" />
            </div>
            <div>
              <h3 class="text-base font-bold text-text-primary">{{ cat.name }}</h3>

            </div>
          </div>
          <div class="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              class="rounded-lg p-1.5 text-text-muted hover:bg-primary-100 hover:text-primary-600"
              @click="openEdit(cat)"
            >
              <Pencil class="h-4 w-4" />
            </button>
            <button
              class="rounded-lg p-1.5 text-text-muted hover:bg-danger/10 hover:text-danger"
              @click="deleteCategory(cat.id)"
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

    <!-- Form Dialog -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showForm" class="fixed inset-0 z-40 bg-black/30" @click="resetForm" />
      </Transition>
      <Transition name="scale-up">
        <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="w-full max-w-md rounded-3xl bg-white p-6 shadow-popup" @click.stop>
            <div class="mb-6 flex items-center justify-between">
              <h3 class="text-lg font-bold text-text-primary">
                {{ editingCategory ? t('admin.categories.editCategory') : t('admin.categories.newCategory') }}
              </h3>
              <button class="rounded-lg p-1.5 text-text-muted hover:bg-surface-input" @click="resetForm">
                <X class="h-5 w-5" />
              </button>
            </div>

            <div class="space-y-4">
              <div>
                <label class="mb-1.5 block text-sm font-medium text-text-secondary">{{ t('admin.common.name') }}</label>
                <input
                  v-model="form.name"
                  type="text"
                  :placeholder="t('admin.categories.namePlaceholder')"
                  class="w-full rounded-lg border-0 bg-surface-input px-4 py-3 text-sm text-text-primary outline-none ring-1 ring-transparent placeholder:text-text-muted focus:ring-2 focus:ring-primary-600"
                  @keyup.enter="saveCategory()"
                />
              </div>

            </div>

            <div class="mt-6 flex gap-3">
              <button
                class="flex-1 rounded-xl bg-gradient-to-b from-primary-600 to-[#0048B5] py-3 text-sm font-extrabold text-white shadow-button transition-all hover:brightness-110 disabled:opacity-50"
                :disabled="saving || !form.name"
                @click="saveCategory()"
              >
                {{ saving ? t('admin.common.saving') : t('admin.common.save') }}
              </button>
              <button
                class="flex-1 rounded-xl bg-surface-secondary py-3 text-sm font-bold text-text-dim transition-all hover:bg-surface-input"
                @click="resetForm"
              >
                {{ t('admin.common.cancel') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Conflict Confirmation Dialog -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showConflictDialog" class="fixed inset-0 z-[60] bg-black/30" @click="showConflictDialog = false" />
      </Transition>
      <Transition name="scale-up">
        <div v-if="showConflictDialog" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div class="w-full max-w-sm rounded-[32px] bg-white p-8 text-center shadow-popup" @click.stop>
            <div class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-warning/10 text-warning">
              <FolderOpen class="h-8 w-8" />
            </div>
            <h3 class="mb-2 text-xl font-bold text-text-primary">{{ t('admin.categories.existsTitle') }}</h3>
            <p class="mb-8 text-sm text-text-secondary">{{ t('admin.categories.existsHint') }}</p>
            
            <div class="flex gap-3">
              <button
                class="flex-1 rounded-2xl bg-gradient-to-b from-primary-600 to-[#0048B5] py-3 text-sm font-extrabold text-white shadow-button transition-all hover:brightness-110"
                @click="handleConflictYes"
              >
                {{ t('admin.categories.yesEdit') }}
              </button>
              <button
                class="flex-1 rounded-2xl bg-surface-secondary py-3 text-sm font-bold text-text-dim transition-all hover:bg-surface-input"
                @click="handleConflictNo"
              >
                {{ t('admin.categories.noCancel') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Toast 
      :show="toast.show" 
      :message="toast.message" 
      :type="toast.type" 
      @close="toast.show = false" 
    />
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.scale-up-enter-active { transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1); }
.scale-up-leave-active { transition: all 0.15s ease-in; }
.scale-up-enter-from, .scale-up-leave-to { opacity: 0; transform: scale(0.95); }
</style>
