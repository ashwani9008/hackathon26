import { Tooltip } from 'antd'
import { sentimentColors, sentimentLabels, ink } from '../config.js'

/**
 * Theme volume, coloured by the sentiment each theme carries.
 *
 * The colour is semantic, not decorative — a red bar means that theme's
 * mentions are mostly complaints. Because amber sits under 3:1 on white, every
 * bar ships the sentiment word as visible text: colour never carries it alone.
 */
export default function TopThemes({ themes, onSelect, selected }) {
  if (!themes?.length) return null
  const max = Math.max(...themes.map((t) => t.share))

  return (
    <div className="themes">
      {themes.map((t) => (
        <Tooltip
          key={t.name}
          title={`${t.count} of the responses mention ${t.name} — ${t.positive} positive, ${t.neutral} neutral, ${t.negative} negative`}
        >
          <button
            type="button"
            className={`theme-row${selected === t.name ? ' is-selected' : ''}`}
            onClick={() => onSelect?.(t.name)}
          >
            <span className="theme-name">
              <i className="dot" style={{ background: sentimentColors[t.sentiment] }} aria-hidden="true" />
              {t.name}
            </span>

            <span className="theme-track" style={{ background: ink.plane }}>
              <span
                className="theme-fill"
                style={{
                  width: `${(t.share / max) * 100}%`,
                  background: sentimentColors[t.sentiment],
                }}
              />
            </span>

            <span className="theme-meta">
              <span className="theme-sentiment">{sentimentLabels[t.sentiment]}</span>
              <span className="theme-share">{t.share}%</span>
            </span>
          </button>
        </Tooltip>
      ))}
    </div>
  )
}
