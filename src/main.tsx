import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'

import AutoScrollTop from '@/components/AutoScrollTop.ts'

import App from './App.tsx'

import './assets/styles/global.scss'
import 'virtual:uno.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <HashRouter>
    <AutoScrollTop>
      <App />
    </AutoScrollTop>
  </HashRouter>
)
