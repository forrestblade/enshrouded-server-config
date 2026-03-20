// node_modules/.pnpm/@valencets+ui@0.2.0/node_modules/@valencets/ui/dist/core/locale-observer.js
function resolveLocale() {
  if (typeof document === "undefined")
    return "en";
  return document.documentElement.lang || "en";
}
var LocaleObserverImpl = class {
  subscribers = /* @__PURE__ */ new Set();
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
    if (typeof document === "undefined")
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
      attributeFilter: ["lang"]
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
};
var localeObserver = new LocaleObserverImpl();

// node_modules/.pnpm/@valencets+ui@0.2.0/node_modules/@valencets/ui/dist/tokens/token-sheets.js
function createTokenSheet(cssText) {
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(cssText);
  return sheet;
}
var PRIMITIVES_CSS = `  /* --- Gray scale --- */
  --val-gray-50: oklch(0.9846 0.0017 247.84);
  --val-gray-100: oklch(0.9670 0.0029 264.54);
  --val-gray-200: oklch(0.9276 0.0058 264.53);
  --val-gray-300: oklch(0.8717 0.0093 258.34);
  --val-gray-400: oklch(0.7137 0.0192 261.32);
  --val-gray-500: oklch(0.5510 0.0234 264.36);
  --val-gray-600: oklch(0.4461 0.0263 256.80);
  --val-gray-700: oklch(0.3729 0.0306 259.73);
  --val-gray-800: oklch(0.2781 0.0296 256.85);
  --val-gray-900: oklch(0.2101 0.0318 264.66);
  --val-gray-950: oklch(0.1296 0.0274 261.69);

  /* --- Blue scale --- */
  --val-blue-50: oklch(0.9705 0.0142 254.60);
  --val-blue-100: oklch(0.9319 0.0316 255.59);
  --val-blue-200: oklch(0.8823 0.0571 254.13);
  --val-blue-300: oklch(0.8091 0.0956 251.81);
  --val-blue-400: oklch(0.7137 0.1434 254.62);
  --val-blue-500: oklch(0.6231 0.1880 259.81);
  --val-blue-600: oklch(0.5461 0.2152 262.88);
  --val-blue-700: oklch(0.4882 0.2172 264.38);
  --val-blue-800: oklch(0.4244 0.1809 265.64);
  --val-blue-900: oklch(0.3791 0.1378 265.52);

  /* --- Red scale --- */
  --val-red-50: oklch(0.9705 0.0129 17.38);
  --val-red-100: oklch(0.9356 0.0309 17.72);
  --val-red-200: oklch(0.8845 0.0593 18.33);
  --val-red-300: oklch(0.8077 0.1035 19.57);
  --val-red-400: oklch(0.7106 0.1661 22.22);
  --val-red-500: oklch(0.6368 0.2078 25.33);
  --val-red-600: oklch(0.5771 0.2152 27.33);
  --val-red-700: oklch(0.5054 0.1905 27.52);
  --val-red-800: oklch(0.4437 0.1613 26.90);
  --val-red-900: oklch(0.3958 0.1331 25.72);

  /* --- Green scale --- */
  --val-green-50: oklch(0.9819 0.0181 155.83);
  --val-green-100: oklch(0.9624 0.0434 156.74);
  --val-green-200: oklch(0.9250 0.0806 155.99);
  --val-green-300: oklch(0.8712 0.1363 154.45);
  --val-green-400: oklch(0.8003 0.1821 151.71);
  --val-green-500: oklch(0.7227 0.1920 149.58);
  --val-green-600: oklch(0.6271 0.1699 149.21);
  --val-green-700: oklch(0.5273 0.1371 150.07);
  --val-green-800: oklch(0.4479 0.1083 151.33);
  --val-green-900: oklch(0.3925 0.0896 152.54);

  /* --- Amber scale --- */
  --val-amber-50: oklch(0.9869 0.0214 95.28);
  --val-amber-100: oklch(0.9619 0.0580 95.62);
  --val-amber-200: oklch(0.9243 0.1151 95.75);
  --val-amber-300: oklch(0.8790 0.1534 91.61);
  --val-amber-400: oklch(0.8369 0.1644 84.43);
  --val-amber-500: oklch(0.7686 0.1647 70.08);
  --val-amber-600: oklch(0.6658 0.1574 58.32);
  --val-amber-700: oklch(0.5553 0.1455 49.00);
  --val-amber-800: oklch(0.4732 0.1247 46.20);
  --val-amber-900: oklch(0.4137 0.1054 45.90);

  /* --- Spacing (4px base) --- */
  --val-space-0: 0;
  --val-space-1: 0.25rem;
  --val-space-2: 0.5rem;
  --val-space-3: 0.75rem;
  --val-space-4: 1rem;
  --val-space-5: 1.25rem;
  --val-space-6: 1.5rem;
  --val-space-8: 2rem;
  --val-space-10: 2.5rem;
  --val-space-12: 3rem;
  --val-space-16: 4rem;
  --val-space-20: 5rem;
  --val-space-24: 6rem;

  /* --- Typography --- */
  --val-font-sans: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --val-font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;

  /* Modular type scale (1.25 ratio) */
  --val-text-xs: 0.75rem;
  --val-text-sm: 0.875rem;
  --val-text-base: 1rem;
  --val-text-lg: 1.125rem;
  --val-text-xl: 1.25rem;
  --val-text-2xl: 1.5rem;
  --val-text-3xl: 1.875rem;
  --val-text-4xl: 2.25rem;
  --val-text-5xl: 3rem;

  --val-leading-tight: 1.25;
  --val-leading-normal: 1.5;
  --val-leading-relaxed: 1.75;

  --val-weight-normal: 400;
  --val-weight-medium: 500;
  --val-weight-semibold: 600;
  --val-weight-bold: 700;

  /* --- Border radius --- */
  --val-radius-sm: 0.25rem;
  --val-radius-md: 0.375rem;
  --val-radius-lg: 0.5rem;
  --val-radius-full: 9999px;

  /* --- Shadows --- */
  --val-shadow-sm: 0 1px 2px 0 oklch(0 0 0 / 0.05);
  --val-shadow-md: 0 4px 6px -1px oklch(0 0 0 / 0.1), 0 2px 4px -2px oklch(0 0 0 / 0.1);
  --val-shadow-lg: 0 10px 15px -3px oklch(0 0 0 / 0.1), 0 4px 6px -4px oklch(0 0 0 / 0.1);

  /* --- Duration --- */
  --val-duration-fast: 100ms;
  --val-duration-normal: 200ms;
  --val-duration-slow: 300ms;

  /* --- Easing --- */
  --val-ease-in: cubic-bezier(0.4, 0, 1, 1);
  --val-ease-out: cubic-bezier(0, 0, 0.2, 1);
  --val-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
`;
var LIGHT_SEMANTIC_CSS = `  /* --- Surface (light) --- */
  --val-color-bg: var(--val-gray-50);
  --val-color-bg-elevated: oklch(1 0 0);
  --val-color-bg-muted: var(--val-gray-100);

  /* --- Text (light) --- */
  --val-color-text: var(--val-gray-900);
  --val-color-text-muted: var(--val-gray-500);
  --val-color-text-inverted: oklch(1 0 0);

  /* --- Interactive --- */
  --val-color-primary: var(--val-blue-600);
  --val-color-primary-hover: var(--val-blue-700);
  --val-color-primary-text: oklch(1 0 0);

  /* --- Feedback --- */
  --val-color-error: var(--val-red-500);
  --val-color-success: var(--val-green-500);
  --val-color-warning: var(--val-amber-500);

  /* --- Border + Focus --- */
  --val-color-border: var(--val-gray-200);
  --val-color-border-focus: var(--val-blue-500);
  --val-focus-ring: 0 0 0 2px var(--val-color-bg), 0 0 0 4px var(--val-color-border-focus);
}`;
var DARK_SEMANTIC_CSS = `  /* --- Surface (dark) --- */
  --val-color-bg: var(--val-gray-950);
  --val-color-bg-elevated: var(--val-gray-900);
  --val-color-bg-muted: var(--val-gray-800);

  /* --- Text (dark) --- */
  --val-color-text: var(--val-gray-50);
  --val-color-text-muted: var(--val-gray-400);
  --val-color-text-inverted: oklch(1 0 0);

  /* --- Interactive --- */
  --val-color-primary: var(--val-blue-600);
  --val-color-primary-hover: var(--val-blue-700);
  --val-color-primary-text: oklch(1 0 0);

  /* --- Feedback --- */
  --val-color-error: var(--val-red-500);
  --val-color-success: var(--val-green-500);
  --val-color-warning: var(--val-amber-500);

  /* --- Border (dark) --- */
  --val-color-border: var(--val-gray-700);
  --val-color-border-focus: var(--val-blue-500);
  --val-focus-ring: 0 0 0 2px var(--val-color-bg), 0 0 0 4px var(--val-color-border-focus);
}`;
var LIGHT_TOKENS_CSS = ":root {\n" + PRIMITIVES_CSS + LIGHT_SEMANTIC_CSS + "\n}\n";
var DARK_TOKENS_CSS = ":root {\n" + PRIMITIVES_CSS + DARK_SEMANTIC_CSS + "\n}\n";
var lightTokenSheet = createTokenSheet(LIGHT_TOKENS_CSS);
var darkTokenSheet = createTokenSheet(DARK_TOKENS_CSS);
function mergeTokenSheets(...sheets) {
  const parts = [];
  for (const sheet of sheets) {
    for (let i = 0; i < sheet.cssRules.length; i++) {
      const rule = sheet.cssRules[i];
      if (rule !== void 0) {
        parts.push(rule.cssText);
      }
    }
  }
  return createTokenSheet(parts.join("\n"));
}

// node_modules/.pnpm/@valencets+ui@0.2.0/node_modules/@valencets/ui/dist/tokens/theme-manager.js
var ThemeMode = {
  Light: "light",
  Dark: "dark",
  System: "system"
};
function getDarkMatcher() {
  if (typeof globalThis.matchMedia === "function") {
    return globalThis.matchMedia("(prefers-color-scheme: dark)");
  }
  return { matches: false, addEventListener() {
  }, removeEventListener() {
  } };
}
var ThemeManagerImpl = class {
  _mode = ThemeMode.Light;
  _roots = /* @__PURE__ */ new Set();
  _overrideSheet = null;
  _activeSheet = lightTokenSheet;
  _darkMatcher = getDarkMatcher();
  _systemHandler = (e) => {
    if (this._mode !== ThemeMode.System)
      return;
    this._applyResolved(e.matches ? "dark" : "light");
  };
  resolveTheme() {
    const resolved = {
      [ThemeMode.Light]: () => "light",
      [ThemeMode.Dark]: () => "dark",
      [ThemeMode.System]: () => this._darkMatcher.matches ? "dark" : "light"
    };
    return resolved[this._mode]();
  }
  setTheme(mode) {
    this._mode = mode;
    if (mode === ThemeMode.System) {
      this._darkMatcher.addEventListener("change", this._systemHandler);
    } else {
      this._darkMatcher.removeEventListener("change", this._systemHandler);
    }
    this._applyResolved(this.resolveTheme());
    document.dispatchEvent(new CustomEvent("val:theme-change", {
      detail: { mode, resolved: this.resolveTheme() }
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
    root.adoptedStyleSheets = root.adoptedStyleSheets.filter((s) => s !== this._activeSheet && s !== lightTokenSheet && s !== darkTokenSheet);
  }
  applyOverrides(sheet) {
    this._overrideSheet = sheet;
    const base = this.resolveTheme() === "dark" ? darkTokenSheet : lightTokenSheet;
    this._updateActive(mergeTokenSheets(base, sheet));
  }
  clearOverrides() {
    this._overrideSheet = null;
    const base = this.resolveTheme() === "dark" ? darkTokenSheet : lightTokenSheet;
    this._updateActive(base);
  }
  /** Test-only: reset all state. */
  _reset() {
    this._darkMatcher.removeEventListener("change", this._systemHandler);
    this._roots.clear();
    this._overrideSheet = null;
    this._mode = ThemeMode.Light;
    this._activeSheet = lightTokenSheet;
    this._darkMatcher = getDarkMatcher();
  }
  _applyResolved(resolved) {
    const base = resolved === "dark" ? darkTokenSheet : lightTokenSheet;
    if (this._overrideSheet !== null) {
      this._updateActive(mergeTokenSheets(base, this._overrideSheet));
    } else {
      this._updateActive(base);
    }
  }
  _updateActive(newSheet) {
    const oldSheet = this._activeSheet;
    this._activeSheet = newSheet;
    for (const root of this._roots) {
      root.adoptedStyleSheets = root.adoptedStyleSheets.filter((s) => s !== oldSheet).concat([newSheet]);
    }
  }
};
var themeManager = new ThemeManagerImpl();

// node_modules/.pnpm/@valencets+ui@0.2.0/node_modules/@valencets/ui/dist/core/interaction-emitter.js
function emitInteraction(element, action, detail) {
  element.dispatchEvent(new CustomEvent("val:interaction", {
    bubbles: true,
    composed: true,
    detail: {
      ...detail,
      component: element.tagName,
      action,
      timestamp: Date.now()
    }
  }));
}

// node_modules/.pnpm/@valencets+ui@0.2.0/node_modules/@valencets/ui/dist/core/val-element.js
var ValElement = class extends HTMLElement {
  internals;
  _templateCloned = false;
  _hydrationState = "none";
  _hydrationCleanup = null;
  constructor(init) {
    super();
    const useShadow = init?.shadow !== false;
    if (useShadow) {
      this.attachShadow({ mode: "open" });
      this.internals = this.attachInternals();
    } else {
      this.internals = null;
    }
  }
  // --- Hydration ---
  get hydrated() {
    return this._hydrationState !== "pending";
  }
  _getHydrationDirective() {
    if (this.hasAttribute("hydrate:idle"))
      return { type: "idle" };
    if (this.hasAttribute("hydrate:visible"))
      return { type: "visible" };
    if (this.hasAttribute("hydrate:media")) {
      return { type: "media", value: this.getAttribute("hydrate:media") };
    }
    if (this.hasAttribute("hydrate:load"))
      return { type: "load" };
    return null;
  }
  _scheduleHydration(directive) {
    switch (directive.type) {
      case "idle": {
        const id = requestIdleCallback(() => {
          this._hydrationCleanup = null;
          this.connectedCallback();
        });
        this._hydrationCleanup = () => cancelIdleCallback(id);
        break;
      }
      case "visible": {
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
      case "media": {
        const mql = matchMedia(directive.value);
        if (mql.matches) {
          this._hydrationCleanup = null;
          this.connectedCallback();
          return;
        }
        const handler = (e) => {
          if (e.matches) {
            mql.removeEventListener("change", handler);
            this._hydrationCleanup = null;
            this.connectedCallback();
          }
        };
        mql.addEventListener("change", handler);
        this._hydrationCleanup = () => mql.removeEventListener("change", handler);
        break;
      }
    }
  }
  // --- Lifecycle ---
  connectedCallback() {
    if (this._hydrationState === "none") {
      const directive = this._getHydrationDirective();
      if (directive !== null && directive.type !== "load") {
        this._hydrationState = "pending";
        this._scheduleHydration(directive);
        return;
      }
    }
    if (this._hydrationState === "pending") {
      this._hydrationState = "complete";
    }
    if (!this._templateCloned) {
      const template2 = this.createTemplate();
      const target = this.shadowRoot ?? this;
      target.appendChild(template2.content.cloneNode(true));
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
  }
  // --- Pillar 1: Telemetry ---
  // Always dispatches. If nobody listens, events vanish.
  emitInteraction(action, detail) {
    emitInteraction(this, action, detail);
  }
  // --- Pillar 2: CMS Traceability ---
  // CMS stamps data-cms-id at render time. We just read it.
  get cmsId() {
    return this.getAttribute("data-cms-id");
  }
  // --- Pillar 3: i18n ---
  get locale() {
    return localeObserver.locale;
  }
  localeChanged(_newLocale) {
  }
};

// node_modules/.pnpm/@valencets+ui@0.2.0/node_modules/@valencets/ui/dist/core/val-form-element.js
var ValFormElement = class extends ValElement {
  static formAssociated = true;
  constructor() {
    super({ shadow: true });
  }
  // --- Form API (via ElementInternals) ---
  get form() {
    return this.internals.form;
  }
  get name() {
    return this.getAttribute("name") ?? "";
  }
  get validity() {
    return this.internals.validity;
  }
  get validationMessage() {
    return this.internals.validationMessage;
  }
  setFormValue(value) {
    this.internals.setFormValue(value);
  }
  setValidity(flags, message, anchor) {
    if (anchor !== void 0) {
      this.internals.setValidity(flags, message, anchor);
    } else {
      this.internals.setValidity(flags, message);
    }
  }
  clearValidity() {
    this.internals.setValidity({});
  }
  checkValidity() {
    return this.internals.checkValidity();
  }
  reportValidity() {
    return this.internals.reportValidity();
  }
  // --- Form Lifecycle Callbacks ---
  formResetCallback() {
  }
  formDisabledCallback(_disabled) {
  }
};

// node_modules/.pnpm/@valencets+ui@0.2.0/node_modules/@valencets/ui/dist/components/val-textarea.js
var template = document.createElement("template");
template.innerHTML = `
<style>
  :host { display: block; }
  :host([disabled]) { opacity: 0.5; }
  .wrapper {
    display: flex;
    flex-direction: column;
    gap: var(--val-space-1);
  }
  label {
    font-family: var(--val-font-sans);
    font-size: var(--val-text-sm);
    font-weight: var(--val-weight-medium);
    color: var(--val-color-text);
  }
  textarea {
    box-sizing: border-box;
    width: 100%;
    padding: var(--val-space-2) var(--val-space-3);
    border: 1px solid var(--val-color-border);
    border-radius: var(--val-radius-md);
    font-family: var(--val-font-sans);
    font-size: var(--val-text-sm);
    line-height: var(--val-leading-normal);
    color: var(--val-color-text);
    background: var(--val-color-bg-elevated);
    outline: none;
    resize: vertical;
    min-height: 5rem;
    transition: border-color var(--val-duration-fast) var(--val-ease-in-out),
                box-shadow var(--val-duration-fast) var(--val-ease-in-out);
  }
  textarea:focus { border-color: var(--val-color-border-focus); box-shadow: var(--val-focus-ring); }
  textarea::placeholder { color: var(--val-color-text-muted); }
  :host([aria-invalid="true"]) textarea { border-color: var(--val-color-error); }
  textarea:disabled { cursor: not-allowed; }
  :host([autoresize]) textarea { resize: none; overflow: hidden; }
</style>
<div class="wrapper">
  <label part="label"><slot name="label"></slot></label>
  <textarea part="textarea"></textarea>
</div>
`;
var SYNCED_ATTRS = ["placeholder", "required", "maxlength", "rows", "readonly"];
var ValTextarea = class extends ValFormElement {
  static observedAttributes = ["disabled", "value", "autoresize", ...SYNCED_ATTRS];
  textareaEl = null;
  defaultValue = "";
  createTemplate() {
    return template;
  }
  get value() {
    return this.textareaEl?.value ?? "";
  }
  set value(v) {
    if (this.textareaEl !== null) {
      this.textareaEl.value = v;
      if (this.hasAttribute("autoresize"))
        this.autoResize();
    }
    this.setFormValue(v);
  }
  connectedCallback() {
    super.connectedCallback();
    if (this.textareaEl === null) {
      this.textareaEl = this.shadowRoot.querySelector("textarea");
      this.defaultValue = this.getAttribute("value") ?? "";
      this.textareaEl.value = this.defaultValue;
      for (const attr of SYNCED_ATTRS) {
        const val = this.getAttribute(attr);
        if (val !== null)
          this.textareaEl.setAttribute(attr, val);
      }
      this.syncDisabled();
    }
    this.textareaEl.addEventListener("input", this.handleInput);
    this.textareaEl.addEventListener("change", this.handleChange);
    this.textareaEl.addEventListener("focus", this.handleFocus);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.textareaEl?.removeEventListener("input", this.handleInput);
    this.textareaEl?.removeEventListener("change", this.handleChange);
    this.textareaEl?.removeEventListener("focus", this.handleFocus);
  }
  attributeChangedCallback(name, old, val) {
    if (this.textareaEl === null)
      return;
    if (name === "disabled") {
      this.syncDisabled();
    } else if (name === "value") {
      if (val !== null)
        this.textareaEl.value = val;
    } else if (SYNCED_ATTRS.includes(name)) {
      if (val !== null) {
        this.textareaEl.setAttribute(name, val);
      } else {
        this.textareaEl.removeAttribute(name);
      }
    }
  }
  formResetCallback() {
    if (this.textareaEl !== null) {
      this.textareaEl.value = this.defaultValue;
      if (this.hasAttribute("autoresize"))
        this.autoResize();
    }
    this.setFormValue(this.defaultValue);
    this.clearValidity();
  }
  formDisabledCallback(disabled) {
    if (this.textareaEl !== null)
      this.textareaEl.disabled = disabled;
  }
  syncDisabled() {
    if (this.textareaEl !== null)
      this.textareaEl.disabled = this.hasAttribute("disabled");
  }
  autoResize() {
    if (this.textareaEl === null)
      return;
    this.textareaEl.style.height = "auto";
    this.textareaEl.style.height = this.textareaEl.scrollHeight + "px";
  }
  handleInput = () => {
    const val = this.textareaEl.value;
    this.setFormValue(val);
    if (this.hasAttribute("autoresize"))
      this.autoResize();
    this.emitInteraction("input", { value: val });
  };
  handleChange = () => {
    this.emitInteraction("change", { value: this.textareaEl.value });
  };
  handleFocus = () => {
    this.emitInteraction("focus");
  };
};
customElements.define("val-textarea", ValTextarea);
export {
  ValTextarea
};
