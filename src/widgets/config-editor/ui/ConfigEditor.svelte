<script lang="ts">
  import { onMount } from 'svelte'
  import {
    defaultServerConfig,
    validateServerConfig,
    stringifyEnshroudedJson,
    downloadEnshroudedJson,
    buildTemplateSettings,
    getPresetTemplate,
    PRESET_TEMPLATES,
    GAME_NUMERIC_FIELDS,
    GAME_SETTINGS_SECTIONS,
    GAME_SETTINGS_PRESETS,
    VOICE_CHAT_MODES,
  } from '@/entities/server-config'
  import type { ServerConfig, GameSettings, NumericFieldKey } from '@/entities/server-config'
  import FactorField from './FactorField.svelte'
  import UserGroupsEditor from './UserGroupsEditor.svelte'

  const DRAFT_KEY = 'esc:draft:v1'

  let config = $state<ServerConfig>(defaultServerConfig())
  let publicPreview = $state(false)
  let copied = $state(false)
  let showAdvanced = $state(false)

  const snap = $derived($state.snapshot(config) as ServerConfig)
  const validation = $derived(validateServerConfig(snap))
  const isValid = $derived(validation.isOk())
  const issues = $derived(validation.isErr() ? validation.error.issues : [])
  const isCustom = $derived(config.gameSettingsPreset === 'Custom')
  const gsDisabled = $derived(!isCustom)
  const json = $derived(stringifyEnshroudedJson(snap, { public: publicPreview }))
  const highlighted = $derived(highlight(json))

  function setGS (key: keyof GameSettings, value: unknown): void {
    ;(config.gameSettings as Record<string, unknown>)[key] = value
  }

  function applyTemplate (id: string): void {
    const template = getPresetTemplate(id)
    if (!template) return
    config.gameSettingsPreset = 'Custom'
    Object.assign(config.gameSettings, buildTemplateSettings(template))
  }

  function resetDefaults (): void {
    Object.assign(config, defaultServerConfig())
  }

  async function copyJson (): Promise<void> {
    try {
      await navigator.clipboard.writeText(json)
      copied = true
      setTimeout(() => { copied = false }, 1500)
    } catch { /* clipboard unavailable */ }
  }

  function download (): void {
    downloadEnshroudedJson(snap, { public: publicPreview })
  }

  function highlight (source: string): string {
    const esc = source.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    return esc.replace(
      /("(?:\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
      (match) => {
        let cls = 'num'
        if (match.startsWith('"')) cls = /:$/.test(match) ? 'key' : 'str'
        else if (match === 'true' || match === 'false') cls = 'bool'
        else if (match === 'null') cls = 'null'
        return `<span class="t-${cls}">${match}</span>`
      },
    )
  }

  onMount(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) {
        const restored = validateServerConfig(JSON.parse(raw))
        if (restored.isOk()) Object.assign(config, restored.value)
      }
    } catch { /* ignore bad draft */ }
  })

  $effect(() => {
    const current = $state.snapshot(config)
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(current)) } catch { /* quota / private mode */ }
  })
</script>

<div class="editor">
  <header class="editor-head">
    <input class="config-title" type="text" bind:value={config.name} aria-label="Config name" spellcheck="false" />
  </header>

  <div class="templates">
    <span class="templates-label">Start from</span>
    {#each PRESET_TEMPLATES as t (t.id)}
      <button class="chip" type="button" onclick={() => applyTemplate(t.id)} title={t.description}>{t.label}</button>
    {/each}
  </div>

  <div class="editor-grid">
    <div class="editor-form">
      <section class="fieldset">
        <h3 class="fieldset-title">Server</h3>
        <div class="rows">
          <label class="row"><span>Slots</span><input type="number" min="1" max="16" bind:value={config.slotCount} /></label>
          <label class="row"><span>Voice chat mode</span>
            <select bind:value={config.voiceChatMode}>{#each VOICE_CHAT_MODES as m (m)}<option value={m}>{m}</option>{/each}</select>
          </label>
          <label class="row"><span>Game preset</span>
            <select bind:value={config.gameSettingsPreset}>{#each GAME_SETTINGS_PRESETS as p (p)}<option value={p}>{p}</option>{/each}</select>
          </label>
          <label class="row toggle"><span>Voice chat</span><input type="checkbox" bind:checked={config.enableVoiceChat} /></label>
          <label class="row toggle"><span>Text chat</span><input type="checkbox" bind:checked={config.enableTextChat} /></label>
        </div>

        {#if gsDisabled}
          <p class="notice">Game settings are ignored while the preset is “{config.gameSettingsPreset}”. Switch to Custom to edit them.</p>
        {/if}

        <button class="link-btn" type="button" onclick={() => { showAdvanced = !showAdvanced }}>
          {showAdvanced ? 'Hide' : 'Show'} advanced host fields
        </button>
        {#if showAdvanced}
          <div class="rows">
            <label class="row"><span>Save directory</span><input type="text" bind:value={config.saveDirectory} /></label>
            <label class="row"><span>Log directory</span><input type="text" bind:value={config.logDirectory} /></label>
            <label class="row"><span>IP</span><input type="text" bind:value={config.ip} /></label>
            <label class="row"><span>Query port</span><input type="number" min="1" max="65535" bind:value={config.queryPort} /></label>
          </div>
        {/if}
      </section>

      {#each GAME_SETTINGS_SECTIONS as section (section.id)}
        <section class="fieldset" class:muted={gsDisabled}>
          <h3 class="fieldset-title">{section.title}</h3>
          <div class="grid-fields">
            {#each section.fields as field (field.key)}
              {#if field.control === 'number' || field.control === 'duration'}
                <FactorField
                  label={field.label}
                  value={config.gameSettings[field.key] as number}
                  spec={GAME_NUMERIC_FIELDS[field.key as NumericFieldKey]}
                  disabled={gsDisabled}
                  help={field.help}
                  onchange={(v) => setGS(field.key, v)}
                />
              {:else if field.control === 'boolean'}
                <label class="toggle-field" class:disabled={gsDisabled}>
                  <span>{field.label}</span>
                  <input
                    type="checkbox"
                    checked={config.gameSettings[field.key] as boolean}
                    disabled={gsDisabled}
                    onchange={(e) => setGS(field.key, (e.currentTarget as HTMLInputElement).checked)}
                  />
                </label>
              {:else}
                <label class="select-field" class:disabled={gsDisabled}>
                  <span>{field.label}</span>
                  <select
                    value={config.gameSettings[field.key] as string}
                    disabled={gsDisabled}
                    onchange={(e) => setGS(field.key, (e.currentTarget as HTMLSelectElement).value)}
                  >
                    {#each field.options ?? [] as opt (opt)}<option value={opt}>{opt}</option>{/each}
                  </select>
                </label>
              {/if}
            {/each}
          </div>
        </section>
      {/each}

      <section class="fieldset">
        <h3 class="fieldset-title">User groups</h3>
        <UserGroupsEditor groups={config.userGroups} />
      </section>
    </div>

    <div class="editor-side">
      <aside class="editor-output">
        <div class="output-head">
          <span class="output-title">enshrouded_server.json</span>
          <span class="status" class:ok={isValid} class:bad={!isValid}>{isValid ? 'Valid' : 'Invalid'}</span>
        </div>
        <label class="output-toggle">
          <input type="checkbox" bind:checked={publicPreview} />
          <span>Public preview (strip host fields + passwords)</span>
        </label>
        <pre class="json"><code>{@html highlighted}</code></pre>
        {#if !isValid && issues.length > 0}
          <div class="issues">
            {#each issues.slice(0, 4) as issue (issue.path.join('.'))}
              <p><span class="issue-path">{issue.path.join('.') || 'root'}</span> {issue.message}</p>
            {/each}
          </div>
        {/if}
      </aside>
      <div class="output-actions">
        <button class="btn btn-primary" type="button" onclick={download}>Download</button>
        <button class="btn" type="button" onclick={copyJson}>{copied ? 'Copied' : 'Copy JSON'}</button>
        <button class="btn" type="button" onclick={resetDefaults}>Reset</button>
      </div>
    </div>
  </div>
</div>

<style>
  .editor {
    max-width: 1340px;
    margin-inline: auto;
    padding: var(--space-6) var(--space-5) var(--space-8);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .editor-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    flex-wrap: wrap;
  }
  .config-title {
    flex: 1;
    min-width: 12rem;
    background: none;
    border: none;
    border-bottom: 1px solid transparent;
    color: var(--text);
    font-size: var(--fs-2xl);
    font-weight: 600;
    letter-spacing: -0.02em;
    padding: 0.15rem 0;
  }
  .config-title:hover {
    border-bottom-color: var(--border-2);
  }
  .config-title:focus-visible {
    outline: none;
    border-bottom-color: var(--accent);
  }
  .output-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    gap: var(--space-2);
  }

  .templates {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--space-2);
  }
  .templates-label {
    font-size: var(--fs-xs);
    color: var(--text-dim);
    margin-right: var(--space-1);
  }
  .chip {
    background: var(--surface-2);
    border: 1px solid var(--border-2);
    color: var(--text-muted);
    border-radius: 999px;
    padding: 0.3rem 0.75rem;
    font-size: var(--fs-sm);
    cursor: pointer;
  }
  .chip:hover {
    color: var(--text);
    border-color: var(--accent);
  }

  .editor-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 400px;
    gap: var(--space-4);
    align-items: start;
  }
  .editor-form {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .fieldset {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: var(--space-5);
  }
  .fieldset.muted .fieldset-title {
    color: var(--text-dim);
  }
  .fieldset-title {
    font-size: var(--fs-sm);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-muted);
    margin-bottom: var(--space-4);
  }

  .rows {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: var(--space-3) var(--space-5);
  }
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    font-size: var(--fs-sm);
    color: var(--text-muted);
  }
  .row.toggle {
    cursor: pointer;
  }
  .row input[type='text'],
  .row input[type='number'],
  .row select,
  .select-field select {
    background: var(--surface-2);
    color: var(--text);
    border: 1px solid var(--border-2);
    border-radius: var(--radius-sm);
    padding: 0.35rem 0.5rem;
    font-size: var(--fs-sm);
    max-width: 9rem;
  }
  .row select {
    max-width: 11rem;
  }
  input[type='checkbox'] {
    accent-color: var(--accent);
    width: 16px;
    height: 16px;
    cursor: pointer;
  }
  :focus-visible {
    outline-offset: 1px;
  }
  .row input:focus-visible,
  .row select:focus-visible,
  .select-field select:focus-visible {
    outline: none;
    border-color: var(--accent);
  }

  .grid-fields {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
    gap: var(--space-4) var(--space-5);
  }
  .toggle-field,
  .select-field {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    font-size: var(--fs-sm);
    color: var(--text-muted);
  }
  .toggle-field.disabled,
  .select-field.disabled {
    opacity: 0.4;
    pointer-events: none;
  }

  .notice {
    margin-top: var(--space-3);
    padding: var(--space-2) var(--space-3);
    background: var(--surface-2);
    border-left: 2px solid var(--warn);
    border-radius: var(--radius-sm);
    font-size: var(--fs-sm);
    color: var(--text-muted);
  }
  .link-btn {
    margin-top: var(--space-3);
    background: none;
    border: none;
    color: var(--accent);
    font-size: var(--fs-sm);
    cursor: pointer;
    padding: 0;
  }
  .link-btn:hover {
    color: var(--accent-hover);
  }

  .editor-side {
    position: sticky;
    top: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
  .editor-output {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    background: #0b0c0d;
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
  }
  .output-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .output-title {
    font-family: var(--font-mono);
    font-size: var(--fs-sm);
    color: var(--text-muted);
  }
  .status {
    font-size: var(--fs-xs);
    font-weight: 600;
    padding: 0.15rem 0.5rem;
    border-radius: 999px;
  }
  .status.ok {
    color: var(--ok);
    background: color-mix(in srgb, var(--ok) 14%, transparent);
  }
  .status.bad {
    color: var(--danger);
    background: color-mix(in srgb, var(--danger) 14%, transparent);
  }
  .output-toggle {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: var(--fs-xs);
    color: var(--text-dim);
    cursor: pointer;
  }
  .json {
    margin: 0;
    max-height: calc(100vh - 15rem);
    overflow: auto;
    font-family: var(--font-mono);
    font-size: 0.8rem;
    line-height: 1.5;
    color: var(--text-dim);
    white-space: pre;
  }
  .json :global(.t-key) {
    color: #7aa2e3;
  }
  .json :global(.t-str) {
    color: #9bce8a;
  }
  .json :global(.t-num) {
    color: #e0a56b;
  }
  .json :global(.t-bool) {
    color: #c68fd4;
  }
  .json :global(.t-null) {
    color: var(--text-dim);
  }
  .issues {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    font-size: var(--fs-xs);
    color: var(--danger);
  }
  .issue-path {
    font-family: var(--font-mono);
    color: var(--text-muted);
  }

  @media (max-width: 960px) {
    .editor-grid {
      grid-template-columns: 1fr;
    }
    .editor-side {
      position: static;
    }
    .json {
      max-height: 22rem;
    }
  }
</style>
