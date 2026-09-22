import { Button, Card, Empty, Tag, Spin } from 'antd'
import { ThunderboltOutlined, RightOutlined } from '@ant-design/icons'

const PRIORITY_COLOR = { High: 'red', Medium: 'gold', Low: 'default' }

export default function RecommendationRail({ plan, insight, loading, onGeneratePlan, planLoading, hasPlan }) {
  return (
    <Card
      className="rail"
      variant="outlined"
      title={
        <span className="rail-title">
          <ThunderboltOutlined /> AI Recommendation
        </span>
      }
    >
      {loading ? (
        <div className="rail-loading">
          <Spin />
          <p>Reading the feedback…</p>
        </div>
      ) : !insight ? (
        <div className="rail-empty">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Themes are labelled. The next step reasons over them."
          />
          <Button
            type="primary"
            size="large"
            block
            icon={<ThunderboltOutlined />}
            loading={planLoading}
            onClick={onGeneratePlan}
            className="rail-cta"
          >
            Generate action plan
          </Button>
        </div>
      ) : (
        <>
          <div className="key-insight">
            <div className="key-insight-label">Key insight</div>
            <p>{insight}</p>
          </div>

          <div className="rail-section-label">Recommended actions</div>
          <ul className="rec-list">
            {plan?.recommendations?.map((r) => (
              <li key={r.title} className="rec">
                <div className="rec-head">
                  <span className="rec-title">{r.title}</span>
                  <Tag color={PRIORITY_COLOR[r.priority]} className="rec-tag">
                    {r.priority}
                  </Tag>
                </div>
                <p className="rec-detail">{r.detail}</p>
                <RightOutlined className="rec-chevron" aria-hidden="true" />
              </li>
            ))}
          </ul>

          <Button
            type="primary"
            size="large"
            block
            icon={<ThunderboltOutlined />}
            loading={planLoading}
            onClick={onGeneratePlan}
            className="rail-cta"
          >
            {hasPlan ? 'Regenerate action plan' : 'Generate action plan'}
          </Button>
        </>
      )}
    </Card>
  )
}
