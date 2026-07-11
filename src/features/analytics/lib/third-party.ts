/**
 * features/analytics/lib/third-party — the opt-in "classic martech" orchestrator.
 *
 * Loads whichever Google tags are configured (GTM container and/or direct GA4),
 * all sharing one dataLayer and one Consent Mode v2 state. This is the ONLY
 * place that decides ordering:
 *   1. push Consent Mode v2 denied defaults (once, before any tag loads),
 *   2. update analytics_storage to granted,
 *   3. load the GTM container and/or GA4 gtag.
 *
 * Everything here runs ONLY after the viewer granted consent — before that, no
 * Google script is on the page at all. Both loaders may be active at once
 * (Setup B in docs/TRACKING_SPEC.md §5: direct GA4 owns page_view, GTM routes
 * the custom events); the page_view double-count rule is enforced by container
 * configuration, not here.
 */
import { pushConsentDefaultDenied, updateAnalyticsConsent } from './consent-mode'
import { loadGtm } from './gtm'
import { loadGa4 } from './ga4'

export interface ThirdPartyTags {
  /** GTM container id (PUBLIC_GTM_CONTAINER_ID). Empty = no container. */
  gtmId?: string
  /** GA4 measurement id (PUBLIC_GA4_MEASUREMENT_ID). Empty = no direct GA4. */
  ga4Id?: string
}

let enabled = false

/** Grant + load the configured Google tags. No-op when nothing is configured. */
export function enableThirdParty (tags: ThirdPartyTags): void {
  const gtmId = (tags.gtmId ?? '').trim()
  const ga4Id = (tags.ga4Id ?? '').trim()
  if (!gtmId && !ga4Id) return

  pushConsentDefaultDenied()
  updateAnalyticsConsent(true)
  if (gtmId) loadGtm(gtmId)
  if (ga4Id) loadGa4(ga4Id)
  enabled = true
}

/** Revoke analytics consent for any loaded tags (used on consent revoke). */
export function disableThirdParty (): void {
  if (!enabled) return
  updateAnalyticsConsent(false)
}

/** Whether any third-party tag has been enabled this session. */
export function thirdPartyEnabled (): boolean {
  return enabled
}
