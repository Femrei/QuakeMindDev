import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/stil/token.css'
import { App } from './App'

createRoot(document.getElementById('kok')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
