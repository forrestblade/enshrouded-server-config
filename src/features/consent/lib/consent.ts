/**
 * features/consent/lib — the consent gate for invisible analytics.
 *
 * Cookieless: the decision lives in localStorage, not a cookie. Nothing is
 * collected until the state is 'granted'. Other code (analytics) reads
 * hasAnalyticsConsent() and listens for CONSENT_EVENT to react to changes.
 */
export type ConsentDecision = 'granted' | 'denied'
export type ConsentState = ConsentDecision | 'unset'

export const CONSENT_KEY = 'esc:consent:v1'
export const CONSENT_EVENT = 'esc:consentchange'
const KEY = CONSENT_KEY

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

let tabSyncStarted = false

/**
 * Cross-tab sync: `storage` events fire in OTHER tabs when the decision
 * changes, so re-dispatch CONSENT_EVENT locally — the banner updates its state
 * and the analytics loader enables/disables tags without a reload. Idempotent.
 */
export function initConsentTabSync (): void {
  if (typeof window === 'undefined' || tabSyncStarted) return
  tabSyncStarted = true
  window.addEventListener('storage', (event: StorageEvent) => {
    if (event.key !== CONSENT_KEY) return
    if (event.newValue === 'granted' || event.newValue === 'denied') {
      window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: event.newValue }))
    }
  })
}
