import { BookTwoTone, LineChartOutlined } from '@ant-design/icons'

const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const { perms = [] } = userInfo

const menuList = [
  {
    path: '/dashboard',
    name: '仪表盘',
    icon: <LineChartOutlined />
  },
  {
    path: '/system',
    name: '系统管理',
    icon: <BookTwoTone />,
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

const checkAuthCode = (authCode: string) => perms.includes(authCode)

const routes: any = []
menuList.forEach((menu) => {
  if (!menu?.authCode) {
    routes.push(menu)
  } else if (checkAuthCode(menu.authCode)) {
    routes.push(menu)
  }
  if (menu?.routes?.length) {
    menu.routes = menu.routes.filter((d) => {
      if (!d?.authCode) {
        return true
      } else if (checkAuthCode(d.authCode)) {
        return true
      }
      return false
    })
  }
})

export default {
  route: {
    path: '/',
    routes
  }
}
