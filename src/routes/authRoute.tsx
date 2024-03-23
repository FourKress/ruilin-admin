import { Navigate, Route, Routes } from 'react-router-dom'

import Dashboard from '@/views/dashboard'
import MallBanner from '@/views/mall/banner'
import MallBlog from '@/views/mall/blog'
import MallBlogDetails from '@/views/mall/blog/details'
import MallInfo from '@/views/mall/info'
import MallQuestion from '@/views/mall/question'
import MallQuestionDetails from '@/views/mall/question/details'
import ProductCoupon from '@/views/product/coupon'
import ProductList from '@/views/product/list'
import ProductListDetails from '@/views/product/list/details'
import ProductRule from '@/views/product/rule'
import SystemPerm from '@/views/system/perm'
import SystemRole from '@/views/system/role'
import SystemUser from '@/views/system/user'
import TradeCustomer from '@/views/trade/customer'
import TradeCustomerDetails from '@/views/trade/customer/details'
import TradeOrder from '@/views/trade/order'
import TradeOrderDetails from '@/views/trade/order/details'

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
      {checkAuthCode('product-coupon-manager') && (
        <Route path="/product/coupon" element={<ProductCoupon />} />
      )}
      {checkAuthCode('product-rule-manager') && (
        <Route path="/product/rule" element={<ProductRule />} />
      )}
      {checkAuthCode('trade-customer-manager') && (
        <Route path="/trade/customer" element={<TradeCustomer />} />
      )}
      {checkAuthCode('details-customer') && (
        <Route path="/trade/customer/details/:customerId" element={<TradeCustomerDetails />} />
      )}
      {checkAuthCode('trade-order-manager') && (
        <Route path="/trade/order" element={<TradeOrder />} />
      )}
      {checkAuthCode('edit-order') && (
        <Route path="/trade/order/details/:orderId" element={<TradeOrderDetails />} />
      )}
      {checkAuthCode('mall-banner-manager') && (
        <Route path="/mall/banner" element={<MallBanner />} />
      )}
      {checkAuthCode('mall-blog-manager') && <Route path="/mall/blog" element={<MallBlog />} />}
      {checkAuthCode('edit-blog') && (
        <Route path="/mall/blog/details/:blogId?" element={<MallBlogDetails />} />
      )}
      {checkAuthCode('mall-info-manager') && <Route path="/mall/info" element={<MallInfo />} />}
      {checkAuthCode('mall-blog-manager') && (
        <Route path="/mall/question" element={<MallQuestion />} />
      )}
      {checkAuthCode('edit-blog') && (
        <Route path="/mall/question/details/:questionId?" element={<MallQuestionDetails />} />
      )}
    </Routes>
  ) : (
    <Navigate to="/login" />
  )
}

export default AuthRoute
