import { Link } from 'react-router-dom'
import { LogoutOutlined, UserOutlined } from '@ant-design/icons'
import { ProLayout } from '@ant-design/pro-components'
import { useSessionStorageState } from 'ahooks'
import { Avatar, ConfigProvider, Dropdown, Space, theme } from 'antd'

import Logo from '@/assets/images/Logo.png'
import AuthRoute from '@/routes/authRoute.tsx'
import getMenuConfig from '@/routes/menuConfig.tsx'
import axios from '@/utils/axios.ts'

import './style.scss'

function MyLayout() {
  const [pathname, setPathname] = useSessionStorageState('pathname', {
    defaultValue: '/dashboard'
  })
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')

  const handleLogout = () => {
    axios.get(`/auth/logout/${userInfo.userId}`).finally(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  }

  return (
    <ConfigProvider theme={{ algorithm: [theme.compactAlgorithm] }}>
      <ProLayout
        siderWidth={180}
        disableMobile={true}
        title={'睿琳商城管理系统'}
        layout="mix"
        logo={Logo}
        location={{
          pathname
        }}
        token={{
          header: {
            heightLayoutHeader: 48
          }
        }}
        avatarProps={{
          render: () => {
            const items = [
              {
                key: 'logout',
                label: (
                  <Link to={'/login'} onClick={() => handleLogout()}>
                    退出登录
                  </Link>
                ),
                icon: <LogoutOutlined />
              }
            ]
            return (
              <Dropdown menu={{ items }} placement="bottomRight">
                <Space className={'layout-avatar'}>
                  <Avatar
                    style={{
                      backgroundColor: '#87d068',
                      lineHeight: '24px',
                      verticalAlign: 'unset'
                    }}
                    icon={<UserOutlined />}
                  />
                  <span style={{ paddingLeft: '8px' }}>{userInfo.username}</span>
                </Space>
              </Dropdown>
            )
          }
        }}
        menuItemRender={(item, dom) => {
          if (item.isUrl || !item.path) {
            return dom
          }
          return (
            <Link
              onClick={() => {
                setPathname(item.path || '/')
              }}
              to={item.path}
            >
              {item.path === '/dashboard' ? dom : item.name}
            </Link>
          )
        }}
        route={{
          path: '/',
          routes: getMenuConfig()
        }}
      >
        <AuthRoute />
      </ProLayout>
    </ConfigProvider>
  )
}

export default MyLayout
