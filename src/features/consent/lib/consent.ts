/**
 * features/consent/lib — the consent gate for invisible analytics.
 *
 * Cookieless: the decision lives in localStorage, not a cookie. Nothing is
 * collected until the state is 'granted'. Other code (analytics) reads
 * hasAnalyticsConsent() and listens for CONSENT_EVENT to react to changes.
 */
export type ConsentDecision = 'granted' | 'denied'
export type ConsentState = ConsentDecision | 'unset'

const KEY = 'esc:consent:v1'
export const CONSENT_EVENT = 'esc:consentchange'

export function readConsent (): ConsentState {
  if (typeof localStorage === 'undefined') return 'unset'
  const value = localStorage.getItem(KEY)
  return value === 'granted' || value === 'denied' ? value : 'unset'
}

export function writeConsent (decision: ConsentDecision): void {
  if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, decision)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: decision }))
  }
}

export function hasAnalyticsConsent (): boolean {
  return readConsent() === 'granted'
}
