import { Navigate, Route, Routes } from 'react-router-dom'

import Customer from '@/views/customer'
import Dashboard from '@/views/dashboard'
import OperationsBanner from '@/views/operations/banner'
import OperationsCoupon from '@/views/operations/coupon'
import OperationsRule from '@/views/operations/rule'
import ProductList from '@/views/product/list'
import ProductListDetails from '@/views/product/list/details'
import SystemPerm from '@/views/system/perm'
import SystemRole from '@/views/system/role'
import SystemUser from '@/views/system/user'

const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const { perms = [], isSuperAdmin = false } = userInfo

const checkAuthCode = (authCode: string) => perms.includes(authCode)

const AuthRoute = () => {
  const auth = localStorage.getItem('token') || ''
  return auth ? (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      {checkAuthCode('sys-user-manager') && <Route path="/system/user" element={<SystemUser />} />}
      {checkAuthCode('sys-role-manager') && <Route path="/system/role" element={<SystemRole />} />}
      {checkAuthCode('sys-perm-manager') && isSuperAdmin && (
        <Route path="/system/perm" element={<SystemPerm />} />
      )}
      {checkAuthCode('product-list-manager') && (
        <Route path="/product/list" element={<ProductList />} />
      )}
      {checkAuthCode('add-product') | checkAuthCode('edit-product') && (
        <Route path="/product/list/details/:edit/:id?" element={<ProductListDetails />} />
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
      {checkAuthCode('customer-list-manager') && (
        <Route path="/customer/list" element={<Customer />} />
      )}
    </Routes>
  ) : (
    <Navigate to="/login" />
  )
}

export default AuthRoute
