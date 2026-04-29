import { ref, watch, onMounted, onUnmounted, type ComputedRef } from 'vue'

const SWIPE_THRESHOLD_PX = 40
const SLIDE_INTERVAL_MS = 5000

/**
 * useMenuSlider
 * Manages the auto-advancing article carousel and touch-swipe interaction.
 * Handles timer lifecycle with onMounted/onUnmounted internally.
 */
export function useMenuSlider(articleSlides: ComputedRef<any[]>) {
  const currentSlideIndex = ref(0)
  const touchStartX = ref<number | null>(null)
  let slideInterval: ReturnType<typeof setInterval> | null = null

  function stopSlideTimer() {
    if (slideInterval) {
      clearInterval(slideInterval)
      slideInterval = null
    }
  }

  function goToNextSlide() {
    if (!articleSlides.value.length) return
    currentSlideIndex.value = (currentSlideIndex.value + 1) % articleSlides.value.length
  }

  function goToPrevSlide() {
    if (!articleSlides.value.length) return
    currentSlideIndex.value =
      (currentSlideIndex.value - 1 + articleSlides.value.length) % articleSlides.value.length
  }

  function startSlideTimer() {
    stopSlideTimer()
    if (articleSlides.value.length <= 1) return
    slideInterval = setInterval(() => {
      goToNextSlide()
    }, SLIDE_INTERVAL_MS)
  }

  function onSlideTouchStart(event: TouchEvent) {
    touchStartX.value = event.touches[0]?.clientX ?? null
  }

  function onSlideTouchEnd(event: TouchEvent) {
    if (touchStartX.value == null) return

    const endX = event.changedTouches[0]?.clientX
    if (typeof endX !== 'number') {
      touchStartX.value = null
      return
    }

    const deltaX = endX - touchStartX.value
    touchStartX.value = null
    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return

    stopSlideTimer()
    if (deltaX < 0) goToNextSlide()
    else goToPrevSlide()
    startSlideTimer()
  }

  // Reset index when slide list changes (e.g. data loaded)
  watch(
    articleSlides,
    (val) => {
      if (currentSlideIndex.value >= val.length) {
        currentSlideIndex.value = 0
      }
      if (val.length > 0) startSlideTimer()
    },
    { immediate: true },
  )

  onMounted(() => {
    if (articleSlides.value.length > 0) startSlideTimer()
  })

  onUnmounted(() => {
    stopSlideTimer()
  })

  return {
    currentSlideIndex,
    onSlideTouchStart,
    onSlideTouchEnd,
    goToNextSlide,
    goToPrevSlide,
    startSlideTimer,
    stopSlideTimer,
  }
}
