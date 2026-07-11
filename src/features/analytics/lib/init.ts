/**
 * features/analytics/lib/init — one-time client wiring for analytics.
 *
 * Mounted once by the Layout via a `client:idle` island. Responsibilities:
 *   - enable the consent-gated third-party tags (GTM + GA4) if consent is
 *     already granted on load, and react to consent changes mid-session
 *     (granting loads the tags without a reload; revoking flips Consent Mode
 *     back to denied);
 *   - delegate click tracking for declarative `[data-esc-track]` buttons
 *     (copy, download) from a single document listener that survives SPA
 *     navigation.
 *
 * Pageviews, SPA navigations, and site search are intentionally NOT handled
 * here — GA4 Enhanced Measurement covers them (see ../model/events and
 * docs/TRACKING_SPEC.md). Product actions inside persistent Svelte islands
 * (publish, like, fork) call `track()` directly from their handlers.
 */
import { CONSENT_EVENT } from '@/features/consent/lib/consent'
import { track, isTrackingAllowed } from './track'
import { enableThirdParty, disableThirdParty, type ThirdPartyTags } from './third-party'
import { ANALYTICS_EVENTS, type AnalyticsEvent } from '../model/events'

export interface InitOptions {
  /** GTM container id (PUBLIC_GTM_CONTAINER_ID). Empty = no container. */
  gtmId?: string
  /** GA4 measurement id (PUBLIC_GA4_MEASUREMENT_ID). Empty = no direct GA4. */
  ga4Id?: string
}

let started = false

function isAnalyticsEvent (value: string | null): value is AnalyticsEvent {
  return value != null && (ANALYTICS_EVENTS as readonly string[]).includes(value)
}

/** Delegate clicks on `[data-esc-track]` elements to a track() call. */
function handleTrackedClick (event: MouseEvent): void {
  const target = event.target
  if (!(target instanceof Element)) return
  const el = target.closest('[data-esc-track]')
  if (!el) return
  const name = el.getAttribute('data-esc-track')
  if (!isAnalyticsEvent(name)) return
  track(name, { configSlug: el.getAttribute('data-esc-track-slug') ?? undefined })
}

export function initAnalytics (opts: InitOptions = {}): void {
  if (typeof window === 'undefined' || started) return
  started = true
  const tags: ThirdPartyTags = { gtmId: opts.gtmId, ga4Id: opts.ga4Id }

  document.addEventListener('click', handleTrackedClick)

  window.addEventListener(CONSENT_EVENT, (event: Event) => {
    const decision = (event as CustomEvent<string>).detail
    if (decision === 'granted' && isTrackingAllowed()) {
      enableThirdParty(tags)
    } else if (decision === 'denied') {
      disableThirdParty()
    }
  })

  if (isTrackingAllowed()) enableThirdParty(tags)
}
