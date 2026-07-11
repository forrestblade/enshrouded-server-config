/**
 * features/analytics/lib/gtm — Google Tag Manager container loader (default
 * container GTM-5H9R96VX).
 *
 * Loader ONLY: Consent Mode v2 state is owned by ./consent-mode and pushed by
 * the ./third-party orchestrator BEFORE this runs, so by the time the container
 * initialises the consent signals are already in the dataLayer.
 *
 * The `<noscript>` GTM iframe is intentionally NOT rendered anywhere: our
 * consent gate is JS-based, so a no-JS iframe could not honour it.
 */
import { ensureGtag } from './consent-mode'

interface GtmWindow extends Window {
  dataLayer?: unknown[]
}

let injected = false
let currentId = ''

/** Inject the GTM container for `id`. Idempotent — only the first call injects. */
export function loadGtm (id: string): void {
  if (typeof window === 'undefined' || !id || injected) return
  ensureGtag() // guarantees window.dataLayer exists
  const w = window as GtmWindow
  w.dataLayer?.push({ 'gtm.start': Date.now(), event: 'gtm.js' })

  const s = document.createElement('script')
  s.async = true
  s.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`
  document.head.appendChild(s)

  injected = true
  currentId = id
}

/** Current configured container id (for diagnostics/tests). */
export function gtmContainerId (): string {
  return currentId
}
