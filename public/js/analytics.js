const content = document.getElementById('content')

// Check admin
const meRes = await fetch('/api/users/me')
if (!meRes.ok) { window.location.href = '/login'; throw new Error('Not authenticated') }
const user = await meRes.json()
if (user.role !== 'admin') { content.textContent = 'Admin access required.'; throw new Error('Not admin') }

const res = await fetch('/api/admin/analytics')
if (!res.ok) { content.textContent = 'Failed to load analytics.'; throw new Error('API error') }
const data = await res.json()

const o = data.overview
const f = data.funnel

function pct (a, b) { return b > 0 ? Math.round(a / b * 100) + '%' : '—' }

function maxOf (arr, key) { return Math.max(...arr.map(r => r[key] || r.count || 0), 1) }

content.innerHTML = ''

// KPIs
const kpiGrid = document.createElement('div')
kpiGrid.className = 'kpi-grid'
const kpis = [
  { value: o.weekSessions, label: 'Sessions (7d)' },
  { value: o.totalUsers, label: 'Users' },
  { value: o.totalConfigs, label: 'Total Configs' },
  { value: o.sharedConfigs, label: 'Shared Configs' },
]
for (const k of kpis) {
  const div = document.createElement('div')
  div.className = 'kpi'
  const v = document.createElement('div')
  v.className = 'kpi-value'
  v.textContent = k.value
  const l = document.createElement('div')
  l.className = 'kpi-label'
  l.textContent = k.label
  div.appendChild(v)
  div.appendChild(l)
  kpiGrid.appendChild(div)
}
content.appendChild(kpiGrid)

// Funnel
const funnelSection = document.createElement('div')
funnelSection.className = 'section'
const funnelTitle = document.createElement('h2')
funnelTitle.textContent = 'Conversion Funnel'
funnelSection.appendChild(funnelTitle)
const funnelDiv = document.createElement('div')
funnelDiv.className = 'funnel'
const steps = [
  { value: f.home_engaged, label: 'Home Engaged' },
  { value: f.browsed_configs, label: 'Browsed Configs', prev: f.home_engaged },
  { value: f.attempted_auth, label: 'Auth Attempt', prev: f.browsed_configs },
  { value: f.saved_config, label: 'Saved Config', prev: f.attempted_auth },
  { value: f.exported, label: 'Exported JSON', prev: f.saved_config },
]
for (const s of steps) {
  const step = document.createElement('div')
  step.className = 'funnel-step'
  const v = document.createElement('div')
  v.className = 'funnel-value'
  v.textContent = s.value ?? 0
  const l = document.createElement('div')
  l.className = 'funnel-label'
  l.textContent = s.label
  step.appendChild(v)
  step.appendChild(l)
  if (s.prev !== undefined && s.prev > 0) {
    const p = document.createElement('div')
    p.className = 'funnel-pct'
    p.textContent = pct(s.value, s.prev) + ' of prev'
    step.appendChild(p)
  }
  funnelDiv.appendChild(step)
}
funnelSection.appendChild(funnelDiv)
content.appendChild(funnelSection)

// Two column layout: referrers + actions
const twocol = document.createElement('div')
twocol.className = 'two-col'

// Referrers
const refSection = document.createElement('div')
refSection.className = 'section'
const refTitle = document.createElement('h2')
refTitle.textContent = 'Traffic Sources'
refSection.appendChild(refTitle)
const refTable = document.createElement('table')
refTable.className = 'data-table'
const refHead = document.createElement('thead')
refHead.innerHTML = '<tr><th>Source</th><th class="count">Sessions</th></tr>'
refTable.appendChild(refHead)
const refBody = document.createElement('tbody')
const refMax = maxOf(data.referrers, 'count')
for (const r of data.referrers) {
  const tr = document.createElement('tr')
  const src = document.createElement('td')
  const barW = Math.round(r.count / refMax * 60)
  const bar = document.createElement('span')
  bar.className = 'bar'
  bar.style.width = barW + 'px'
  src.appendChild(bar)
  const label = r.source.replace('https://', '').replace('http://', '')
  src.appendChild(document.createTextNode(label.length > 40 ? label.slice(0, 40) + '...' : label))
  const ct = document.createElement('td')
  ct.className = 'count'
  ct.textContent = r.count
  tr.appendChild(src)
  tr.appendChild(ct)
  refBody.appendChild(tr)
}
refTable.appendChild(refBody)
refSection.appendChild(refTable)
twocol.appendChild(refSection)

// Top actions
const actSection = document.createElement('div')
actSection.className = 'section'
const actTitle = document.createElement('h2')
actTitle.textContent = 'Top Actions'
actSection.appendChild(actTitle)
const actTable = document.createElement('table')
actTable.className = 'data-table'
const actHead = document.createElement('thead')
actHead.innerHTML = '<tr><th>Action</th><th class="count">Count</th></tr>'
actTable.appendChild(actHead)
const actBody = document.createElement('tbody')
const actMax = maxOf(data.actions, 'count')
for (const a of data.actions) {
  const tr = document.createElement('tr')
  const td1 = document.createElement('td')
  const barW = Math.round(a.count / actMax * 60)
  const bar = document.createElement('span')
  bar.className = 'bar'
  bar.style.width = barW + 'px'
  td1.appendChild(bar)
  td1.appendChild(document.createTextNode(a.action))
  const td2 = document.createElement('td')
  td2.className = 'count'
  td2.textContent = a.count
  tr.appendChild(td1)
  tr.appendChild(td2)
  actBody.appendChild(tr)
}
actTable.appendChild(actBody)
actSection.appendChild(actTable)
twocol.appendChild(actSection)
content.appendChild(twocol)

// Hourly chart
if (data.hourly.length > 0) {
  const chartSection = document.createElement('div')
  chartSection.className = 'section'
  const chartTitle = document.createElement('h2')
  chartTitle.textContent = 'Activity (Last 24h)'
  chartSection.appendChild(chartTitle)
  const chart = document.createElement('div')
  chart.className = 'chart'
  const hMax = maxOf(data.hourly, 'count')
  for (const h of data.hourly) {
    const bar = document.createElement('div')
    bar.className = 'chart-bar'
    const height = Math.max(2, Math.round(h.count / hMax * 80))
    bar.style.height = height + 'px'
    const hour = new Date(h.hour).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    bar.dataset.label = hour + ': ' + h.count + ' events'
    bar.title = hour + ': ' + h.count
    chart.appendChild(bar)
  }
  chartSection.appendChild(chart)
  content.appendChild(chartSection)
}

// Recent configs
if (data.recentConfigs.length > 0) {
  const rcSection = document.createElement('div')
  rcSection.className = 'section'
  const rcTitle = document.createElement('h2')
  rcTitle.textContent = 'Recent Configs'
  rcSection.appendChild(rcTitle)
  const list = document.createElement('ul')
  list.className = 'recent-list'
  for (const c of data.recentConfigs) {
    const li = document.createElement('li')
    const name = document.createElement('span')
    name.textContent = c.name || 'Untitled'
    const meta = document.createElement('span')
    const badge = document.createElement('span')
    badge.className = 'badge'
    badge.textContent = c.gameSettingsPreset || 'Default'
    const shared = document.createElement('span')
    shared.className = 'badge'
    shared.textContent = c.shared ? 'Shared' : 'Private'
    shared.style.color = c.shared ? '#4ade80' : 'var(--val-color-text-muted)'
    const date = document.createElement('span')
    date.style.color = 'var(--val-color-text-muted)'
    date.style.fontSize = 'var(--val-text-xs)'
    date.textContent = ' ' + new Date(c.created_at).toLocaleString()
    meta.appendChild(badge)
    meta.appendChild(document.createTextNode(' '))
    meta.appendChild(shared)
    meta.appendChild(date)
    li.appendChild(name)
    li.appendChild(meta)
    list.appendChild(li)
  }
  rcSection.appendChild(list)
  content.appendChild(rcSection)
}
