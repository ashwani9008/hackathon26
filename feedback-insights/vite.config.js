import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

import { CLASSIFY_TOOL, CLASSIFY_PROMPT, PLAN_TOOL, PLAN_PROMPT } from './server/prompts.js'
import { CLASSIFY_MODEL, PLAN_MODEL, PRICES } from './server/models.js'

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'

function loadEnv() {
  // Read .env without a dependency — Vite's own loadEnv only exposes VITE_*,
  // and the API key must stay server-side.
  const file = path.resolve(process.cwd(), '.env')
  if (!fs.existsSync(file)) return
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

async function callClaude({ model, system, user, tool, maxTokens }) {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) {
    const err = new Error('ANTHROPIC_API_KEY not set')
    err.code = 'NO_KEY'
    throw err
  }

  const started = Date.now()
  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: user }],
      tools: [tool],
      // Force the model through the schema so React renders the result directly
      // instead of parsing prose and hoping.
      tool_choice: { type: 'tool', name: tool.name },
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    const err = new Error(`Anthropic ${res.status}: ${body.slice(0, 300)}`)
    err.code = 'API_ERROR'
    throw err
  }

  const json = await res.json()
  const block = json.content?.find((c) => c.type === 'tool_use')
  if (!block) {
    const err = new Error('Model returned no tool_use block')
    err.code = 'API_ERROR'
    throw err
  }

  const meta = {
    model,
    ms: Date.now() - started,
    inputTokens: json.usage?.input_tokens ?? 0,
    outputTokens: json.usage?.output_tokens ?? 0,
  }
  const p = PRICES[model] ?? { in: 0, out: 0 }
  meta.costUsd = (meta.inputTokens / 1e6) * p.in + (meta.outputTokens / 1e6) * p.out

  return { data: block.input, meta }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (c) => (raw += c))
    req.on('end', () => {
      try {
        resolve(JSON.parse(raw || '{}'))
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', reject)
  })
}

function send(res, status, payload) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json')
  res.end(JSON.stringify(payload))
}

function apiPlugin() {
  return {
    name: 'feedback-insights-api',
    configureServer(server) {
      loadEnv()

      server.middlewares.use('/api/health', (req, res) => {
        send(res, 200, {
          liveMode: Boolean(process.env.ANTHROPIC_API_KEY),
          classifyModel: CLASSIFY_MODEL,
          planModel: PLAN_MODEL,
        })
      })

      // Stage 1 — Haiku. Per-verbatim sentiment + theme tagging, batched.
      server.middlewares.use('/api/analyze', async (req, res, next) => {
        if (req.method !== 'POST') return next()
        try {
          const { responses } = await readBody(req)
          const compact = responses.map((r) => ({ id: r.id, rating: r.rating, text: r.text }))
          const { data, meta } = await callClaude({
            model: CLASSIFY_MODEL,
            system: CLASSIFY_PROMPT,
            user: JSON.stringify(compact),
            tool: CLASSIFY_TOOL,
            maxTokens: 8000,
          })
          send(res, 200, { ...data, _meta: meta })
        } catch (e) {
          send(res, e.code === 'NO_KEY' ? 503 : 500, { error: e.message, code: e.code || 'ERROR' })
        }
      })

      // Stage 2 — Sonnet. Action plan, product-issue detection, Jira ticket.
      server.middlewares.use('/api/action-plan', async (req, res, next) => {
        if (req.method !== 'POST') return next()
        try {
          const { analysis, evidence } = await readBody(req)
          const { data, meta } = await callClaude({
            model: PLAN_MODEL,
            system: PLAN_PROMPT,
            user: JSON.stringify({ analysis, evidence }),
            tool: PLAN_TOOL,
            maxTokens: 4000,
          })
          send(res, 200, { ...data, _meta: meta })
        } catch (e) {
          send(res, e.code === 'NO_KEY' ? 503 : 500, { error: e.message, code: e.code || 'ERROR' })
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), apiPlugin()],
  server: { port: 5180 },
})
