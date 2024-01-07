import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LogoutOutlined } from '@ant-design/icons'
import { PageContainer, ProCard, ProLayout } from '@ant-design/pro-components'
import { Dropdown } from 'antd'

import Logo from '@/assets/images/react.svg'
import AuthRoute from '@/routes/authRoute.tsx'
import menuConfig from '@/routes/menuConfig.tsx'

import './style.scss'

function MyLayout() {
  const [pathname, setPathname] = useState('/')
  console.log(123)

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
        src: 'https://gw.alipayobjects.com/zos/antfincdn/efFD%24IOql2/weixintupian_20170331104822.jpg',
        title: '测试',
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
        <ProCard
          style={{
            height: '100vh',
            minHeight: '100vh'
          }}
        >
          <AuthRoute />
        </ProCard>
      </PageContainer>
    </ProLayout>
  )
}

export default MyLayout
