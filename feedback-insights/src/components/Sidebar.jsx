import { Layout, Menu, Avatar, Badge } from 'antd'
import {
  AppstoreOutlined,
  MessageOutlined,
  BulbOutlined,
  ProfileOutlined,
  BarChartOutlined,
  TeamOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { account } from '../config.js'

const items = [
  { key: 'dashboard', icon: <AppstoreOutlined />, label: 'Dashboard' },
  { key: 'feedback', icon: <MessageOutlined />, label: 'Feedback' },
  {
    key: 'insights',
    icon: <BulbOutlined />,
    label: (
      <span className="menu-with-badge">
        Insights <Badge count="New" style={{ background: '#eeebfd', color: '#4a3aa7', fontWeight: 600 }} />
      </span>
    ),
  },
  { key: 'tickets', icon: <ProfileOutlined />, label: 'Tickets' },
  { key: 'reports', icon: <BarChartOutlined />, label: 'Reports' },
  { key: 'customers', icon: <TeamOutlined />, label: 'Customers' },
  { key: 'settings', icon: <SettingOutlined />, label: 'Settings' },
]

export default function Sidebar({ total }) {
  return (
    <Layout.Sider width={232} className="sider" theme="light">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          ✳
        </span>
        <span className="brand-name">
          experience<b>.com</b>
        </span>
      </div>

      <Menu mode="inline" selectedKeys={['insights']} items={items} className="nav" />

      <div className="sider-foot">
        <div className="sider-stat">
          <span className="sider-stat-label">Feedback in window</span>
          <span className="sider-stat-value">{total}</span>
          <span className="sider-stat-sub">30-day sample dataset</span>
        </div>

        <div className="who">
          <Avatar style={{ background: '#5b4cdb' }}>{account.name[0]}</Avatar>
          <div>
            <div className="who-name">{account.name}</div>
            <div className="who-team">{account.team}</div>
          </div>
        </div>
      </div>
    </Layout.Sider>
  )
}
