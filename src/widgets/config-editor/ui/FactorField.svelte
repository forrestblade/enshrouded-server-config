<script lang="ts">
  import { NS_PER_MINUTE, type NumericFieldSpec } from '@/entities/server-config'

  interface Props {
    label: string
    value: number
    spec: NumericFieldSpec
    disabled?: boolean
    help?: string
    onchange: (value: number) => void
  }

  let { label, value, spec, disabled = false, help, onchange }: Props = $props()

  const isDuration = $derived(Boolean(spec.duration))
  const toDisplay = (v: number): number => (isDuration ? Math.round(v / NS_PER_MINUTE) : v)
  const fromDisplay = (v: number): number => (isDuration ? Math.round(v * NS_PER_MINUTE) : v)

  const dMin = $derived(toDisplay(spec.min))
  const dMax = $derived(toDisplay(spec.max))
  const dStep = $derived(isDuration ? 1 : spec.step)
  const dValue = $derived(toDisplay(value))
  const unit = $derived(isDuration ? ' min' : '×')
  const pct = $derived(dMax > dMin ? ((dValue - dMin) / (dMax - dMin)) * 100 : 0)

  function handle (event: Event): void {
    const n = Number((event.currentTarget as HTMLInputElement).value)
    if (!Number.isNaN(n)) onchange(fromDisplay(n))
  }
</script>

<div class="field" class:disabled>
  <div class="field-top">
    <span class="field-label">{label}</span>
    <span class="field-value">{dValue}{unit}</span>
  </div>
  <input
    class="range"
    type="range"
    min={dMin}
    max={dMax}
    step={dStep}
    value={dValue}
    oninput={handle}
    {disabled}
    aria-label={label}
    style={`--pct:${pct}%`}
  />
  {#if help}<p class="field-help">{help}</p>{/if}
</div>

<style>
  .field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .field.disabled {
    opacity: 0.4;
    pointer-events: none;
  }
  .field-top {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: var(--space-3);
  }
  .field-label {
    font-size: var(--fs-sm);
    color: var(--text-muted);
  }
  .field-value {
    font-size: var(--fs-sm);
    font-variant-numeric: tabular-nums;
    color: var(--text);
  }
  .field-help {
    font-size: var(--fs-xs);
    color: var(--text-dim);
  }

  .range {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 4px;
    border-radius: 999px;
    background:
      linear-gradient(var(--accent), var(--accent)) no-repeat,
      var(--surface-3);
    background-size: var(--pct) 100%;
    cursor: pointer;
  }
  .range::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--text);
    cursor: pointer;
    transition: transform 0.1s ease;
  }
  .range::-webkit-slider-thumb:hover {
    transform: scale(1.15);
  }
  .range::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border: none;
    border-radius: 50%;
    background: var(--text);
    cursor: pointer;
  }
</style>
