import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/pinyon-script/latin-400.css'
import './index.css'
import App from './App.tsx'

// The first version of Auria (plain JavaScript) used caches named "auria-v1", "auria-v2"...
// The new service worker doesn't know them, so we delete them here once
if ('caches' in window) {
  caches.keys().then((keys) =>
    keys.filter((k) => /^auria-v\d+$/.test(k)).forEach((k) => caches.delete(k)),
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
