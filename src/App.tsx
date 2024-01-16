import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/lib/locale/zh_CN'

import { Loading } from '@/components/loading'
import axios from '@/utils/axios.ts'

const Login = lazy(() => import('@/views/login'))
const MyLayout = lazy(() => import('@/views/layout'))

const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const { userId = '' } = userInfo

console.log('@@@@@@@@@@', userId)

if (userId) {
  console.log('**')
  axios.get(`/user/details/${userId}`).then((res: any) => {
    console.log(res)
    const { phoneNum, username, id: userId, perms } = res
    console.log(phoneNum, username, perms, userId)
    localStorage.setItem(
      'userInfo',
      JSON.stringify({
        phoneNum,
        username,
        perms: perms.map((d: any) => d.code),
        userId
      })
    )
  })
}

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
