import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider, App as AntApp } from 'antd'
import App from './App.jsx'
import { brand } from './config.js'
import './styles.css'

const theme = {
  token: {
    colorPrimary: brand.primary,
    borderRadius: brand.radius,
    fontFamily: brand.fontFamily,
    colorBgLayout: '#f5f6f8',
  },
  components: {
    Layout: { siderBg: '#ffffff', headerBg: '#ffffff', bodyBg: '#f5f6f8' },
    Menu: { itemSelectedBg: '#eeebfd', itemSelectedColor: brand.primaryDeep },
    Card: { headerFontSize: 15 },
    Statistic: { contentFontSize: 28 },
  },
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider theme={theme}>
      <AntApp>
        <App />
      </AntApp>
    </ConfigProvider>
  </React.StrictMode>,
)
