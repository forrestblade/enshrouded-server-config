/**
 * features/analytics/lib/consent-mode — shared Google Consent Mode v2 plumbing.
 *
 * GTM and direct GA4 both ride the SAME `window.dataLayer` and the SAME `gtag`
 * shim, so consent state must be pushed exactly ONCE regardless of how many
 * Google tags we load. This module owns that shared surface:
 *   - `ensureGtag()` creates the dataLayer + gtag shim (idempotent),
 *   - `pushConsentDefaultDenied()` sets every Consent Mode v2 signal to denied,
 *     and runs at most once (it MUST precede any container/tag initialisation),
 *   - `updateAnalyticsConsent()` flips `analytics_storage` on grant/revoke.
 *
 * This site has no ads, so `ad_storage` / `ad_user_data` / `ad_personalization`
 * stay denied forever; only `analytics_storage` is ever granted.
 */

type GtagArgs = unknown[]
interface ConsentWindow extends Window {
  dataLayer?: unknown[]
  gtag?: (...args: GtagArgs) => void
}

const DENIED_DEFAULTS = {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
} as const

let defaultPushed = false

function consentWindow (): ConsentWindow | null {
  return typeof window === 'undefined' ? null : (window as ConsentWindow)
}

/** Create the shared dataLayer + gtag shim if absent; return the gtag fn. */
export function ensureGtag (): ((...args: GtagArgs) => void) | null {
  const w = consentWindow()
  if (!w) return null
  w.dataLayer = w.dataLayer ?? []
  if (!w.gtag) {
    w.gtag = function gtag (...args: GtagArgs): void {
      w.dataLayer?.push(args)
    }
  }
  return w.gtag
}

/** Push the Consent Mode v2 denied defaults exactly once, before any tag loads. */
export function pushConsentDefaultDenied (): void {
  if (defaultPushed) return
  const gtag = ensureGtag()
  if (!gtag) return
  gtag('consent', 'default', DENIED_DEFAULTS)
  defaultPushed = true
}

/** Flip analytics storage consent on grant (true) or revoke (false). */
export function updateAnalyticsConsent (granted: boolean): void {
  const gtag = ensureGtag()
  if (!gtag) return
  gtag('consent', 'update', { analytics_storage: granted ? 'granted' : 'denied' })
}
