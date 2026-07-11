/**
 * features/analytics/model/events — the custom event catalog for GTM/GA4.
 *
 * This project's analytics run entirely through Google Tag Manager + GA4
 * (consent-gated). We do NOT run a bespoke first-party pipeline or dashboard —
 * GA4 handles reporting.
 *
 * GA4 Enhanced Measurement already covers, with NO code:
 *   - page_view (incl. SPA navigations, via "page changes based on browser
 *     history events" — Astro's <ClientRouter/> uses the History API),
 *   - view_search_results (site search on the `q` query param of /browse),
 *   - scroll / outbound click / etc.
 *
 * So this catalog is ONLY the product interactions GA4 cannot infer on its own.
 * Each one is pushed to `window.dataLayer` as `{ event, ...params }` (see
 * ../lib/track); the owner wires a GTM trigger + GA4 event tag per name. See
 * docs/TRACKING_SPEC.md for the exact GTM/GA4 setup.
 *
 * Names are snake_case to match GA4 event-name conventions. Append-only.
 */
export const ANALYTICS_EVENTS = [
  'publish',
  'like',
  'fork',
  'download',
  'copy',
] as const

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number]

/**
 * PII-free params for a custom event. Only known keys are forwarded to the
 * dataLayer (as snake_case); everything else is dropped. Never put a user id,
 * email, IP, or raw free-text here.
 */
export interface TrackParams {
  /** Config slug for config-scoped events (publish/like/fork/download/copy). */
  configSlug?: string
  /** Publish visibility: 'public' | 'unlisted' | 'private'. */
  visibility?: string
  /** Like toggle direction: 'on' | 'off'. */
  likeState?: string
}

/** Map the typed params to the snake_case keys pushed onto the dataLayer. */
export function toDataLayerParams (params: TrackParams): Record<string, string> {
  const out: Record<string, string> = {}
  if (params.configSlug) out.config_slug = params.configSlug.slice(0, 128)
  if (params.visibility) out.visibility = params.visibility.slice(0, 32)
  if (params.likeState) out.like_state = params.likeState.slice(0, 8)
  return out
}
