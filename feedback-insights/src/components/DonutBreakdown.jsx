import { sentimentColors, sentimentLabels } from '../config.js'

const SERIES = ['positive', 'neutral', 'negative']
const SIZE = 160
const R = 62
const STROKE = 22

/**
 * Sentiment split for one theme. Every arc is labeled in the list beside it,
 * with its own percentage — the ring is the shape, the list is the reading.
 * A 2px surface gap separates adjacent arcs.
 */
export default function DonutBreakdown({ counts, title }) {
  const total = SERIES.reduce((a, s) => a + (counts[s] ?? 0), 0) || 1
  const circumference = 2 * Math.PI * R

  let offset = 0
  const arcs = SERIES.map((s) => {
    const share = (counts[s] ?? 0) / total
    const arc = {
      key: s,
      share,
      pct: Math.round(share * 100),
      dash: Math.max(0, share * circumference - 2), // 2px surface gap
      offset,
    }
    offset += share * circumference
    return arc
  })

  return (
    <div className="donut-wrap">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="donut" role="img" aria-label={title || 'Sentiment breakdown'}>
        <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
          {arcs.map((a) =>
            a.share > 0 ? (
              <circle
                key={a.key}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={R}
                fill="none"
                stroke={sentimentColors[a.key]}
                strokeWidth={STROKE}
                strokeDasharray={`${a.dash} ${circumference - a.dash}`}
                strokeDashoffset={-a.offset}
              />
            ) : null,
          )}
        </g>
        <text x={SIZE / 2} y={SIZE / 2 - 2} textAnchor="middle" className="donut-value">
          {total}
        </text>
        <text x={SIZE / 2} y={SIZE / 2 + 16} textAnchor="middle" className="donut-caption">
          responses
        </text>
      </svg>

      <ul className="donut-legend">
        {arcs.map((a) => (
          <li key={a.key}>
            <i style={{ background: sentimentColors[a.key] }} aria-hidden="true" />
            <span className="donut-legend-label">{sentimentLabels[a.key]}</span>
            <span className="donut-legend-value">{a.pct}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
