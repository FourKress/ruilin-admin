import ReactDOM from 'react-dom/client'
import { Spin } from 'antd'

export const createLoading = () => {
  const dom = document.createElement('div')
  dom.setAttribute('class', 'loading')
  document.body.appendChild(dom)
  return ReactDOM.createRoot(dom).render(<Spin tip="拼命加载中..." size="large" />)
}

export const closeLoading = () => {
  const loading = document.querySelector('.loading')
  loading && document.body.removeChild(loading)
}
