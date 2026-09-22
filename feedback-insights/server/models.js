// ---------------------------------------------------------------------------
// Model routing — hackathon rule 2: "Don't reach for Opus by default. Match the
// model to the job."
//
//   Stage 1 · classify 60 verbatims  -> Haiku 4.5
//     Labelling and extraction against a fixed schema. High token volume, no
//     hard reasoning. The cheapest model that can do it is the correct model.
//
//   Stage 2 · action plan + Jira     -> Sonnet 5
//     One call. Weighing impact against effort, deciding what is actually a
//     product defect versus a one-off complaint, and authoring a ticket an
//     engineer can pick up — this is the only step where reasoning earns cost.
//
//   Opus                             -> deliberately not used.
//     Nothing here needs it. Using it would triple cost for no measurable gain.
// ---------------------------------------------------------------------------

export const CLASSIFY_MODEL = 'claude-haiku-4-5-20251001'
export const PLAN_MODEL = 'claude-sonnet-5'

// Published list prices (USD per 1M tokens). Used only to show the cost of the
// routing decision in the UI — including what the naive all-Opus run would cost.
export const PRICES = {
  'claude-haiku-4-5-20251001': { in: 1.0, out: 5.0 },
  'claude-sonnet-5': { in: 3.0, out: 15.0 },
  'claude-opus-5': { in: 15.0, out: 75.0 },
}

export const OPUS_MODEL = 'claude-opus-5'
