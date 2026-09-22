import { useState } from 'react'
import { Alert, Button, Card, Modal, Progress, Tag, Typography, App } from 'antd'
import { WarningFilled, BugOutlined, CheckCircleFilled, CopyOutlined } from '@ant-design/icons'
import { thresholds, sentimentColors } from '../config.js'

const { Paragraph } = Typography

/**
 * The step that makes this more than a summariser: the model decides whether
 * the complaints add up to a real defect, states its confidence, and writes the
 * ticket an engineer would otherwise have to write by hand.
 */
export default function ProductIssueCard({ issue }) {
  const [open, setOpen] = useState(false)
  const [filed, setFiled] = useState(null)
  const { message } = App.useApp()

  if (!issue) return null

  const strong = issue.confidence >= thresholds.productIssueConfidence
  const { jira } = issue

  const ticketText = [
    `Title: ${jira.title}`,
    '',
    `Priority: ${jira.suggestedPriority}`,
    `Labels: ${jira.labels.join(', ')}`,
    '',
    'Problem',
    jira.problem,
    '',
    'Acceptance criteria',
    ...jira.acceptanceCriteria.map((c, i) => `${i + 1}. ${c}`),
  ].join('\n')

  const fileTicket = () => {
    // Demo stand-in for the Jira REST call — the ticket body is real, the
    // create is simulated so the panel can be shown without a Jira sandbox.
    const key = `XMP-${4400 + Math.floor(issue.confidence)}`
    setFiled(key)
    message.success(`${key} created in XMP`)
  }

  const copy = async () => {
    await navigator.clipboard.writeText(ticketText)
    message.success('Ticket copied')
  }

  return (
    <>
      <Card
        className="issue-card"
        variant="outlined"
        title={
          <span className="panel-title">
            <WarningFilled style={{ color: sentimentColors.negative }} /> Potential product issue
          </span>
        }
        extra={<Tag color="red">{jira.suggestedPriority}</Tag>}
      >
        <div className="issue-grid">
          <div>
            <div className="issue-label">Theme</div>
            <div className="issue-theme">{issue.theme}</div>

            <div className="issue-label">Evidence</div>
            <div className="issue-evidence">
              <strong>{issue.evidenceCount}</strong> customers independently reported this
            </div>

            <p className="issue-summary">{issue.summary}</p>
          </div>

          <div className="issue-confidence">
            <div className="issue-label">Confidence</div>
            <Progress
              type="dashboard"
              percent={issue.confidence}
              size={128}
              strokeColor={strong ? sentimentColors.negative : sentimentColors.neutral}
              format={(p) => (
                <span className="conf-value">
                  {p}%<span className="conf-word">{strong ? 'Strong signal' : 'Weak signal'}</span>
                </span>
              )}
            />
          </div>
        </div>

        {!strong && (
          <Alert
            type="warning"
            showIcon
            className="issue-weak"
            message="Below the strong-signal threshold"
            description={`Confidence is under ${thresholds.productIssueConfidence}%. Treat this as worth investigating rather than a confirmed defect.`}
          />
        )}

        <div className="issue-actions">
          <Button type="primary" icon={<BugOutlined />} onClick={() => setOpen(true)}>
            Review Jira ticket
          </Button>
          <Button icon={<CopyOutlined />} onClick={copy}>
            Copy ticket
          </Button>
          {filed && (
            <span className="issue-filed">
              <CheckCircleFilled style={{ color: sentimentColors.positive }} /> {filed} created
            </span>
          )}
        </div>
      </Card>

      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        width={720}
        title="Suggested Jira ticket"
        footer={[
          <Button key="copy" icon={<CopyOutlined />} onClick={copy}>
            Copy
          </Button>,
          <Button key="close" onClick={() => setOpen(false)}>
            Close
          </Button>,
          <Button key="file" type="primary" icon={<BugOutlined />} disabled={Boolean(filed)} onClick={fileTicket}>
            {filed ? `Created ${filed}` : 'Create ticket in XMP'}
          </Button>,
        ]}
      >
        <div className="ticket">
          <div className="ticket-row">
            <span className="ticket-key">Title</span>
            <Paragraph className="ticket-title">{jira.title}</Paragraph>
          </div>

          <div className="ticket-row">
            <span className="ticket-key">Priority</span>
            <Tag color="red">{jira.suggestedPriority}</Tag>
            {jira.labels.map((l) => (
              <Tag key={l}>{l}</Tag>
            ))}
          </div>

          <div className="ticket-row">
            <span className="ticket-key">Problem</span>
            <Paragraph>{jira.problem}</Paragraph>
          </div>

          <div className="ticket-row">
            <span className="ticket-key">Acceptance criteria</span>
            <ol className="ticket-ac">
              {jira.acceptanceCriteria.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ol>
          </div>
        </div>
      </Modal>
    </>
  )
}
