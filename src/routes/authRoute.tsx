import { Navigate, Route, Routes } from 'react-router-dom'

import Dashboard from '@/views/dashboard'
import Order from '@/views/order'
import Welcome from '@/views/Welcome'

const AuthRoute = () => {
  const auth = localStorage.getItem('token') || 'token'
  return auth ? (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/order" element={<Order />} />
      <Route path="/admin/Welcome" element={<Welcome />} />
    </Routes>
  ) : (
    <Navigate to="/login" />
  )
}

export default AuthRoute
