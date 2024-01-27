import { Navigate, Route, Routes } from 'react-router-dom'

import Dashboard from '@/views/dashboard'
import OperationsCoupon from '@/views/operations/coupon'
import Order from '@/views/order'
import ProductSeries from '@/views/product/series'
import SystemPerm from '@/views/system/perm'
import SystemRole from '@/views/system/role'
import SystemUser from '@/views/system/user'

const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const { perms = [] } = userInfo

const checkAuthCode = (authCode: string) => perms.includes(authCode)

const AuthRoute = () => {
  const auth = localStorage.getItem('token') || ''
  return auth ? (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/order" element={<Order />} />
      {checkAuthCode('sys-user-manager') && <Route path="/system/user" element={<SystemUser />} />}
      {checkAuthCode('sys-role-manager') && <Route path="/system/role" element={<SystemRole />} />}
      {checkAuthCode('sys-perm-manager') && <Route path="/system/perm" element={<SystemPerm />} />}
      {checkAuthCode('product-series-manager') && (
        <Route path="/product/series" element={<ProductSeries />} />
      )}
      {checkAuthCode('operations-coupon-manager') && (
        <Route path="/operations/coupon" element={<OperationsCoupon />} />
      )}
    </Routes>
  ) : (
    <Navigate to="/login" />
  )
}

export default AuthRoute
