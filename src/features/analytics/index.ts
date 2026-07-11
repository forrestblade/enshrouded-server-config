/**
 * features/analytics — public API (Feature-Sliced Design feature barrel).
 *
 * Client-safe surface: the custom-event contract, the consent-gated dataLayer
 * emitter, the one-time init, and the third-party (GTM/GA4) orchestrator. All
 * analytics flow through Google Tag Manager + GA4 (consent-gated); there is no
 * first-party pipeline or dashboard — GA4 owns reporting.
 */
export { track, isTrackingAllowed, hasBrowserOptOut, type TrackParams } from './lib/track'
export { initAnalytics, type InitOptions } from './lib/init'
export { enableThirdParty, disableThirdParty, type ThirdPartyTags } from './lib/third-party'
export { ANALYTICS_EVENTS, type AnalyticsEvent } from './model/events'
