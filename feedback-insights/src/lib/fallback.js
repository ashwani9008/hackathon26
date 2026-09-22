// ---------------------------------------------------------------------------
// Offline fallback.
//
// Live demos fail on conference wifi. If the API key is missing or the call
// errors, the panel degrades to this instead of showing an error card — the
// same pipeline, the same shapes, a rule-based classifier standing in for the
// model. The UI labels it clearly as fallback so nobody mistakes it for AI
// output.
// ---------------------------------------------------------------------------

const THEME_RULES = [
  { name: 'Checkout Issues', tone: 'negative', re: /checkout|payment failed|card |cart|pay\b|upgrade (?:flow|checkout)|tax|prorat|billing date|annual commitment|monthly or annual/i },
  { name: 'Pricing Confusion', tone: 'negative', re: /pricing|plan|tier|invoice|quoted|per-seat|bundle|cost|what i'm paying|premier|pro versus/i },
  { name: 'Support', tone: 'positive', re: /support|ticket|help|resolved|sorted|onboarding call|account manager|rep\b/i },
  { name: 'Fast Service', tone: 'positive', re: /fast|quick|same-day|within the hour|response time|turnaround|responsive|minutes/i },
  { name: 'Staff Friendliness', tone: 'positive', re: /friendly|lovely|patient|kind|helpful people|staff|team is/i },
  { name: 'Reporting', tone: 'positive', re: /report|dashboard|export|analytics/i },
  { name: 'Review Campaigns', tone: 'positive', re: /review request|survey|profile page|review volume|review count|response rate|listing/i },
]

function classifyOne(r) {
  const themes = []
  for (const rule of THEME_RULES) {
    if (!rule.re.test(r.text)) continue
    // A theme's tone follows the rule's default, flipped when the response is
    // clearly unhappy about it.
    const negativeContext = r.rating <= 2 || /confus|not clear|error|fail|broken|didn't understand|couldn't|gave up|surprised|don't understand|doesn't|didn't match|needs a proper/i.test(r.text)
    const tone = rule.tone === 'negative' ? 'negative' : negativeContext && themes.length === 0 ? 'neutral' : 'positive'
    themes.push({ name: rule.name, sentiment: rule.tone === 'negative' ? 'negative' : tone })
  }

  const sentiment = r.rating >= 4 ? 'positive' : r.rating === 3 ? 'neutral' : 'negative'
  return { id: r.id, sentiment, themes }
}

export function fallbackClassify(responses) {
  return {
    classifications: responses.map(classifyOne),
    _meta: { fallback: true, model: 'rule-based fallback', ms: 0, costUsd: 0, inputTokens: 0, outputTokens: 0 },
  }
}

export const FALLBACK_PLAN = {
  keyInsight:
    'Customers are strongly positive about support, speed and the people they deal with — those three themes carry almost all of the positive sentiment. Nearly all the negative sentiment is concentrated in two adjacent areas: understanding what a plan costs, and completing the upgrade once they have decided. Customers are not leaving because of the product; they are getting stuck on the way to paying for more of it.',
  recommendations: [
    {
      title: 'Simplify the pricing explanation',
      detail:
        'Multiple customers independently said they could not tell what a plan included or what they would actually be charged, and several needed a support ticket to find out.',
      priority: 'High',
    },
    {
      title: 'Fix and clarify the upgrade checkout',
      detail:
        'Reports include payment failures with generic errors, a cart that clears on retry, and a browser-specific input failure — customers abandoned self-serve and called instead.',
      priority: 'High',
    },
    {
      title: 'Lead with the support experience in marketing',
      detail:
        'Support, speed and staff friendliness dominate the positive feedback and are a genuine differentiator worth surfacing.',
      priority: 'Medium',
    },
  ],
  actionPlan: [
    { action: 'Show the full price including tax before checkout starts', priority: 'High', impact: 'High', effort: 'Low' },
    { action: 'Add a plan comparison table to the pricing page', priority: 'High', impact: 'High', effort: 'Medium' },
    { action: 'Replace generic checkout errors with specific, actionable messages', priority: 'High', impact: 'High', effort: 'Medium' },
    { action: 'Preserve cart selection when a payment retry occurs', priority: 'Medium', impact: 'Medium', effort: 'Low' },
    { action: 'Explain proration and billing-date changes at the point of upgrade', priority: 'Medium', impact: 'Medium', effort: 'Low' },
  ],
  productIssue: {
    theme: 'Checkout Issues',
    evidenceCount: 9,
    confidence: 88,
    summary:
      'The self-serve upgrade checkout fails for a meaningful share of customers, and the failures are described consistently enough to be one or more real defects rather than user error.',
    jira: {
      title: 'Upgrade checkout fails with generic errors and loses cart state on retry',
      problem:
        'Nine customers independently reported failures completing the self-serve upgrade checkout within a 30-day window. Reported symptoms cluster into three: payment declined with a non-specific error message, cart selection cleared when the payment was retried, and the card entry field rejecting all input on Safari. Several customers abandoned self-serve entirely and completed the upgrade by phone, so the revenue arrived but the flow did not work.',
      acceptanceCriteria: [
        'A failed payment returns a specific reason to the customer (declined, expired card, address mismatch) rather than a generic error.',
        'Retrying a failed payment preserves the previously selected plan and seat count.',
        'Card entry accepts input on Safari, verified on the two most recent Safari versions on macOS and iOS.',
        'The total including tax is displayed before the customer enters payment details.',
        'Checkout failure rate is instrumented and visible in the billing dashboard.',
      ],
      suggestedPriority: 'P1',
      labels: ['checkout', 'billing', 'revenue-blocking', 'customer-reported'],
    },
  },
  _meta: { fallback: true, model: 'bundled fallback', ms: 0, costUsd: 0, inputTokens: 0, outputTokens: 0 },
}
