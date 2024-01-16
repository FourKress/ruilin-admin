import { Link } from 'react-router-dom'
import { LogoutOutlined, UserOutlined } from '@ant-design/icons'
import { PageContainer, ProLayout } from '@ant-design/pro-components'
import { useSessionStorageState } from 'ahooks'
import { Avatar, ConfigProvider, Dropdown, Space, theme } from 'antd'

import Logo from '@/assets/images/react.svg'
import AuthRoute from '@/routes/authRoute.tsx'
import menuConfig from '@/routes/menuConfig.tsx'

import './style.scss'

function MyLayout() {
  const [pathname, setPathname] = useSessionStorageState('pathname', {
    defaultValue: '/dashboard'
  })
  console.log(pathname)
  const userInfo = JSON.parse(localStorage.getItem('userInfo')!)

  return (
    <ConfigProvider theme={{ algorithm: [theme.compactAlgorithm] }}>
      <ProLayout
        siderWidth={180}
        disableMobile={true}
        title={'Ant Design Pro'}
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
                label: <Link to={'/login'}>退出登录</Link>,
                icon: <LogoutOutlined />
              }
            ]
            return (
              <Dropdown menu={{ items }} placement="bottomRight">
                <Space className={'layout-avatar'}>
                  <Avatar
                    style={{
                      backgroundColor: '#87d068',
                      lineHeight: '28px',
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
              {dom}
            </Link>
          )
        }}
        {...menuConfig}
      >
        <PageContainer breadcrumbRender={false}>
          <div className={'page-container'}>
            <AuthRoute />
          </div>
        </PageContainer>
      </ProLayout>
    </ConfigProvider>
  )
}

export default MyLayout
