import { BookTwoTone, LineChartOutlined, SmileOutlined } from '@ant-design/icons'

export default {
  route: {
    path: '/',
    routes: [
      {
        path: '/dashboard',
        name: '仪表盘',
        icon: <LineChartOutlined />
      },
      {
        path: '/order',
        name: '欢迎',
        icon: <SmileOutlined />
      },

      {
        path: '/system',
        name: '系统管理',
        icon: <BookTwoTone />,
        access: 'admin',
        routes: [
          {
            path: '/system/user',
            name: '用户管理'
          },
          {
            path: '/system/role',
            name: '角色管理'
          },
          {
            path: '/system/perm',
            name: '权限管理'
          }
        ]
      }
    ]
  }
}
