import { Navigate, Route, Routes } from 'react-router-dom'

import Dashboard from '@/views/dashboard'
import OperationsBanner from '@/views/operations/banner'
import OperationsCoupon from '@/views/operations/coupon'
import OperationsRule from '@/views/operations/rule'
import Order from '@/views/order'
import ProductSeries from '@/views/product/series'
import ProductSeriesDetails from '@/views/product/series/details'
import ProductUnit from '@/views/product/unit'
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
      {checkAuthCode('product-series-manager') && (
        <Route path="/product/series/details" element={<ProductSeriesDetails />} />
      )}
      {checkAuthCode('product-unit-manager') && (
        <Route path="/product/unit" element={<ProductUnit />} />
      )}
      {checkAuthCode('operations-coupon-manager') && (
        <Route path="/operations/coupon" element={<OperationsCoupon />} />
      )}
      {checkAuthCode('operations-rule-manager') && (
        <Route path="/operations/rule" element={<OperationsRule />} />
      )}
      {checkAuthCode('operations-banner-manager') && (
        <Route path="/operations/banner" element={<OperationsBanner />} />
      )}
    </Routes>
  ) : (
    <Navigate to="/login" />
  )
}

export default AuthRoute
