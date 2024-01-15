import { Navigate, Route, Routes } from 'react-router-dom'

import Dashboard from '@/views/dashboard'
import Order from '@/views/order'
import SystemPerm from '@/views/system/perm'
import SystemRole from '@/views/system/role'
import SystemUser from '@/views/system/user'

const AuthRoute = () => {
  const auth = localStorage.getItem('token') || ''
  return auth ? (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/order" element={<Order />} />
      <Route path="/system/user" element={<SystemUser />} />
      <Route path="/system/role" element={<SystemRole />} />
      <Route path="/system/perm" element={<SystemPerm />} />
    </Routes>
  ) : (
    <Navigate to="/login" />
  )
}

export default AuthRoute
