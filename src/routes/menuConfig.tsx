import { BookTwoTone, ControlOutlined, LineChartOutlined, SmileOutlined } from '@ant-design/icons'

export default {
  route: {
    path: '/',
    routes: [
      {
        path: '/dashboard',
        name: '仪表盘',
        icon: <LineChartOutlined />,
        component: '@/views/dashboard'
      },
      {
        path: '/order',
        name: '欢迎',
        icon: <SmileOutlined />,
        component: '@/views/order'
      },
      {
        path: '/admin',
        name: '管理页',
        icon: <BookTwoTone />,
        access: 'canAdmin',
        routes: [
          {
            path: '/admin/Welcome',
            name: '一级页面',
            component: '@/views/Welcome'
          },
          {
            path: '/admin/sub-page2',
            name: '二级页面',
            component: './Welcome'
          },
          {
            path: '/admin/sub-page3',
            name: '三级页面',
            component: './Welcome'
          }
        ]
      },
      {
        name: '列表页',
        icon: <ControlOutlined />,
        path: '/list',
        component: './ListTableList',
        routes: [
          {
            path: '/list/sub-page',
            name: '列表页面',
            routes: [
              {
                path: 'sub-sub-page1',
                name: '一一级列表页面',
                component: './Welcome'
              },
              {
                path: 'sub-sub-page2',
                name: '一二级列表页面',
                component: './Welcome'
              },
              {
                path: 'sub-sub-page3',
                name: '一三级列表页面',
                component: './Welcome'
              }
            ]
          },
          {
            path: '/list/sub-page2',
            name: '二级列表页面',
            component: './Welcome'
          },
          {
            path: '/list/sub-page3',
            name: '三级列表页面',
            component: './Welcome'
          }
        ]
      }
    ]
  }
}
