import {
  AppstoreOutlined,
  CarryOutOutlined,
  DashboardOutlined,
  DollarOutlined,
  SettingOutlined
} from '@ant-design/icons'

const menuList = [
  {
    path: '/dashboard',
    name: '仪表盘',
    icon: <DashboardOutlined />
  },
  {
    path: '/trade',
    name: '交易管理',
    icon: <DollarOutlined />,
    authCode: 'trade-manager',
    routes: [
      {
        path: '/trade/order',
        name: '订单管理',
        authCode: 'trade-order-manager'
      },
      {
        path: '/trade/customer',
        name: '客户管理',
        authCode: 'trade-customer-manager'
      }
    ]
  },
  {
    path: '/product',
    name: '商品管理',
    icon: <CarryOutOutlined />,
    authCode: 'product-manager',
    routes: [
      {
        path: '/product/list',
        name: '商品列表',
        authCode: 'product-list-manager'
      },
      {
        path: '/product/rule',
        name: '满减管理',
        authCode: 'product-rule-manager'
      },
      {
        path: '/product/coupon',
        name: '优惠码管理',
        authCode: 'product-coupon-manager'
      }
    ]
  },
  {
    path: '/mall',
    name: '商城管理',
    icon: <AppstoreOutlined />,
    authCode: 'mall-manager',
    routes: [
      {
        path: '/mall/banner',
        name: '首页轮播图管理',
        authCode: 'mall-banner-manager'
      },
      {
        path: '/mall/blog',
        name: '博客管理',
        authCode: 'mall-blog-manager'
      },
      // {
      //   path: '/mall/service',
      //   name: '客户服务管理',
      //   authCode: 'mall-banner-manager'
      // },
      {
        path: '/mall/question',
        name: '常见问题管理',
        authCode: 'mall-banner-manager'
      },
      {
        path: '/mall/info',
        name: '基本信息管理',
        authCode: 'mall-info-manager'
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
