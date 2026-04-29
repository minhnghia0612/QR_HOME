import { ref, onBeforeUnmount } from 'vue'

export function useScrollReveal() {
  const revealObserver = ref<IntersectionObserver | null>(null)

  function initScrollReveal() {
    if (typeof window === 'undefined') return

    const elements = document.querySelectorAll<HTMLElement>('[data-reveal]')
    if (!elements.length) return

    revealObserver.value = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement
            const delay = target.dataset.revealDelay
            if (delay) target.style.transitionDelay = delay
            target.classList.add('is-visible')
            revealObserver.value?.unobserve(target)
          }
        })
      },
      { threshold: 0.2 },
    )

    elements.forEach((el) => revealObserver.value?.observe(el))
  }

  onBeforeUnmount(() => {
    revealObserver.value?.disconnect()
  })

  return {
    initScrollReveal
  }
}
