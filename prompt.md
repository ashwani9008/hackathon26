# Prompts — Feedback Insights

Two prompts do the work. Both are **forced through a tool schema** rather than
asked for JSON in prose, so the model must return typed data the UI can render
directly. That single decision removes the whole class of "it returned markdown
this time" failures.

Copy either prompt as-is. They are not tied to this app — prompt 1 will label
any set of customer verbatims, prompt 2 will reason over any aggregate.

Live source: [`feedback-insights/server/prompts.js`](feedback-insights/server/prompts.js)

---

## Prompt 1 — Classify verbatims

**Model:** `claude-haiku-4-5-20251001`
**Why this model:** labelling against a fixed schema. High token volume, no hard
reasoning. The cheapest model that can do the job is the correct model.
**Runs:** once per batch — all 60 responses in a single call, not 60 calls.

### System prompt

```
You are a customer-feedback analyst for Experience.com, an experience management platform used by loan officers, real estate agents, branch managers and team admins to collect reviews and survey responses from their own clients.

The feedback you are given is about the Experience.com platform itself, left by those business customers through in-app NPS surveys, in-app surveys and support tickets.

Your job is labelling, not advice. For every response you receive:

1. Assign exactly one sentiment: "positive", "neutral" or "negative".
   - Judge the words, not the star rating. A 5-star review that says "support was excellent but checkout was confusing" is mixed: classify the dominant tone, and still record the negative theme.
   - "neutral" means genuinely mixed or factual, not mildly positive.
2. Assign one or more themes from this fixed list. Never invent a theme name:
   - "Support"            help quality, responsiveness of the support team
   - "Fast Service"       speed — response times, turnaround, how quickly things happen
   - "Staff Friendliness" tone and manner of people, being looked after
   - "Pricing Confusion"  plan comparison, tiers, invoices, proration, unclear cost
   - "Checkout Issues"    upgrade/payment flow — errors, failures, unclear steps
   - "Reporting"          dashboards, exports, analytics
   - "Review Campaigns"   review requests, survey sends, response rates, profile pages
3. For each theme you assign, record the sentiment that theme carries in that specific response. A response can praise Support and criticise Checkout Issues at the same time.

Rules:
- Every input id must appear exactly once in your output.
- Do not summarise, do not recommend, do not editorialise. Labels only.
- If a response carries no identifiable theme, return an empty themes array.
```

### User message

A JSON array of `{ id, rating, text }`. Nothing else — no instructions repeated
in the turn.

### Tool schema (forced via `tool_choice`)

```json
{
  "name": "record_classifications",
  "input_schema": {
    "type": "object",
    "properties": {
      "classifications": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "id": { "type": "string" },
            "sentiment": { "type": "string", "enum": ["positive", "neutral", "negative"] },
            "themes": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "name": { "type": "string", "enum": ["Support", "Fast Service", "Staff Friendliness", "Pricing Confusion", "Checkout Issues", "Reporting", "Review Campaigns"] },
                  "sentiment": { "type": "string", "enum": ["positive", "neutral", "negative"] }
                },
                "required": ["name", "sentiment"]
              }
            }
          },
          "required": ["id", "sentiment", "themes"]
        }
      }
    },
    "required": ["classifications"]
  }
}
```

### Why it is written this way

- **The theme list is an `enum`, not a suggestion.** Free-form theme extraction
  produces "Pricing", "pricing confusion" and "Cost concerns" across three runs
  and nothing is comparable week to week. The enum makes runs diffable.
- **"Judge the words, not the star rating."** Without this, the model anchors on
  the rating and a 5-star review that buries a checkout complaint gets scored
  clean — exactly the signal you most want to catch.
- **Per-theme sentiment, not just per-response.** One response praising support
  and damning checkout must contribute to both columns correctly.
- **"Labels only."** Told to be helpful, a model will volunteer advice on every
  row. That triples output tokens and the advice is worse than what stage 2
  produces with the full picture in front of it.

---

## Prompt 2 — Action plan, product-issue detection, Jira ticket

**Model:** `claude-sonnet-5`
**Why this model:** weighing impact against effort, deciding whether scattered
complaints are one real defect, and authoring a ticket an engineer can act on.
The only step where reasoning earns its cost.
**Runs:** once, on the aggregate — not on the raw dataset.

### System prompt

```
You are a senior product manager at Experience.com reviewing 30 days of customer feedback about the platform.

You receive: aggregate counts per theme with their sentiment split, and a set of verbatim quotes as evidence. You do not receive the raw dataset — reason only from what you are given.

Produce four things.

1. KEY INSIGHT — two or three sentences a VP can read in ten seconds. Name what customers value and what is costing them. Be concrete: reference the themes and the numbers you were given. No filler, no "customers have shared valuable feedback".

2. RECOMMENDED ACTIONS — three of them, ordered by priority. Each is a short imperative title plus one sentence of justification grounded in the evidence. Priority is "High", "Medium" or "Low".

3. ACTION PLAN — five rows. Each has an action, a priority, an expected impact and an effort estimate. Impact and effort are "High", "Medium" or "Low". Be honest about effort: a copy change is Low, a checkout flow rebuild is High. Order the plan so the best impact-to-effort trades come first.

4. PRODUCT ISSUE — the single strongest signal that this is a real product defect rather than scattered dissatisfaction. Judge it properly:
   - Only report an issue where multiple customers independently describe the same failure.
   - confidence is your genuine assessment (0-100) that engineering will find a real defect. Volume of complaints, consistency of description and specificity all raise it. Two vague grumbles do not make a 90.
   - Write a Jira ticket an engineer can pick up without asking questions: a specific title, a problem statement citing how many customers reported it, and 3-5 concrete acceptance criteria that state what "fixed" looks like.
   - suggestedPriority uses Jira conventions: P1 is revenue-blocking or broken for many, P2 is significant, P3 is minor.

Ground every claim in the evidence you were given. Do not invent numbers.
```

### User message

```json
{
  "analysis": {
    "totalResponses": 60,
    "sentimentSplit": { "positive": 68, "neutral": 12, "negative": 20 },
    "themes": [
      { "name": "Support", "count": 25, "share": 42, "positive": 24, "neutral": 1, "negative": 0 },
      { "name": "Checkout Issues", "count": 9, "share": 15, "positive": 0, "neutral": 0, "negative": 9 }
    ]
  },
  "evidence": [
    { "id": "FB-1077", "themes": ["Checkout Issues"], "text": "Checkout is broken on Safari...", "role": "Team Admin", "source": "Support ticket" }
  ]
}
```

### Tool schema (forced via `tool_choice`)

`record_action_plan` — requires `keyInsight`, `recommendations[3]`,
`actionPlan[5]`, and a `productIssue` carrying `theme`, `evidenceCount`,
`confidence`, `summary` and a nested `jira` object with `title`, `problem`,
`acceptanceCriteria[]`, `suggestedPriority` and `labels[]`. Full definition in
[`server/prompts.js`](feedback-insights/server/prompts.js).

### Why it is written this way

- **It never sees the raw dataset.** It gets counts plus ~20 negative verbatims.
  Sending all 60 would cost more and bury the signal — and the counts are already
  exact, because code did the counting.
- **"Two vague grumbles do not make a 90."** Ask a model for a confidence score
  and you get 85–95 every time. Naming the failure mode in the prompt is what
  makes the number mean something.
- **"Only report an issue where multiple customers independently describe the
  same failure."** This is the line between a defect detector and a complaint
  amplifier. One angry customer is not a bug.
- **Acceptance criteria are demanded up front.** "A ticket an engineer can pick
  up without asking questions" is the bar; without it you get a restated
  complaint with a Jira-shaped border around it.
- **Effort estimates are explicitly calibrated** ("a copy change is Low, a
  checkout flow rebuild is High"). Otherwise everything comes back Medium.

---

## The prompt that is not there

There is no prompt for counting, percentages, or the trend series. That is done
in [`src/lib/aggregate.js`](feedback-insights/src/lib/aggregate.js) with plain
arithmetic.

Asking an LLM to total up percentages is slower, more expensive and less
reliable than ten lines of JavaScript. **The model labels; the code counts.**
Deciding what *not* to send to a model is part of using the right model.

---

## How I drove Claude Code

The prompts above are the product. These are the working habits that produced
it, in case they are the more reusable half:

1. **Front-load the constraints that are expensive to discover late.** The
   deadline, the scoring rules and the model-routing requirement went in at the
   start, so every later decision was made against them rather than retrofitted.
2. **Ask before building when the answer changes the build.** Scope, API key
   strategy and which numbers go on the card were settled by asking, not
   assuming. Three questions cost two minutes and saved rework.
3. **Verify against the real target, not the brief's description of it.** Reading
   the actual scorer (`main.py`) showed it fetches `README.md` from the *branch
   root*. Several branches will be scored as somebody else's submission because
   nobody checked. The brief did not say this; the code did.
4. **Make the fallback path first-class.** Live demos fail. The panel degrades to
   a rule-based classifier rather than an error screen, and says so honestly on
   screen.
5. **Run the tools that check your work.** The sentiment palette went through a
   colour validator instead of being eyeballed; it failed on the first choice and
   the failure was worth knowing.
