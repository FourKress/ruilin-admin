import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'

import App from './App.tsx'

import './assets/styles/global.scss'
import 'virtual:uno.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <HashRouter>
    <App />
  </HashRouter>
)
