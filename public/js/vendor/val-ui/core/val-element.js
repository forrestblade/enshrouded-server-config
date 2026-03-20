// ValElement — protocol base class for all val-* Web Components.
// Four pillars: telemetry (interaction events), CMS traceability (data-cms-id),
// i18n (locale observer), ARIA (ElementInternals).
// Fifth concern: declarative hydration directives (hydrate:idle, hydrate:visible,
// hydrate:media, hydrate:load).
import { localeObserver } from './locale-observer.js';
import { themeManager } from '../tokens/theme-manager.js';
import { emitInteraction } from './interaction-emitter.js';
export class ValElement extends HTMLElement {
    internals;
    _templateCloned = false;
    _hydrationState = 'none';
    _hydrationCleanup = null;
    constructor(init) {
        super();
        const useShadow = init?.shadow !== false;
        if (useShadow) {
            this.attachShadow({ mode: 'open' });
            this.internals = this.attachInternals();
        }
        else {
            this.internals = null;
        }
    }
    // --- Hydration ---
    get hydrated() {
        return this._hydrationState !== 'pending';
    }
    _getHydrationDirective() {
        if (this.hasAttribute('hydrate:idle'))
            return { type: 'idle' };
        if (this.hasAttribute('hydrate:visible'))
            return { type: 'visible' };
        if (this.hasAttribute('hydrate:media')) {
            return { type: 'media', value: this.getAttribute('hydrate:media') };
        }
        if (this.hasAttribute('hydrate:load'))
            return { type: 'load' };
        return null;
    }
    _scheduleHydration(directive) {
        switch (directive.type) {
            case 'idle': {
                const id = requestIdleCallback(() => {
                    this._hydrationCleanup = null;
                    this.connectedCallback();
                });
                this._hydrationCleanup = () => cancelIdleCallback(id);
                break;
            }
            case 'visible': {
                const observer = new IntersectionObserver((entries) => {
                    for (const entry of entries) {
                        if (entry.isIntersecting) {
                            observer.disconnect();
                            this._hydrationCleanup = null;
                            this.connectedCallback();
                            break;
                        }
                    }
                });
                observer.observe(this);
                this._hydrationCleanup = () => observer.disconnect();
                break;
            }
            case 'media': {
                const mql = matchMedia(directive.value);
                if (mql.matches) {
                    this._hydrationCleanup = null;
                    this.connectedCallback();
                    return;
                }
                const handler = (e) => {
                    if (e.matches) {
                        mql.removeEventListener('change', handler);
                        this._hydrationCleanup = null;
                        this.connectedCallback();
                    }
                };
                mql.addEventListener('change', handler);
                this._hydrationCleanup = () => mql.removeEventListener('change', handler);
                break;
            }
            // 'load' is handled in connectedCallback gate (falls through)
        }
    }
    // --- Lifecycle ---
    connectedCallback() {
        // --- Hydration gate ---
        if (this._hydrationState === 'none') {
            const directive = this._getHydrationDirective();
            if (directive !== null && directive.type !== 'load') {
                this._hydrationState = 'pending';
                this._scheduleHydration(directive);
                return;
            }
        }
        if (this._hydrationState === 'pending') {
            this._hydrationState = 'complete';
        }
        // --- Normal path ---
        if (!this._templateCloned) {
            const template = this.createTemplate();
            const target = this.shadowRoot ?? this;
            target.appendChild(template.content.cloneNode(true));
            this._templateCloned = true;
        }
        localeObserver.subscribe(this);
        if (this.shadowRoot !== null) {
            themeManager.subscribe(this.shadowRoot);
        }
    }
    disconnectedCallback() {
        if (this._hydrationCleanup !== null) {
            this._hydrationCleanup();
            this._hydrationCleanup = null;
        }
        if (this.shadowRoot !== null) {
            themeManager.unsubscribe(this.shadowRoot);
        }
        localeObserver.unsubscribe(this);
    }
    attributeChangedCallback(_name, _old, _val) {
        // Subclasses override as needed
    }
    // --- Pillar 1: Telemetry ---
    // Always dispatches. If nobody listens, events vanish.
    emitInteraction(action, detail) {
        emitInteraction(this, action, detail);
    }
    // --- Pillar 2: CMS Traceability ---
    // CMS stamps data-cms-id at render time. We just read it.
    get cmsId() {
        return this.getAttribute('data-cms-id');
    }
    // --- Pillar 3: i18n ---
    get locale() {
        return localeObserver.locale;
    }
    localeChanged(_newLocale) {
        // Subclasses override to react to locale changes
    }
}
//# sourceMappingURL=val-element.js.map