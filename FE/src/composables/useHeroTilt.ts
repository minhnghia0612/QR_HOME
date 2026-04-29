import { ref, computed } from 'vue'

export function useHeroTilt() {
  const heroTiltX = ref(0)
  const heroTiltY = ref(0)

  const heroCardStyle = computed(() => ({
    transform: `perspective(1200px) rotateX(${heroTiltX.value}deg) rotateY(${heroTiltY.value}deg)`,
  }))

  function handleHeroMouseMove(event: MouseEvent) {
    const el = event.currentTarget as HTMLElement | null
    if (!el) return

    const rect = el.getBoundingClientRect()
    const px = (event.clientX - rect.left) / rect.width
    const py = (event.clientY - rect.top) / rect.height

    heroTiltY.value = (px - 0.5) * 8
    heroTiltX.value = (0.5 - py) * 7
  }

  function resetHeroTilt() {
    heroTiltX.value = 0
    heroTiltY.value = 0
  }

  return {
    heroCardStyle,
    handleHeroMouseMove,
    resetHeroTilt
  }
}
