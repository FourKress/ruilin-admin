import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/lib/locale/zh_CN'

import { Loading } from '@/components/loading'

const Login = lazy(() => import('@/views/login'))
const MyLayout = lazy(() => import('@/views/layout/index.js'))

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <Suspense fallback={Loading}>
        <Routes>
          <Route path="*" element={<MyLayout />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </Suspense>
    </ConfigProvider>
  )
}

export default App
