import { message, Modal } from 'antd'
import axios from 'axios'

import { closeLoading, createLoading } from '@/components/loading/utils.tsx'

const Axios = axios.create({
  baseURL: `${import.meta.env.VITE_APP_BASE_URL}/${import.meta.env.VITE_APP_BASE_PREFIX}`,
  timeout: 30000
})

Axios.defaults.headers.post['Content-Type'] = 'application/json'

let requestCount = 0

const showLoading = () => {
  if (requestCount === 0) {
    createLoading()
  }
  requestCount++
}

// 隐藏loading
const hideLoading = () => {
  requestCount--
  if (requestCount === 0) {
    closeLoading()
  }
}

const whitelist = ['/auth/adminLogin', ':9000/dev']

// 请求前拦截
Axios['interceptors'].request.use(
  (config) => {
    const { url, headers } = config

    const token = localStorage.getItem('token')
    if (url && token && !whitelist.some((w) => url.includes(w))) {
      config.headers.Authorization = `Bearer ${token}`
    }

    if (headers.isLoading) {
      showLoading()
    }

    return config
  },
  (err) => {
    if (err.config.headers['isLoading']) {
      hideLoading()
    }
    return Promise.reject(err)
  }
)

// 返回后拦截
Axios['interceptors'].response.use(
  async (res) => {
    const { data, config } = res
    const { code } = data
    if (config.headers.isLoading) {
      hideLoading()
    }
    if (code === 10000) {
      return data.data
    } else {
      if (code === 10100) {
        await message.warning(data.message)
      }
      if (data) return Promise.reject(data)
    }
  },
  async (err) => {
    const { statusCode, message: msg } = err.response.data
    if (err.config.headers['isLoading'] !== false) {
      hideLoading()
    }
    if (statusCode === 401) {
      localStorage.clear()
      sessionStorage.clear()
      Modal.error({
        centered: true,
        content: '登录失效，请重新登录',
        keyboard: false,
        title: '提示',
        okText: '确定',
        okButtonProps: {
          href: '/#/login'
        }
      })
    } else {
      await message.warning(msg)
    }
    return Promise.reject(err)
  }
)

export default Axios
