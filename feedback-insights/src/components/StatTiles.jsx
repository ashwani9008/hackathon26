import { Card, Col, Row } from 'antd'
import { SmileOutlined, MessageOutlined, TagOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { sentimentColors, sentimentLabels } from '../config.js'

/**
 * Four headline figures. These are stat tiles, not charts — a single number
 * with a label reads faster than any plot of it would.
 */
function Tile({ icon, tint, label, value, caption, sub }) {
  return (
    <Card className="tile" variant="outlined">
      <div className="tile-label">{label}</div>
      <div className="tile-body">
        <span className="tile-icon" style={{ background: tint }} aria-hidden="true">
          {icon}
        </span>
        <div>
          <div className="tile-value">{value}</div>
          {caption && <div className="tile-caption">{caption}</div>}
        </div>
      </div>
      {sub && <div className="tile-sub">{sub}</div>}
    </Card>
  )
}

export default function StatTiles({ analysis, plan }) {
  const topTheme = analysis.themes[0]
  const highPriority = plan?.actionPlan?.filter((a) => a.priority === 'High').length

  return (
    <Row gutter={[16, 16]} className="tiles">
      <Col xs={24} sm={12} xl={6}>
        <Tile
          icon={<SmileOutlined />}
          tint="#e6f6e6"
          label="Overall sentiment"
          value={`${analysis.sentiment.positive}%`}
          caption={sentimentLabels.positive}
          sub={`${analysis.counts.negative} negative · ${analysis.counts.neutral} neutral`}
        />
      </Col>

      <Col xs={24} sm={12} xl={6}>
        <Tile
          icon={<MessageOutlined />}
          tint="#e8ecfd"
          label="Responses analysed"
          value={analysis.total}
          caption="verbatims"
          sub="NPS, in-app survey and support tickets"
        />
      </Col>

      <Col xs={24} sm={12} xl={6}>
        <Tile
          icon={<TagOutlined />}
          tint="#f1ecfd"
          label="Top theme"
          value={topTheme?.name ?? '—'}
          caption={topTheme ? `${topTheme.share}% of feedback` : null}
          sub={
            topTheme ? (
              <>
                <i className="dot" style={{ background: sentimentColors[topTheme.sentiment] }} aria-hidden="true" />
                {sentimentLabels[topTheme.sentiment]} overall
              </>
            ) : null
          }
        />
      </Col>

      <Col xs={24} sm={12} xl={6}>
        <Tile
          icon={<ThunderboltOutlined />}
          tint="#fff3dd"
          label="Action items"
          value={plan ? plan.actionPlan.length : '—'}
          caption={plan ? 'generated' : 'not yet generated'}
          sub={plan ? `${highPriority} high priority` : 'Run Generate Action Plan'}
        />
      </Col>
    </Row>
  )
}
