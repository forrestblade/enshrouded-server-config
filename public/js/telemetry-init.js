// Lightweight telemetry client matching Valence's data-attribute convention
// Captures events from elements with data-telemetry-type + data-telemetry-target
const SITE_ID = 'enshrouded-config'
const ENDPOINT = '/api/telemetry'
const FLUSH_INTERVAL = 10_000
const buffer = []

function capture (type, target, x, y) {
  buffer.push({
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    type,
    targetDOMNode: target,
    x_coord: x ?? 0,
    y_coord: y ?? 0,
    schema_version: 1,
    site_id: SITE_ID,
    business_type: '',
    path: location.pathname,
    referrer: document.referrer
  })
}

document.body.addEventListener('click', (e) => {
  const el = e.target.closest('[data-telemetry-type]')
  if (!el) return
  capture(el.dataset.telemetryType, el.dataset.telemetryTarget ?? '', e.clientX, e.clientY)
})

document.body.addEventListener('change', (e) => {
  const el = e.target.closest('[data-telemetry-type]')
  if (!el) return
  if (el.dataset.telemetryType === 'FORM_INPUT') {
    capture('FORM_INPUT', el.dataset.telemetryTarget ?? '', 0, 0)
  }
})

document.body.addEventListener('submit', (e) => {
  const el = e.target.closest('[data-telemetry-type]')
  if (!el) return
  capture(el.dataset.telemetryType, el.dataset.telemetryTarget ?? '', 0, 0)
})

function flush () {
  if (buffer.length === 0) return
  const events = buffer.splice(0)
  navigator.sendBeacon(ENDPOINT, JSON.stringify(events))
}

setInterval(flush, FLUSH_INTERVAL)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') flush()
})
