import {
  AppstoreOutlined,
  CarryOutOutlined,
  DashboardOutlined,
  SettingOutlined
} from '@ant-design/icons'

const menuList = [
  {
    path: '/dashboard',
    name: '仪表盘',
    icon: <DashboardOutlined />
  },
  {
    path: '/operations',
    name: '运营管理',
    icon: <CarryOutOutlined />,
    authCode: 'operations-manager',
    routes: [
      {
        path: '/operations/coupon',
        name: '优惠码管理',
        authCode: 'operations-coupon-manager'
      },
      {
        path: '/operations/rule',
        name: '满减规则管理',
        authCode: 'operations-rule-manager'
      },
      {
        path: '/operations/banner',
        name: '首页轮播图管理',
        authCode: 'operations-banner-manager'
      }
    ]
  },
  {
    path: '/product',
    name: '商品管理',
    icon: <AppstoreOutlined />,
    authCode: 'product-manager',
    routes: [
      {
        path: '/product/list',
        name: '商品列表',
        authCode: 'product-list-manager'
      }
    ]
  },
  {
    path: '/system',
    name: '系统管理',
    icon: <SettingOutlined />,
    authCode: 'sys-manager',
    routes: [
      {
        path: '/system/user',
        name: '用户管理',
        authCode: 'sys-user-manager'
      },
      {
        path: '/system/role',
        name: '角色管理',
        authCode: 'sys-role-manager'
      },
      {
        path: '/system/perm',
        name: '权限管理',
        authCode: 'sys-perm-manager'
      }
    ]
  }
]

const getMenuConfig = (perms: string[], isSuperAdmin: boolean): any[] => {
  const checkAuthCode = (authCode: string) => (perms || []).includes(authCode)

  return menuList.map((menu) => {
    let route: any
    if (!menu?.authCode || checkAuthCode(menu.authCode)) {
      route = menu
      if (menu?.routes?.length) {
        route.routes = menu.routes.filter((d) => {
          if (d.authCode === 'sys-perm-manager' && !isSuperAdmin) return false
          if (!d?.authCode) {
            return true
          } else if (checkAuthCode(d.authCode)) {
            return true
          }
          return false
        })
      }
    }

    return route
  })
}

export default getMenuConfig
