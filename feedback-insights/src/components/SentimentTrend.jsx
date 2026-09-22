import { useState } from 'react'
import { sentimentColors, sentimentLabels, ink } from '../config.js'

const SERIES = ['positive', 'neutral', 'negative']

const W = 720
const H = 240
const PAD = { top: 16, right: 52, bottom: 28, left: 34 }

function fmtDay(iso) {
  const [, m, d] = iso.split('-')
  return `${['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][Number(m)]} ${Number(d)}`
}

/**
 * Sentiment share over time. One y-axis (percent) — never a second scale.
 * Three series, so: legend always present, and each line is also direct-labeled
 * at its right end. Identity never rests on colour alone.
 */
export default function SentimentTrend({ trend }) {
  const [hover, setHover] = useState(null)

  if (!trend?.length) return null

  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom
  const x = (i) => PAD.left + (trend.length === 1 ? plotW / 2 : (i / (trend.length - 1)) * plotW)
  const y = (v) => PAD.top + plotH - (v / 100) * plotH

  const path = (key) =>
    trend.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d[key]).toFixed(1)}`).join(' ')

  // Tick every ~7 days, always including the last day — but drop the regular
  // tick if it would sit on top of the final one.
  const last = trend.length - 1
  const tickIdx = trend
    .map((_, i) => i)
    .filter((i) => i % 7 === 0 || i === last)
    .filter((i, _, all) => i === last || last - i > 3 || !all.includes(last))

  // Direct end labels collide whenever two series finish on the same value, so
  // lay them out in order with a minimum gap rather than letting them stack.
  const endLabels = SERIES.map((s) => ({ key: s, value: trend[last][s], y: y(trend[last][s]) }))
    .sort((a, b) => a.y - b.y)
  const MIN_GAP = 21
  for (let i = 1; i < endLabels.length; i++) {
    if (endLabels[i].y - endLabels[i - 1].y < MIN_GAP) {
      endLabels[i].y = endLabels[i - 1].y + MIN_GAP
    }
  }

  const nearest = (evt) => {
    const rect = evt.currentTarget.getBoundingClientRect()
    const px = ((evt.clientX - rect.left) / rect.width) * W
    const i = Math.round(((px - PAD.left) / plotW) * (trend.length - 1))
    setHover(Math.max(0, Math.min(trend.length - 1, i)))
  }

  return (
    <div className="chart">
      <div className="chart-legend">
        {SERIES.map((s) => (
          <span key={s} className="legend-item">
            <i style={{ background: sentimentColors[s] }} aria-hidden="true" />
            {sentimentLabels[s]}
          </span>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="chart-svg"
        role="img"
        aria-label="Sentiment share over the last 30 days"
        onMouseMove={nearest}
        onMouseLeave={() => setHover(null)}
      >
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={v}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} stroke={ink.grid} strokeWidth="1" />
            <text x={PAD.left - 8} y={y(v) + 4} textAnchor="end" className="tick">
              {v}%
            </text>
          </g>
        ))}

        {tickIdx.map((i) => (
          <text key={i} x={x(i)} y={H - 8} textAnchor="middle" className="tick">
            {fmtDay(trend[i].date)}
          </text>
        ))}

        {hover !== null && (
          <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + plotH} stroke={ink.axis} strokeWidth="1" strokeDasharray="3 3" />
        )}

        {SERIES.map((s) => (
          <path key={s} d={path(s)} fill="none" stroke={sentimentColors[s]} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        ))}

        {/* Direct end labels — the second identity channel beside the legend. */}
        {endLabels.map((l) => (
          <g key={l.key}>
            {/* Leader line back to the true value when the label was nudged. */}
            <line
              x1={W - PAD.right}
              x2={W - PAD.right + 4}
              y1={y(l.value)}
              y2={l.y}
              stroke={sentimentColors[l.key]}
              strokeWidth="1"
            />
            <rect x={W - PAD.right + 4} y={l.y - 10} width="40" height="20" rx="5" fill={sentimentColors[l.key]} />
            <text x={W - PAD.right + 24} y={l.y + 4} textAnchor="middle" className="end-label">
              {l.value}%
            </text>
          </g>
        ))}

        {hover !== null &&
          SERIES.map((s) => (
            <circle
              key={s}
              cx={x(hover)}
              cy={y(trend[hover][s])}
              r="5"
              fill={sentimentColors[s]}
              stroke="#fff"
              strokeWidth="2"
            />
          ))}
      </svg>

      {hover !== null && (
        <div className="chart-tip" style={{ left: `${(x(hover) / W) * 100}%` }}>
          <strong>{fmtDay(trend[hover].date)}</strong>
          {SERIES.map((s) => (
            <span key={s}>
              <i style={{ background: sentimentColors[s] }} aria-hidden="true" />
              {sentimentLabels[s]} {trend[hover][s]}%
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
