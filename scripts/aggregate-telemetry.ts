/**
 * Telemetry aggregation script — run periodically via cron.
 * Rolls up raw sessions/events into summary tables, then generates daily summaries.
 *
 * Usage: npx tsx scripts/aggregate-telemetry.ts
 */
import { createPool } from '@valencets/db'
// env vars loaded via shell: source .env

const pool = createPool({
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME ?? 'enshrouded_config',
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? '',
  max: 2
})

async function run() {
  const now = new Date()
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dayEnd = new Date(dayStart.getTime() + 86_400_000)

  console.log('Aggregating telemetry for', dayStart.toISOString().split('T')[0])

  // 1. Session summaries
  await pool.sql.unsafe(`
    INSERT INTO session_summaries (period_start, period_end, total_sessions, unique_referrers, device_mobile, device_desktop, device_tablet)
    SELECT
      $1::timestamptz AS period_start,
      $2::timestamptz AS period_end,
      COUNT(*)::int AS total_sessions,
      COUNT(DISTINCT referrer)::int AS unique_referrers,
      COUNT(*) FILTER (WHERE device_type = 'mobile')::int AS device_mobile,
      COUNT(*) FILTER (WHERE device_type = 'desktop')::int AS device_desktop,
      COUNT(*) FILTER (WHERE device_type = 'tablet')::int AS device_tablet
    FROM sessions
    WHERE created_at >= $1 AND created_at < $2
    ON CONFLICT (period_start, period_end) DO UPDATE SET
      total_sessions = EXCLUDED.total_sessions,
      unique_referrers = EXCLUDED.unique_referrers,
      device_mobile = EXCLUDED.device_mobile,
      device_desktop = EXCLUDED.device_desktop,
      device_tablet = EXCLUDED.device_tablet
  `, [dayStart.toISOString(), dayEnd.toISOString()])
  console.log('  session_summaries updated')

  // 2. Event summaries
  await pool.sql.unsafe(`
    INSERT INTO event_summaries (period_start, period_end, event_category, total_count, unique_sessions)
    SELECT
      $1::timestamptz AS period_start,
      $2::timestamptz AS period_end,
      event_category,
      COUNT(*)::int AS total_count,
      COUNT(DISTINCT session_id)::int AS unique_sessions
    FROM events
    WHERE created_at >= $1 AND created_at < $2
    GROUP BY event_category
    ON CONFLICT (period_start, period_end, event_category) DO UPDATE SET
      total_count = EXCLUDED.total_count,
      unique_sessions = EXCLUDED.unique_sessions
  `, [dayStart.toISOString(), dayEnd.toISOString()])
  console.log('  event_summaries updated')

  // 3. Daily summary
  const sessionCount = await pool.sql.unsafe(
    `SELECT COALESCE(SUM(total_sessions), 0)::int AS c FROM session_summaries WHERE period_start >= $1 AND period_end <= $2`,
    [dayStart.toISOString(), dayEnd.toISOString()]
  )
  const pageviewCount = await pool.sql.unsafe(
    `SELECT COALESCE(SUM(total_count), 0)::int AS c FROM event_summaries WHERE period_start >= $1 AND period_end <= $2 AND event_category IN ('CLICK', 'VIEWPORT_INTERSECT')`,
    [dayStart.toISOString(), dayEnd.toISOString()]
  )
  const conversionCount = await pool.sql.unsafe(
    `SELECT COALESCE(SUM(total_count), 0)::int AS c FROM event_summaries WHERE period_start >= $1 AND period_end <= $2 AND event_category IN ('INTENT_LEAD', 'LEAD_FORM', 'LEAD_EMAIL', 'LEAD_PHONE')`,
    [dayStart.toISOString(), dayEnd.toISOString()]
  )

  const dateOnly = dayStart.toISOString().split('T')[0]
  await pool.sql.unsafe(`
    INSERT INTO daily_summaries (site_id, date, business_type, schema_version, session_count, pageview_count, conversion_count, top_referrers, top_pages, intent_counts, avg_flush_ms, rejection_count, synced_at)
    VALUES ($1, $2, 'webapp', 1, $3, $4, $5, '[]', '[]', '{}', 0, 0, NOW())
    ON CONFLICT (site_id, date) DO UPDATE SET
      session_count = EXCLUDED.session_count,
      pageview_count = EXCLUDED.pageview_count,
      conversion_count = EXCLUDED.conversion_count,
      synced_at = NOW()
  `, ['default', dateOnly, sessionCount[0].c, pageviewCount[0].c, conversionCount[0].c])
  console.log('  daily_summaries updated:', { sessions: sessionCount[0].c, pageviews: pageviewCount[0].c, conversions: conversionCount[0].c })

  process.exit(0)
  console.log('Done')
}

run().catch(err => { console.error(err); process.exit(1) })
