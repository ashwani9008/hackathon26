// ---------------------------------------------------------------------------
// Turning the model's per-response labels into the numbers the panel renders.
//
// This is deliberately plain arithmetic, not a model call. Counting is not a
// language task — asking an LLM to total up percentages is slower, costlier and
// less reliable than doing it here. The model labels; the code counts.
// ---------------------------------------------------------------------------

import { thresholds } from '../config.js'

const SENTIMENTS = ['positive', 'neutral', 'negative']

/**
 * @param {Array<{id,sentiment,themes:Array<{name,sentiment}>}>} classifications
 * @param {Array<{id,date,text,role,source,rating}>} responses
 */
export function aggregate(classifications, responses) {
  const byId = new Map(responses.map((r) => [r.id, r]))
  const rows = classifications.filter((c) => byId.has(c.id))
  const total = rows.length || 1

  // --- overall sentiment split -------------------------------------------
  const counts = { positive: 0, neutral: 0, negative: 0 }
  for (const c of rows) counts[c.sentiment] = (counts[c.sentiment] ?? 0) + 1

  const sentiment = {}
  for (const s of SENTIMENTS) sentiment[s] = Math.round((counts[s] / total) * 100)
  // Percentages must total 100 for the donut to read honestly.
  const drift = 100 - SENTIMENTS.reduce((a, s) => a + sentiment[s], 0)
  if (drift !== 0) {
    const biggest = SENTIMENTS.reduce((a, b) => (counts[a] >= counts[b] ? a : b))
    sentiment[biggest] += drift
  }

  // --- themes -------------------------------------------------------------
  const themeMap = new Map()
  for (const c of rows) {
    for (const t of c.themes ?? []) {
      if (!themeMap.has(t.name)) {
        themeMap.set(t.name, { name: t.name, count: 0, positive: 0, neutral: 0, negative: 0 })
      }
      const entry = themeMap.get(t.name)
      entry.count += 1
      entry[t.sentiment] += 1
    }
  }

  const themes = [...themeMap.values()]
    .map((t) => ({
      ...t,
      share: Math.round((t.count / total) * 100),
      // A theme's headline sentiment is whichever tone dominates its mentions.
      sentiment: SENTIMENTS.reduce((a, b) => (t[a] >= t[b] ? a : b)),
    }))
    .filter((t) => t.count / total >= thresholds.minThemeShare)
    .sort((a, b) => b.count - a.count)

  // --- trend --------------------------------------------------------------
  // A raw per-day share is meaningless at this volume: with two responses on a
  // given day the line can only read 0%, 50% or 100%, and the chart becomes a
  // sawtooth that shows sampling noise rather than any trend. So the series is
  // a trailing 7-day rolling share — the smallest window that carries signal at
  // this sample size.
  const days = new Map()
  for (const c of rows) {
    const date = byId.get(c.id).date
    if (!days.has(date)) days.set(date, { positive: 0, neutral: 0, negative: 0, total: 0 })
    const d = days.get(date)
    d[c.sentiment] += 1
    d.total += 1
  }

  const dates = [...days.keys()].sort()
  const trend = []
  if (dates.length) {
    // Walk every calendar day in the window, including days with no responses.
    const calendar = []
    for (let d = new Date(dates[0]); d <= new Date(dates[dates.length - 1]); d.setDate(d.getDate() + 1)) {
      calendar.push(d.toISOString().slice(0, 10))
    }

    const WINDOW = 7
    const MIN_SAMPLE = 5
    for (let i = 0; i < calendar.length; i++) {
      const acc = { positive: 0, neutral: 0, negative: 0, total: 0 }
      for (let back = 0; back < WINDOW; back++) {
        const day = days.get(calendar[i - back])
        if (!day) continue
        for (const s of SENTIMENTS) acc[s] += day[s]
        acc.total += day.total
      }
      // Suppress the window's warm-up: the first few days average over one or
      // two responses and would draw a dramatic-looking plunge that is purely
      // an artefact of sample size, not a change in customer sentiment.
      if (acc.total < MIN_SAMPLE) continue
      trend.push({
        date: calendar[i],
        positive: Math.round((acc.positive / acc.total) * 100),
        neutral: Math.round((acc.neutral / acc.total) * 100),
        negative: Math.round((acc.negative / acc.total) * 100),
        sample: acc.total,
      })
    }
  }

  // --- evidence for stage 2 ----------------------------------------------
  // Only negative verbatims from the negative themes go to Sonnet. Sending all
  // 60 would cost more and bury the signal we actually want it to reason about.
  const negativeThemes = themes.filter((t) => t.sentiment === 'negative').map((t) => t.name)
  const evidence = rows
    .filter((c) => (c.themes ?? []).some((t) => t.sentiment === 'negative'))
    .slice(0, 20)
    .map((c) => ({
      id: c.id,
      themes: c.themes.filter((t) => t.sentiment === 'negative').map((t) => t.name),
      text: byId.get(c.id).text,
      role: byId.get(c.id).role,
      source: byId.get(c.id).source,
    }))

  return {
    total: rows.length,
    counts,
    sentiment,
    themes,
    trend,
    negativeThemes,
    evidence,
    byId,
    classifications: rows,
  }
}
