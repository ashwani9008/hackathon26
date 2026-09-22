# Feedback Insights — AI Feedback-to-Action Assistant

## Files in this branch
- `README.md` (this file — output card)
- `prompt.md` — the exact production prompts, structured for reuse
- `ai-chat-export.json` ← required
- `ai-chat-export.txt` — same export, plain text
- `demo/` — screenshots of the flow end to end
- `feedback-insights/` — the application (React + Vite + Ant Design)

---

**Name + Role:** Ashwani — Senior Software Engineer, CORE UI

**Problem I solved:** Experience.com collects a large and growing volume of customer feedback — NPS scores, in-app surveys, support tickets — but somebody still has to read all of it by hand, work out which complaints are the same complaint, and decide what engineering should actually fix. Collecting feedback stopped being the hard part a long time ago; turning it into an action a team can pick up is still manual.

**What I built:** An AI "Feedback Insights" panel for the Experience.com dashboard that reads raw customer feedback and produces sentiment, ranked themes, a prioritised action plan, and — the step that matters — a detected product defect with evidence, a confidence score, and a ready-to-file Jira ticket. It uses a two-stage model router: Haiku labels every verbatim, Sonnet reasons over the aggregate. The panel runs on any feedback you paste in, not just the sample.

**Tool used:** Claude Code

**Time without AI:** 45–60 minutes to manually read a 60-response feedback set, group it into themes, judge sentiment, and write up an action summary — per cycle, repeated weekly. Authoring the Jira ticket from that summary is another 15–20 minutes.

**Time with AI today:** ~3 hours to design and build the whole panel. Each analysis run then takes **under 30 seconds** end to end.

**Will I use this next week?** YES — the analysis step is already faster and more consistent than reading feedback by hand, and the Jira ticket it produces is good enough to file with light editing rather than write from scratch.

**Where it lives:** Branch `ashwani-dohray/feedback-insights` on `Experience-org/hackathon-aug26`

---

## Impact, quantified

The arithmetic is deliberately conservative and based on one person doing one weekly review of one 60-response set:

| | Manual | With the panel |
|---|---|---|
| Read and label 60 verbatims | ~30 min | ~15 sec (Haiku, one batched call) |
| Group into themes, judge sentiment | ~15 min | instant (counted in code, not by a model) |
| Write action summary | ~10 min | ~10 sec (Sonnet) |
| Author a Jira ticket from it | ~15 min | included |
| **Total** | **~70 min** | **under 5 min including review** |

- **~65 minutes saved per review cycle.** Weekly, that is ~56 hours a year for one person.
- **Consistency:** the same schema every run. Two people hand-labelling the same 60 comments do not produce the same themes; a forced tool schema does.
- **Cost per run: fractions of a cent.** The routing panel in the UI shows the actual figure against what the same run would have cost on Opus — typically an **~80% saving** for no loss in output quality, because only one of the two stages needs reasoning.
- The saving scales with volume. The manual column grows linearly with feedback count; the AI column barely moves.

## Rule 2 — using the right model

Model choice is a design decision here, not a default, and the UI shows it rather than claiming it.

| Stage | Model | Why |
|---|---|---|
| Classify 60 verbatims — sentiment + themes | **Haiku 4.5** | Labelling against a fixed schema. High token volume, no hard reasoning. The cheapest model that can do the job is the correct model. |
| Action plan, product-issue detection, Jira ticket | **Sonnet 5** | Weighing impact against effort, deciding whether scattered complaints are one real defect, and authoring a ticket an engineer can act on. This is the only step where reasoning earns its cost. |
| Counting, percentages, trend series | **No model at all** | Arithmetic is not a language task. Asking an LLM to total percentages is slower, costlier and less reliable than ten lines of JavaScript. The model labels; the code counts. |
| Anywhere | **Opus — deliberately not used** | Nothing here needs it. It would have roughly tripled cost for no measurable gain. |

Both model calls are forced through a **tool schema** (`tool_choice`), so the model returns typed JSON the UI renders directly. No prose parsing, no "sometimes it returns markdown" failure mode.

## Product knowledge — why this is an Experience.com tool

The panel sits inside Experience.com's own loop rather than beside it. The platform already captures the voice of the customer; this is the missing step between that voice and an engineering action.

- The sample dataset is feedback about **the Experience.com platform**, left by the people who actually use it — loan officers, real estate agents, branch managers, team admins — through the channels the product really has: in-app NPS, in-app surveys, support tickets.
- The theme taxonomy is fixed to things that exist in this product: Support, Fast Service, Staff Friendliness, Pricing Confusion, Checkout Issues, Reporting, Review Campaigns. The model cannot invent a theme, so themes stay comparable between runs.
- It is designed as a **CORE UI dashboard panel** — the sidebar, the Insights nav entry, the layout — so it reads as a feature of the product, not a standalone widget.
- The defect it surfaces on the sample data is a subscription/checkout problem, which is squarely CORE UI territory.

## Working demo

Runs locally, end to end, in a browser. Screenshots of the full flow are in `demo/`.

```bash
cd feedback-insights
npm install
cp .env.example .env        # add your ANTHROPIC_API_KEY
npm run dev                 # http://localhost:5180
```

Then: **Analyze feedback** → **Generate action plan** → **Review Jira ticket**.

**Honesty about what is real:** the analysis, classification, aggregation, action plan and Jira ticket body are all really produced by the pipeline. The final *"Create ticket in XMP"* click is a stand-in — it produces the ticket and a key, but does not POST to a live Jira, because wiring a Jira sandbox was not something to spend hackathon hours on. Everything up to that point is real.

**It also runs without a key.** If `ANTHROPIC_API_KEY` is missing or the API call fails, the panel degrades to a rule-based classifier and a bundled action plan rather than showing an error — clearly labelled as fallback in the UI. Conference wifi should not be able to kill a live demo.

## How it is built

```
feedback-insights/
  vite.config.js          API proxy — keeps the key server-side, no second process
  server/models.js        model routing + list prices
  server/prompts.js       the two production prompts and their tool schemas
  src/
    config.js             brand tokens, validated palette, thresholds
    lib/aggregate.js      labels -> percentages, themes, trend (plain arithmetic)
    lib/fallback.js       offline path
    components/           dashboard, charts, rail, action plan, Jira card
```

React 18 + Vite + Ant Design, themed through a single `ConfigProvider` token set. The charts are hand-written SVG with no charting dependency — nothing to install on stage and nothing to break.

The sentiment palette is not eyeballed. It is the reserved status palette, and it was run through a colour validator against the actual white surface: CVD separation passes at ΔE 11.3 (protan) and 24.4 (tritan), normal-vision separation at 27.6. Amber sits below 3:1 contrast on white by design, so the documented mitigation is applied throughout — **no sentiment colour anywhere in this UI carries meaning on its own**; every bar, arc and line ships a visible written label beside it.
