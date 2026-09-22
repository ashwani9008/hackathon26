// ---------------------------------------------------------------------------
// Single place for everything tunable: brand theme tokens, the sentiment
// palette, model ids shown in the UI, and analysis thresholds.
// ---------------------------------------------------------------------------

/** Experience.com brand tokens, fed to antd's ConfigProvider. */
export const brand = {
  primary: '#5b4cdb',
  primaryDeep: '#4a3aa7',
  radius: 10,
  fontFamily:
    "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
}

/**
 * Sentiment palette — the dataviz skill's reserved *status* palette.
 *
 * Validated with scripts/validate_palette.js against a #ffffff surface:
 *   CVD separation      PASS  worst adjacent ΔE 11.3 (protan), 24.4 (tritan)
 *   Normal-vision floor PASS  worst adjacent ΔE 27.6
 *   Contrast            amber is sub-3:1 on white *by design* for status colors.
 *
 * The documented mitigation for that amber is icon + label: nowhere in this UI
 * does a sentiment colour carry meaning on its own. Every bar, arc and line
 * ships a visible written label beside it.
 */
export const sentimentColors = {
  positive: '#0ca30c',
  neutral: '#fab219',
  negative: '#d03b3b',
}

export const sentimentLabels = {
  positive: 'Positive',
  neutral: 'Neutral',
  negative: 'Negative',
}

/** Chart chrome, from the same reference palette. */
export const ink = {
  primary: '#0b0b0b',
  secondary: '#52514e',
  muted: '#898781',
  grid: '#e1e0d9',
  axis: '#c3c2b7',
  surface: '#ffffff',
  plane: '#f5f6f8',
}

/** Shown in the UI so the routing decision is visible, not just claimed. */
export const models = {
  classify: { id: 'claude-haiku-4-5-20251001', label: 'Haiku 4.5' },
  plan: { id: 'claude-sonnet-5', label: 'Sonnet 5' },
  opus: { id: 'claude-opus-5', label: 'Opus 5' },
}

export const thresholds = {
  /** Below this confidence the product issue is shown as a weak signal. */
  productIssueConfidence: 70,
  /** Themes under this share of feedback are folded out of the headline bars. */
  minThemeShare: 0.02,
}

export const account = {
  name: 'Ashwani',
  team: 'CORE UI Team',
  org: 'experience.com',
}
