import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/Auth.css'
import App from './App.jsx'
import { initialiserSession } from './auth.js'

// Reprend la session (cookie de rafraîchissement) avant le premier rendu,
// pour que les routes protégées voient l'utilisateur déjà connecté.
initialiserSession().finally(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
