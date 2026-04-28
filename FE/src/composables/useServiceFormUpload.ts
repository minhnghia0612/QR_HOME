import { ref, type Ref } from 'vue'
import { uploadApi } from '@/api/upload.api'

export function useServiceFormUpload(
  form: Ref<any>,
  showToast: (msg: string, type: 'success' | 'danger' | 'warning') => void,
  t: (key: string) => string
) {
  const MAX_IMAGE_SIZE_MB = 5
  const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024

  const uploadLoading = ref(false)
  const isDraggingImage = ref(false)

  async function processFile(file: File) {
    const isImage = String(file.type || '').startsWith('image/')
    if (!isImage) {
      showToast('Only image files are allowed (JPG, PNG, WEBP, ...).', 'danger')
      return
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      showToast(`Image is too large. Max size is ${MAX_IMAGE_SIZE_MB}MB.`, 'danger')
      return
    }

    uploadLoading.value = true
    try {
      const { data } = await uploadApi.upload(file)
      const imageUrl = data.data?.url || ''
      if (!imageUrl) {
        showToast('Upload failed: server did not return an image URL.', 'danger')
        return
      }
      form.value.imageUrl = imageUrl
      showToast('Image uploaded successfully.', 'success')
    } catch (err: any) {
      let message = err?.response?.data?.message || err?.message || 'Image upload failed. Please try again.'
      if (err?.response?.status === 413) {
        message = t('admin.settings.imageSizeExceeds') || 'File is too large. Please upload a smaller file.'
      }
      showToast(String(message), 'danger')
    } finally {
      uploadLoading.value = false
    }
  }

  async function handleUpload(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    await processFile(file)
    ;(e.target as HTMLInputElement).value = ''
  }

  async function handleDrop(e: DragEvent) {
    const file = e.dataTransfer?.files?.[0]
    if (!file) return
    await processFile(file)
  }

  return {
    uploadLoading,
    isDraggingImage,
    handleUpload,
    handleDrop,
  }
}
