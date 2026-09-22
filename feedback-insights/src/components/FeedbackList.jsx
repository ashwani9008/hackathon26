import { useMemo, useState } from 'react'
import { Card, Input, Select, Tag, Empty, Button } from 'antd'
import { SearchOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import DonutBreakdown from './DonutBreakdown.jsx'
import { sentimentColors, sentimentLabels } from '../config.js'

const SENTIMENT_TAG = { positive: 'green', neutral: 'gold', negative: 'red' }

/**
 * The evidence layer. Clicking a theme bar filters straight to the verbatims
 * behind it — the number on the chart is never the end of the trail.
 */
export default function FeedbackList({ analysis, selectedTheme, onClearTheme }) {
  const [query, setQuery] = useState('')
  const [sentiment, setSentiment] = useState('all')

  const theme = analysis.themes.find((t) => t.name === selectedTheme)

  const rows = useMemo(() => {
    return analysis.classifications
      .map((c) => ({ ...c, ...analysis.byId.get(c.id) }))
      .filter((r) => (selectedTheme ? r.themes.some((t) => t.name === selectedTheme) : true))
      .filter((r) => (sentiment === 'all' ? true : r.sentiment === sentiment))
      .filter((r) => (query ? r.text.toLowerCase().includes(query.toLowerCase()) : true))
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [analysis, selectedTheme, sentiment, query])

  return (
    <Card
      className="panel"
      variant="outlined"
      title={
        <span className="panel-title">
          {selectedTheme ? (
            <>
              <Button type="text" size="small" icon={<ArrowLeftOutlined />} onClick={onClearTheme} />
              <i className="dot" style={{ background: sentimentColors[theme?.sentiment ?? 'neutral'] }} aria-hidden="true" />
              {selectedTheme}
            </>
          ) : (
            'All feedback'
          )}
        </span>
      }
      extra={<span className="panel-extra">{rows.length} of {analysis.total} responses</span>}
    >
      {selectedTheme && theme && (
        <div className="drilldown">
          <DonutBreakdown
            counts={{ positive: theme.positive, neutral: theme.neutral, negative: theme.negative }}
            title={`${selectedTheme} sentiment breakdown`}
          />
          <div className="drilldown-note">
            <div className="issue-label">What this theme is</div>
            <p>
              {theme.count} of {analysis.total} responses mention <strong>{selectedTheme}</strong> — {theme.share}% of
              all feedback in the window. Overall it reads{' '}
              <strong>{sentimentLabels[theme.sentiment].toLowerCase()}</strong>.
            </p>
            <p className="drilldown-caveat">
              The ring measures how <em>this theme</em> is spoken about. The tag on each response below is that
              response’s overall tone — so a customer can be positive on the whole and still be unhappy about{' '}
              {selectedTheme.toLowerCase()}.
            </p>
          </div>
        </div>
      )}

      <div className="filters">
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Search feedback"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ maxWidth: 280 }}
        />
        <Select
          value={sentiment}
          onChange={setSentiment}
          style={{ width: 160 }}
          options={[
            { value: 'all', label: 'All sentiment' },
            { value: 'positive', label: 'Positive' },
            { value: 'neutral', label: 'Neutral' },
            { value: 'negative', label: 'Negative' },
          ]}
        />
      </div>

      {rows.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No matching feedback" />
      ) : (
        <ul className="feed">
          {rows.slice(0, 12).map((r) => (
            <li key={r.id} className="feed-item">
              <span className="feed-dot" style={{ background: sentimentColors[r.sentiment] }} aria-hidden="true" />
              <div className="feed-body">
                <p className="feed-text">{r.text}</p>
                <div className="feed-meta">
                  <Tag color={SENTIMENT_TAG[r.sentiment]}>{sentimentLabels[r.sentiment]}</Tag>
                  {r.themes.map((t) => (
                    <Tag key={t.name} bordered={false}>
                      {t.name}
                    </Tag>
                  ))}
                  <span className="feed-src">
                    {r.role} · {r.source} · {r.date}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {rows.length > 12 && <div className="feed-more">Showing 12 of {rows.length} matching responses</div>}
    </Card>
  )
}
