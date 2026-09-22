// ---------------------------------------------------------------------------
// The two production prompts. Both are forced through a tool schema so the
// model returns data the UI can render directly — no prose parsing.
// These are mirrored in prompt.md at the branch root for reuse.
// ---------------------------------------------------------------------------

// === STAGE 1 — Haiku · classify ============================================

export const CLASSIFY_PROMPT = `You are a customer-feedback analyst for Experience.com, an experience management platform used by loan officers, real estate agents, branch managers and team admins to collect reviews and survey responses from their own clients.

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
- If a response carries no identifiable theme, return an empty themes array.`

export const CLASSIFY_TOOL = {
  name: 'record_classifications',
  description: 'Record the sentiment and theme labels for every feedback response.',
  input_schema: {
    type: 'object',
    properties: {
      classifications: {
        type: 'array',
        description: 'One entry per input response, in the same order.',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'The response id exactly as given.' },
            sentiment: {
              type: 'string',
              enum: ['positive', 'neutral', 'negative'],
              description: 'Dominant sentiment of the response as a whole.',
            },
            themes: {
              type: 'array',
              description: 'Themes present in this response, with the sentiment each one carries.',
              items: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                    enum: [
                      'Support',
                      'Fast Service',
                      'Staff Friendliness',
                      'Pricing Confusion',
                      'Checkout Issues',
                      'Reporting',
                      'Review Campaigns',
                    ],
                  },
                  sentiment: { type: 'string', enum: ['positive', 'neutral', 'negative'] },
                },
                required: ['name', 'sentiment'],
              },
            },
          },
          required: ['id', 'sentiment', 'themes'],
        },
      },
    },
    required: ['classifications'],
  },
}

// === STAGE 2 — Sonnet · action plan + product issue + Jira ticket ==========

export const PLAN_PROMPT = `You are a senior product manager at Experience.com reviewing 30 days of customer feedback about the platform.

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

Ground every claim in the evidence you were given. Do not invent numbers.`

export const PLAN_TOOL = {
  name: 'record_action_plan',
  description: 'Record the insight, recommendations, action plan and detected product issue.',
  input_schema: {
    type: 'object',
    properties: {
      keyInsight: {
        type: 'string',
        description: 'Two to three sentences naming what customers value and what is costing them.',
      },
      recommendations: {
        type: 'array',
        description: 'Exactly three recommended actions, highest priority first.',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Short imperative title.' },
            detail: { type: 'string', description: 'One sentence of justification from the evidence.' },
            priority: { type: 'string', enum: ['High', 'Medium', 'Low'] },
          },
          required: ['title', 'detail', 'priority'],
        },
      },
      actionPlan: {
        type: 'array',
        description: 'Exactly five rows, best impact-to-effort trades first.',
        items: {
          type: 'object',
          properties: {
            action: { type: 'string' },
            priority: { type: 'string', enum: ['High', 'Medium', 'Low'] },
            impact: { type: 'string', enum: ['High', 'Medium', 'Low'] },
            effort: { type: 'string', enum: ['High', 'Medium', 'Low'] },
          },
          required: ['action', 'priority', 'impact', 'effort'],
        },
      },
      productIssue: {
        type: 'object',
        description: 'The strongest evidence-backed product defect signal.',
        properties: {
          theme: { type: 'string', description: 'Theme the issue sits under.' },
          evidenceCount: {
            type: 'integer',
            description: 'How many customers independently reported this.',
          },
          confidence: {
            type: 'integer',
            description: 'Genuine 0-100 confidence that engineering finds a real defect.',
          },
          summary: { type: 'string', description: 'One sentence stating the defect.' },
          jira: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              problem: {
                type: 'string',
                description: 'Problem statement citing how many customers reported it.',
              },
              acceptanceCriteria: {
                type: 'array',
                items: { type: 'string' },
                description: 'Three to five concrete criteria describing what fixed looks like.',
              },
              suggestedPriority: { type: 'string', enum: ['P1', 'P2', 'P3'] },
              labels: { type: 'array', items: { type: 'string' } },
            },
            required: ['title', 'problem', 'acceptanceCriteria', 'suggestedPriority', 'labels'],
          },
        },
        required: ['theme', 'evidenceCount', 'confidence', 'summary', 'jira'],
      },
    },
    required: ['keyInsight', 'recommendations', 'actionPlan', 'productIssue'],
  },
}
