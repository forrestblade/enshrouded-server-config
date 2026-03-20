// ThemeManager — singleton for programmatic theme switching via Constructable Stylesheets.
// Follows the localeObserver pattern: components subscribe their shadow roots,
// ThemeManager adopts the active token sheet into each.
import { lightTokenSheet, darkTokenSheet, mergeTokenSheets } from './token-sheets.js';
export const ThemeMode = {
    Light: 'light',
    Dark: 'dark',
    System: 'system',
};
function getDarkMatcher() {
    if (typeof globalThis.matchMedia === 'function') {
        return globalThis.matchMedia('(prefers-color-scheme: dark)');
    }
    return { matches: false, addEventListener() { }, removeEventListener() { } };
}
class ThemeManagerImpl {
    _mode = ThemeMode.Light;
    _roots = new Set();
    _overrideSheet = null;
    _activeSheet = lightTokenSheet;
    _darkMatcher = getDarkMatcher();
    _systemHandler = (e) => {
        if (this._mode !== ThemeMode.System)
            return;
        this._applyResolved(e.matches ? 'dark' : 'light');
    };
    resolveTheme() {
        const resolved = {
            [ThemeMode.Light]: () => 'light',
            [ThemeMode.Dark]: () => 'dark',
            [ThemeMode.System]: () => this._darkMatcher.matches ? 'dark' : 'light',
        };
        return resolved[this._mode]();
    }
    setTheme(mode) {
        this._mode = mode;
        if (mode === ThemeMode.System) {
            this._darkMatcher.addEventListener('change', this._systemHandler);
        }
        else {
            this._darkMatcher.removeEventListener('change', this._systemHandler);
        }
        this._applyResolved(this.resolveTheme());
        document.dispatchEvent(new CustomEvent('val:theme-change', {
            detail: { mode, resolved: this.resolveTheme() },
        }));
    }
    getActiveSheet() {
        return this._activeSheet;
    }
    subscribe(root) {
        this._roots.add(root);
        root.adoptedStyleSheets = [...root.adoptedStyleSheets, this._activeSheet];
    }
    unsubscribe(root) {
        this._roots.delete(root);
        root.adoptedStyleSheets = root.adoptedStyleSheets.filter(s => s !== this._activeSheet && s !== lightTokenSheet && s !== darkTokenSheet);
    }
    applyOverrides(sheet) {
        this._overrideSheet = sheet;
        const base = this.resolveTheme() === 'dark' ? darkTokenSheet : lightTokenSheet;
        this._updateActive(mergeTokenSheets(base, sheet));
    }
    clearOverrides() {
        this._overrideSheet = null;
        const base = this.resolveTheme() === 'dark' ? darkTokenSheet : lightTokenSheet;
        this._updateActive(base);
    }
    /** Test-only: reset all state. */
    _reset() {
        this._darkMatcher.removeEventListener('change', this._systemHandler);
        this._roots.clear();
        this._overrideSheet = null;
        this._mode = ThemeMode.Light;
        this._activeSheet = lightTokenSheet;
        this._darkMatcher = getDarkMatcher();
    }
    _applyResolved(resolved) {
        const base = resolved === 'dark' ? darkTokenSheet : lightTokenSheet;
        if (this._overrideSheet !== null) {
            this._updateActive(mergeTokenSheets(base, this._overrideSheet));
        }
        else {
            this._updateActive(base);
        }
    }
    _updateActive(newSheet) {
        const oldSheet = this._activeSheet;
        this._activeSheet = newSheet;
        for (const root of this._roots) {
            root.adoptedStyleSheets = root.adoptedStyleSheets
                .filter(s => s !== oldSheet)
                .concat([newSheet]);
        }
    }
}
export const themeManager = new ThemeManagerImpl();
//# sourceMappingURL=theme-manager.js.map