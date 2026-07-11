/**
 * features/analytics/lib/track — the consent-gated custom-event emitter.
 *
 * `track()` is the single choke point for product-event collection. It pushes a
 * `{ event, ...params }` object onto `window.dataLayer` (the mechanism GTM/GA4
 * consume) but refuses to do so unless BOTH are true:
 *   1. the viewer granted analytics consent (localStorage gate), and
 *   2. no browser-level opt-out is set (Global Privacy Control / Do Not Track).
 *
 * GPC/DNT are treated as a HARD off: even if localStorage says 'granted', a
 * browser signalling GPC=true or DNT='1' pushes nothing. The stored decision can
 * only ever loosen collection, never override an explicit browser opt-out.
 *
 * Because GTM is only injected AFTER consent, pushes are inert until then; the
 * gate here additionally guarantees nothing is queued for a later replay if the
 * user has not consented. Pageviews and site search are handled by GA4 Enhanced
 * Measurement, not here — see ../model/events.
 */
import { hasAnalyticsConsent } from '@/features/consent/lib/consent'
import { toDataLayerParams, type AnalyticsEvent, type TrackParams } from '../model/events'

interface DataLayerWindow extends Window {
  dataLayer?: unknown[]
}

/** True only if the browser signals a privacy opt-out (GPC or DNT). */
export function hasBrowserOptOut (): boolean {
  if (typeof navigator === 'undefined') return false
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean, msDoNotTrack?: string }
  if (nav.globalPrivacyControl === true) return true
  const dnt = nav.doNotTrack ?? nav.msDoNotTrack ??
    (typeof window !== 'undefined' ? (window as unknown as { doNotTrack?: string }).doNotTrack : undefined)
  return dnt === '1' || dnt === 'yes'
}

/** The gate every collection path checks first. */
export function isTrackingAllowed (): boolean {
  return hasAnalyticsConsent() && !hasBrowserOptOut()
}

/**
 * Emit one custom product event to the GTM dataLayer. No-ops silently when
 * tracking is not allowed, so callers can fire it unconditionally from UI
 * handlers.
 */
export function track (event: AnalyticsEvent, params: TrackParams = {}): void {
  if (typeof window === 'undefined' || !isTrackingAllowed()) return
  try {
    const w = window as DataLayerWindow
    w.dataLayer = w.dataLayer ?? []
    w.dataLayer.push({ event, ...toDataLayerParams(params) })
  } catch {
    /* never let analytics throw into a UI handler */
  }
}

export type { TrackParams } from '../model/events'
