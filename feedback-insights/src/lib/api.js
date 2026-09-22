import { fallbackClassify, FALLBACK_PLAN } from './fallback.js'

async function post(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok) {
    const err = new Error(json.error || `Request failed (${res.status})`)
    err.code = json.code
    throw err
  }
  return json
}

export async function checkHealth() {
  try {
    const res = await fetch('/api/health')
    return await res.json()
  } catch {
    return { liveMode: false }
  }
}

/** Stage 1 — Haiku classifies every verbatim. Falls back to rules offline. */
export async function classify(responses) {
  try {
    return await post('/api/analyze', { responses })
  } catch (e) {
    return { ...fallbackClassify(responses), _fallbackReason: e.message }
  }
}

/** Stage 2 — Sonnet writes the plan and the ticket. Falls back to bundled. */
export async function actionPlan(analysis, evidence) {
  try {
    return await post('/api/action-plan', { analysis, evidence })
  } catch (e) {
    return { ...FALLBACK_PLAN, _fallbackReason: e.message }
  }
}
