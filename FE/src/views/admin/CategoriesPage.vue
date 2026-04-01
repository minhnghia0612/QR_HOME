<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { categoriesApi } from '@/api/categories.api'
import { servicesApi } from '@/api/services.api'
import { Plus, Pencil, Trash2, X, FolderOpen } from 'lucide-vue-next'

const router = useRouter()
const queryClient = useQueryClient()
const showForm = ref(false)
const editingCategory = ref<any>(null)
const form = ref({ name: '', isActive: true })

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
    queryClient.invalidateQueries({ queryKey: ['categories'] })
    
    // Step forward: determine where to go next
    const { data: servicesRes } = await servicesApi.getAll({ limit: 1 })
    const servicesData = (servicesRes as any).data
    const isServiceDone = (servicesData?.items?.length || servicesData?.length || 0) > 0

    if (isServiceDone) {
      router.push('/admin/dashboard')
    } else {
      router.push('/admin/services')
    }
    resetForm()
  },
})

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
        <h2 class="text-4xl font-bold tracking-tight text-text-primary">Categories</h2>
        <p class="mt-1 text-sm text-text-secondary">Organize your services by category</p>
      </div>
      <button
        class="flex items-center gap-2 rounded-xl bg-gradient-to-b from-primary-600 to-[#0048B5] px-5 py-3 text-sm font-extrabold text-white shadow-button transition-all hover:brightness-110 active:scale-95"
        @click="openCreate"
      >
        <Plus class="h-4 w-4" />
        Add Category
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
      <p class="mt-4 text-sm font-medium text-text-secondary">No categories yet</p>
      <p class="mt-1 text-xs text-text-muted">Click "Add Category" to create your first category</p>
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
                {{ editingCategory ? 'Edit Category' : 'New Category' }}
              </h3>
              <button class="rounded-lg p-1.5 text-text-muted hover:bg-surface-input" @click="resetForm">
                <X class="h-5 w-5" />
              </button>
            </div>

            <div class="space-y-4">
              <div>
                <label class="mb-1.5 block text-sm font-medium text-text-secondary">Name</label>
                <input
                  v-model="form.name"
                  type="text"
                  placeholder="e.g., Massage, Skincare"
                  class="w-full rounded-lg border-0 bg-surface-input px-4 py-3 text-sm text-text-primary outline-none ring-1 ring-transparent placeholder:text-text-muted focus:ring-2 focus:ring-primary-600"
                />
              </div>

            </div>

            <div class="mt-6 flex gap-3">
              <button
                class="flex-1 rounded-xl bg-gradient-to-b from-primary-600 to-[#0048B5] py-3 text-sm font-extrabold text-white shadow-button transition-all hover:brightness-110 disabled:opacity-50"
                :disabled="saving || !form.name"
                @click="saveCategory()"
              >
                {{ saving ? 'Saving...' : 'Save' }}
              </button>
              <button
                class="flex-1 rounded-xl bg-surface-secondary py-3 text-sm font-bold text-text-dim transition-all hover:bg-surface-input"
                @click="resetForm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.scale-up-enter-active { transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1); }
.scale-up-leave-active { transition: all 0.15s ease-in; }
.scale-up-enter-from, .scale-up-leave-to { opacity: 0; transform: scale(0.95); }
</style>
