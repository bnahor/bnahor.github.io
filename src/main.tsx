import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const redirect = new URLSearchParams(window.location.search).get('redirect');
if (redirect) {
  const next = decodeURIComponent(redirect);
  window.history.replaceState(null, '', next);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
