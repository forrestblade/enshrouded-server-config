/**
 * features/analytics/lib/ga4 — direct GA4 gtag.js loader (default property
 * G-3PJG33PRF6).
 *
 * Loader ONLY: Consent Mode v2 state is owned by ./consent-mode and pushed by
 * the ./third-party orchestrator BEFORE this runs.
 *
 * ⚠️ Double-count caveat: if this same GA4 property is ALSO configured as a tag
 * inside the GTM container, loading both here and via ./gtm double-fires every
 * hit. Configure GA4 in exactly one place (see docs/MARTECH_HANDOFF.md).
 */
import { ensureGtag } from './consent-mode'

let injected = false
let currentId = ''

/** Inject gtag.js for GA4 property `id`. Idempotent — only the first call injects. */
export function loadGa4 (id: string): void {
  if (typeof window === 'undefined' || !id || injected) return
  const gtag = ensureGtag()
  if (!gtag) return

  const s = document.createElement('script')
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`
  document.head.appendChild(s)

  gtag('js', new Date())
  gtag('config', id, { anonymize_ip: true })

  injected = true
  currentId = id
}

/** Current configured measurement id (for diagnostics/tests). */
export function ga4MeasurementId (): string {
  return currentId
}
