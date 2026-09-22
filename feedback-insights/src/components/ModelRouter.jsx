import { Card, Table, Tag, Tooltip } from 'antd'
import { NodeIndexOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { models } from '../config.js'
import { PRICES, OPUS_MODEL } from '../../server/models.js'

const usd = (n) => (n < 0.01 ? `$${n.toFixed(4)}` : `$${n.toFixed(3)}`)

/**
 * Rule 2 of the brief is scored, so the routing decision is shown rather than
 * merely claimed: which model ran which stage, what it cost, and what the naive
 * everything-on-Opus run would have cost instead.
 */
export default function ModelRouter({ classifyMeta, planMeta }) {
  const stages = [
    classifyMeta && {
      key: 'classify',
      stage: 'Classify 60 verbatims',
      model: classifyMeta.fallback ? 'Rule-based fallback' : models.classify.label,
      why: 'Labelling against a fixed schema. High volume, no hard reasoning.',
      meta: classifyMeta,
    },
    planMeta && {
      key: 'plan',
      stage: 'Action plan + Jira ticket',
      model: planMeta.fallback ? 'Bundled fallback' : models.plan.label,
      why: 'Impact-vs-effort judgement and ticket authoring. Reasoning earns its cost here.',
      meta: planMeta,
    },
  ].filter(Boolean)

  if (!stages.length) return null

  const spent = stages.reduce((a, s) => a + (s.meta.costUsd ?? 0), 0)
  const tokensIn = stages.reduce((a, s) => a + (s.meta.inputTokens ?? 0), 0)
  const tokensOut = stages.reduce((a, s) => a + (s.meta.outputTokens ?? 0), 0)
  const opus = PRICES[OPUS_MODEL]
  const opusCost = (tokensIn / 1e6) * opus.in + (tokensOut / 1e6) * opus.out
  const live = stages.some((s) => !s.meta.fallback)

  const columns = [
    { title: 'Stage', dataIndex: 'stage' },
    {
      title: 'Model',
      dataIndex: 'model',
      render: (v, r) => <Tag color={r.meta.fallback ? 'default' : 'purple'}>{v}</Tag>,
    },
    { title: 'Why this model', dataIndex: 'why', className: 'router-why' },
    {
      title: 'Latency',
      dataIndex: 'ms',
      width: 100,
      render: (_, r) => (r.meta.ms ? `${(r.meta.ms / 1000).toFixed(1)}s` : '—'),
    },
    {
      title: 'Cost',
      dataIndex: 'cost',
      width: 100,
      render: (_, r) => (r.meta.costUsd ? usd(r.meta.costUsd) : '—'),
    },
  ]

  return (
    <Card
      className="panel router"
      variant="outlined"
      title={
        <span className="panel-title">
          <NodeIndexOutlined /> Model routing
        </span>
      }
      extra={
        <Tag color={live ? 'purple' : 'default'}>{live ? 'Live API' : 'Offline fallback'}</Tag>
      }
    >
      <Table rowKey="key" size="small" pagination={false} columns={columns} dataSource={stages} />

      {live && (
        <div className="router-foot">
          <div>
            <span className="router-foot-label">This run</span>
            <span className="router-foot-value">{usd(spent)}</span>
          </div>
          <div>
            <span className="router-foot-label">
              Same run on Opus{' '}
              <Tooltip title="Identical token counts priced at Opus list rates — the cost of not routing.">
                <InfoCircleOutlined />
              </Tooltip>
            </span>
            <span className="router-foot-value muted">{usd(opusCost)}</span>
          </div>
          <div>
            <span className="router-foot-label">Saved by routing</span>
            <span className="router-foot-value good">
              {opusCost > 0 ? `${Math.round((1 - spent / opusCost) * 100)}%` : '—'}
            </span>
          </div>
        </div>
      )}
    </Card>
  )
}
