import imgFallback from '@/assets/img_fallback.png'

/**
 * image.utils.ts
 * Shared image utilities used across customer themes and admin components.
 * Centralises the fallback asset and the error handler so they are defined once.
 */

/** The fallback image shown when a service / entity image fails to load. */
export { imgFallback }

/**
 * Sets the fallback image on an <img> element when the original src fails.
 * Safe against infinite error loops (won't re-trigger if src is already fallback).
 */
export function handleImgError(e: Event): void {
  const target = e.target as HTMLImageElement
  if (target && target.src !== imgFallback) {
    target.src = imgFallback
  }
}
