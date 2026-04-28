import { ref, type Ref } from 'vue'
import { uploadApi } from '@/api/upload.api'
import { useI18n } from 'vue-i18n'
import { getApiErrorMessage } from '@/utils/settings.utils'

const MAX_IMAGE_SIZE_MB = 5
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024

export function useImageUpload(
  form: Ref<any>,
  showToast: (message: string, type?: 'success' | 'danger' | 'warning') => void
) {
  const { t } = useI18n({ useScope: 'global' })
  
  const uploadLoading = ref<string | null>(null)
  const isDraggingImage = ref(false)

  async function processFile(file: File, field: string = 'imageUrl') {
    const isImage = String(file.type || '').startsWith('image/')
    if (!isImage) {
      showToast(t('admin.settings.errors.imageOnly') || 'Only image files are allowed.', 'danger')
      return
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      showToast(t('admin.settings.imageSizeExceeds'), 'danger')
      return
    }

    uploadLoading.value = field

    try {
      const { data } = await uploadApi.upload(file)
      const imageUrl = data.data?.url || ''
      if (!imageUrl) {
        showToast(t('admin.settings.errors.uploadNoUrl') || 'Upload failed.', 'danger')
        return
      }
      form.value[field] = imageUrl
      
      let successMsg = t('admin.settings.bannerUploaded') || 'Image uploaded successfully.'
      if (field === 'spaLogo') successMsg = t('admin.settings.logoUploaded')
      
      showToast(successMsg, 'success')
    } catch (err: any) {
      if (err?.response?.status === 413) {
        showToast(t('admin.settings.imageSizeExceeds'), 'danger')
      } else {
        showToast(getApiErrorMessage(err, t('admin.settings.errors.uploadFailed') || 'Upload failed.'), 'danger')
      }
    } finally {
      uploadLoading.value = null
    }
  }

  async function handleUpload(e: Event, field: string = 'imageUrl') {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    await processFile(file, field)
    input.value = ''
  }

  async function handleDrop(e: DragEvent, field: string = 'imageUrl') {
    const file = e.dataTransfer?.files?.[0]
    if (!file) return
    await processFile(file, field)
  }

  return {
    uploadLoading,
    isDraggingImage,
    handleUpload,
    handleDrop,
  }
}
