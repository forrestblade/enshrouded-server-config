// Singleton MutationObserver on <html lang>.
// All ValElements subscribe in connectedCallback, unsubscribe in disconnectedCallback.
function resolveLocale() {
    if (typeof document === 'undefined')
        return 'en';
    return document.documentElement.lang || 'en';
}
class LocaleObserverImpl {
    subscribers = new Set();
    observer = null;
    lastLocale = resolveLocale();
    get locale() {
        return resolveLocale();
    }
    subscribe(sub) {
        this.subscribers.add(sub);
        if (this.subscribers.size === 1) {
            this.startObserving();
        }
    }
    unsubscribe(sub) {
        this.subscribers.delete(sub);
        if (this.subscribers.size === 0) {
            this.stopObserving();
        }
    }
    startObserving() {
        if (typeof document === 'undefined')
            return;
        this.lastLocale = resolveLocale();
        this.observer = new MutationObserver(() => {
            const newLocale = resolveLocale();
            if (newLocale === this.lastLocale)
                return;
            this.lastLocale = newLocale;
            for (const sub of this.subscribers) {
                sub.localeChanged(newLocale);
            }
        });
        this.observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['lang']
        });
    }
    stopObserving() {
        if (this.observer !== null) {
            this.observer.disconnect();
            this.observer = null;
        }
    }
    /** Test-only: disconnect observer and clear all subscribers. */
    _reset() {
        this.stopObserving();
        this.subscribers.clear();
        this.lastLocale = resolveLocale();
    }
}
export const localeObserver = new LocaleObserverImpl();
//# sourceMappingURL=locale-observer.js.map