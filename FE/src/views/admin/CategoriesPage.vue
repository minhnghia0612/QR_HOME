<script setup lang="ts">
import { ref } from 'vue'
import Toast from '@/components/Toast.vue'
import { useCategoriesData } from '@/composables/useCategoriesData'
import { useCategoryForm } from '@/composables/useCategoryForm'

import CategoriesHeader from './categories/components/CategoriesHeader.vue'
import CategoriesGrid from './categories/components/CategoriesGrid.vue'
import CategoryFormDialog from './categories/components/CategoryFormDialog.vue'
import CategoryConflictDialog from './categories/components/CategoryConflictDialog.vue'

const toast = ref({ show: false, message: '', type: 'success' as 'success' | 'danger' | 'warning' })

function showToast(message: string, type: 'success' | 'danger' | 'warning' = 'success') {
  toast.value = { show: true, message, type }
}

const { categories, isLoading, deleteCategory } = useCategoriesData()
const {
  form,
  showForm,
  editingCategory,
  formLocaleLang,
  activeLocaleName,
  hasLocaleContent,
  openCreate,
  openEdit,
  resetForm,
  saveCategory,
  saving,
  showConflictDialog,
  handleConflictYes,
  handleConflictNo
} = useCategoryForm(showToast)
</script>

<template>
  <div>
    <CategoriesHeader @open-create="openCreate" />

    <CategoriesGrid
      :categories="categories"
      :is-loading="isLoading"
      @edit="openEdit"
      @delete="deleteCategory"
    />

    <CategoryFormDialog
      :show="showForm"
      :editing-category="editingCategory"
      :is-saving="saving"
      :form="form"
      :has-locale-content="hasLocaleContent"
      v-model:form-locale-lang="formLocaleLang"
      v-model:active-locale-name="activeLocaleName"
      @close="resetForm"
      @save="saveCategory"
    />

    <CategoryConflictDialog
      :show="showConflictDialog"
      @yes="handleConflictYes"
      @no="handleConflictNo"
    />

    <Toast 
      :show="toast.show" 
      :message="toast.message" 
      :type="toast.type" 
      @close="toast.show = false" 
    />
  </div>
</template>
