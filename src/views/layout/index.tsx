import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { DollarOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons'
import { ProLayout } from '@ant-design/pro-components'
import { useSessionStorageState } from 'ahooks'
import { Avatar, Badge, ConfigProvider, Dropdown, Space, theme } from 'antd'

import Logo from '@/assets/images/Logo.png'
import AuthRoute from '@/routes/authRoute.tsx'
import getMenuConfig from '@/routes/menuConfig.tsx'
import axios from '@/utils/axios.ts'

import './style.scss'

function MyLayout() {
  const [pathname, setPathname] = useSessionStorageState('pathname', {
    defaultValue: '/dashboard'
  })
  const userInfo: Record<string, any> = JSON.parse(localStorage.getItem('userInfo') || '{}')

  const [statistics, setStatistics] = useSessionStorageState('statistics', {
    defaultValue: []
  })

  useEffect(() => {
    getStatistics()
  }, [pathname])

  const getStatistics = () => {
    axios.get(`/order/statistics`).then((res: any) => {
      setStatistics(res)
    })
  }

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
        subMenuItemRender={(itemProps, defaultDom: React.ReactNode, menuProps) => {
          const showBadge = statistics?.length && statistics.some((d: any) => d.notifyCount > 0)

          return itemProps.key === '/trade' ? (
            menuProps.collapsed ? (
              <Badge dot={!!showBadge} className={'menu-badge'} offset={[-10, 8]}>
                <DollarOutlined />
              </Badge>
            ) : (
              <Badge dot={!!showBadge} offset={[10, 6]}>
                {defaultDom}
              </Badge>
            )
          ) : (
            defaultDom
          )
        }}
        menuItemRender={(item, dom) => {
          if (item.isUrl || !item.path) {
            return dom
          }
          const showBadge = statistics?.length && statistics.some((d: any) => d.notifyCount > 0)
          return (
            <Link
              onClick={() => {
                setPathname(item.path || '/')
              }}
              to={item.path}
            >
              {item.path === '/dashboard' ? (
                dom
              ) : item.path === '/trade/order' ? (
                <Badge dot={!!showBadge} offset={[10, 5]}>
                  {item.name}
                </Badge>
              ) : (
                item.name
              )}
            </Link>
          )
        }}
        route={{
          path: '/',
          routes: getMenuConfig(userInfo.perms, userInfo.isSuperAdmin)
        }}
      >
        <AuthRoute />
      </ProLayout>
    </ConfigProvider>
  )
}

export default MyLayout
