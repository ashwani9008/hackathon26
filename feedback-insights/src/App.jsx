import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Card, Col, Layout, Modal, Row, Select, Tag, Input, App as AntApp } from 'antd'
import { ThunderboltOutlined, UploadOutlined, LineChartOutlined, TagsOutlined } from '@ant-design/icons'

import Sidebar from './components/Sidebar.jsx'
import StatTiles from './components/StatTiles.jsx'
import SentimentTrend from './components/SentimentTrend.jsx'
import TopThemes from './components/TopThemes.jsx'
import RecommendationRail from './components/RecommendationRail.jsx'
import ActionPlan from './components/ActionPlan.jsx'
import ProductIssueCard from './components/ProductIssueCard.jsx'
import FeedbackList from './components/FeedbackList.jsx'
import ModelRouter from './components/ModelRouter.jsx'

import sample from './data/feedback.sample.json'
import { aggregate } from './lib/aggregate.js'
import { classify, actionPlan as fetchPlan, checkHealth } from './lib/api.js'

export default function App() {
  const { message } = AntApp.useApp()

  const [responses, setResponses] = useState(sample.responses)
  const [classification, setClassification] = useState(null)
  const [plan, setPlan] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [planning, setPlanning] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState(null)
  const [health, setHealth] = useState(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadText, setUploadText] = useState('')
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    checkHealth().then(setHealth)
  }, [])

  const analysis = useMemo(
    () => (classification ? aggregate(classification.classifications, responses) : null),
    [classification, responses],
  )

  const runAnalysis = async () => {
    setAnalyzing(true)
    setPlan(null)
    setSelectedTheme(null)
    setNotice(null)
    try {
      const result = await classify(responses)
      setClassification(result)
      if (result._fallbackReason) {
        setNotice(
          `Live model call unavailable (${result._fallbackReason}). Showing the rule-based fallback so the panel still runs.`,
        )
      } else {
        message.success(`Classified ${result.classifications.length} responses`)
      }
    } finally {
      setAnalyzing(false)
    }
  }

  const runPlan = async () => {
    if (!analysis) return
    setPlanning(true)
    try {
      const summary = {
        totalResponses: analysis.total,
        sentimentSplit: analysis.sentiment,
        themes: analysis.themes.map((t) => ({
          name: t.name,
          count: t.count,
          share: t.share,
          positive: t.positive,
          neutral: t.neutral,
          negative: t.negative,
        })),
      }
      const result = await fetchPlan(summary, analysis.evidence)
      setPlan(result)
      if (result._fallbackReason) {
        setNotice(`Action plan generated from the bundled fallback (${result._fallbackReason}).`)
      } else {
        message.success('Action plan generated')
      }
    } finally {
      setPlanning(false)
    }
  }

  const applyUpload = () => {
    const text = uploadText.trim()
    if (!text) return
    let parsed
    try {
      const json = JSON.parse(text)
      const arr = Array.isArray(json) ? json : json.responses
      parsed = arr.map((r, i) => ({
        id: r.id ?? `UP-${i + 1}`,
        date: r.date ?? new Date().toISOString().slice(0, 10),
        source: r.source ?? 'Uploaded',
        role: r.role ?? 'Customer',
        rating: r.rating ?? 3,
        text: r.text ?? String(r),
      }))
    } catch {
      // Not JSON — treat it as one comment per line.
      parsed = text
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .map((line, i) => ({
          id: `UP-${i + 1}`,
          date: new Date().toISOString().slice(0, 10),
          source: 'Uploaded',
          role: 'Customer',
          rating: 3,
          text: line,
        }))
    }

    if (!parsed.length) {
      message.error('Nothing to import')
      return
    }
    setResponses(parsed)
    setClassification(null)
    setPlan(null)
    setUploadOpen(false)
    setUploadText('')
    message.success(`Loaded ${parsed.length} responses — run Analyze feedback`)
  }

  const resetToSample = () => {
    setResponses(sample.responses)
    setClassification(null)
    setPlan(null)
    message.info('Sample dataset restored')
  }

  return (
    <Layout className="shell">
      <Sidebar total={responses.length} />

      <Layout>
        <Layout.Header className="topbar">
          <div>
            <h1 className="page-title">
              Feedback Insights <Tag color="purple" className="ai-tag">AI powered</Tag>
            </h1>
            <p className="page-sub">
              Understand what your customers are saying — and turn it into something a team can act on.
            </p>
          </div>

          <div className="topbar-actions">
            <Select
              defaultValue="30"
              style={{ width: 148 }}
              options={[
                { value: '30', label: 'Last 30 days' },
                { value: '7', label: 'Last 7 days' },
                { value: '90', label: 'Last 90 days' },
              ]}
            />
            <Button icon={<UploadOutlined />} onClick={() => setUploadOpen(true)}>
              Upload feedback
            </Button>
            <Button type="primary" icon={<ThunderboltOutlined />} loading={analyzing} onClick={runAnalysis}>
              Analyze feedback
            </Button>
          </div>
        </Layout.Header>

        <Layout.Content className="content">
          {notice && (
            <Alert type="info" showIcon closable className="notice" message={notice} onClose={() => setNotice(null)} />
          )}

          {health && !health.liveMode && !classification && (
            <Alert
              type="warning"
              showIcon
              className="notice"
              message="No ANTHROPIC_API_KEY found"
              description="The panel runs on its rule-based fallback. Add a key to .env and restart to route the real Haiku and Sonnet calls."
            />
          )}

          {!analysis ? (
            <Card className="empty-state" variant="outlined">
              <h2>{responses.length} feedback responses, unread</h2>
              <p>
                NPS scores, in-app surveys and support tickets from loan officers, agents and branch managers using
                Experience.com. Somebody has to read all of it, spot the patterns, and decide what needs fixing.
              </p>
              <p className="empty-cta">
                <Button type="primary" size="large" icon={<ThunderboltOutlined />} loading={analyzing} onClick={runAnalysis}>
                  Analyze feedback
                </Button>
              </p>
              <ul className="empty-preview">
                {responses.slice(0, 6).map((r) => (
                  <li key={r.id}>“{r.text}”</li>
                ))}
              </ul>
            </Card>
          ) : (
            <>
              <StatTiles analysis={analysis} plan={plan} />

              <Row gutter={[16, 16]} className="row">
                <Col xs={24} xl={16}>
                  <Card
                    className="panel"
                    variant="outlined"
                    title={<span className="panel-title"><LineChartOutlined /> Sentiment trend</span>}
                    extra={<span className="panel-extra">7-day rolling share · {sample.window.from} → {sample.window.to}</span>}
                  >
                    <SentimentTrend trend={analysis.trend} />
                  </Card>

                  <Card
                    className="panel"
                    variant="outlined"
                    title={<span className="panel-title"><TagsOutlined /> Top themes</span>}
                    extra={<span className="panel-extra">Share of all feedback · click to drill in</span>}
                  >
                    <TopThemes themes={analysis.themes} onSelect={setSelectedTheme} selected={selectedTheme} />
                  </Card>
                </Col>

                <Col xs={24} xl={8}>
                  <RecommendationRail
                    plan={plan}
                    insight={plan?.keyInsight}
                    loading={planning && !plan}
                    planLoading={planning}
                    hasPlan={Boolean(plan)}
                    onGeneratePlan={runPlan}
                  />
                </Col>
              </Row>

              {plan && (
                <Row gutter={[16, 16]} className="row">
                  <Col xs={24} xl={14}>
                    <ActionPlan plan={plan} total={analysis.total} />
                  </Col>
                  <Col xs={24} xl={10}>
                    <ProductIssueCard issue={plan.productIssue} />
                  </Col>
                </Row>
              )}

              <ModelRouter classifyMeta={classification?._meta} planMeta={plan?._meta} />

              <FeedbackList
                analysis={analysis}
                selectedTheme={selectedTheme}
                onClearTheme={() => setSelectedTheme(null)}
              />

              <div className="reset-row">
                <Button type="link" onClick={resetToSample}>
                  Restore sample dataset
                </Button>
              </div>
            </>
          )}
        </Layout.Content>
      </Layout>

      <Modal
        open={uploadOpen}
        title="Upload feedback"
        onCancel={() => setUploadOpen(false)}
        onOk={applyUpload}
        okText="Load responses"
        width={640}
      >
        <p className="upload-help">
          Paste a JSON array of responses, or one comment per line. Anything you paste replaces the sample dataset.
        </p>
        <Input.TextArea
          rows={12}
          value={uploadText}
          onChange={(e) => setUploadText(e.target.value)}
          placeholder={'Support was great but pricing was confusing...\nCheckout kept failing on my card.\n\nor: [{"id":"1","text":"...","rating":2}]'}
        />
      </Modal>
    </Layout>
  )
}
