import { Link } from 'react-router-dom'
import { LogoutOutlined, UserOutlined } from '@ant-design/icons'
import { PageContainer, ProLayout } from '@ant-design/pro-components'
import { useSessionStorageState } from 'ahooks'
import { Dropdown } from 'antd'

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
    <ProLayout
      siderWidth={216}
      disableMobile={true}
      title={'Ant Design Pro'}
      layout="mix"
      logo={Logo}
      location={{
        pathname
      }}
      avatarProps={{
        icon: <UserOutlined />,
        style: { backgroundColor: '#87d068' },
        title: userInfo.username,
        size: 'small',
        render: (_props, defaultDom) => {
          const items = [
            {
              key: 'logout',
              label: <Link to={'/login'}>退出登录</Link>,
              icon: <LogoutOutlined />
            }
          ]

          return (
            <Dropdown menu={{ items }} placement="bottomRight">
              {defaultDom}
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
  )
}

export default MyLayout
