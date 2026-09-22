import { Card, Table, Tag } from 'antd'
import { OrderedListOutlined } from '@ant-design/icons'

const LEVEL_COLOR = { High: 'red', Medium: 'gold', Low: 'default' }
const IMPACT_COLOR = { High: 'green', Medium: 'gold', Low: 'default' }

const columns = [
  {
    title: '#',
    dataIndex: 'idx',
    width: 48,
    render: (_, __, i) => <span className="plan-idx">{i + 1}</span>,
  },
  { title: 'Action', dataIndex: 'action' },
  {
    title: 'Priority',
    dataIndex: 'priority',
    width: 110,
    render: (v) => <Tag color={LEVEL_COLOR[v]}>{v}</Tag>,
  },
  {
    title: 'Impact',
    dataIndex: 'impact',
    width: 110,
    render: (v) => <Tag color={IMPACT_COLOR[v]}>{v}</Tag>,
  },
  {
    title: 'Effort',
    dataIndex: 'effort',
    width: 110,
    render: (v) => <Tag color={LEVEL_COLOR[v]}>{v}</Tag>,
  },
]

export default function ActionPlan({ plan, total }) {
  if (!plan?.actionPlan) return null

  return (
    <Card
      className="panel"
      variant="outlined"
      title={
        <span className="panel-title">
          <OrderedListOutlined /> Action plan
        </span>
      }
      extra={<span className="panel-extra">Generated from {total} responses</span>}
    >
      <Table
        rowKey="action"
        size="middle"
        pagination={false}
        columns={columns}
        dataSource={plan.actionPlan}
        className="plan-table"
      />
    </Card>
  )
}
