import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { LabProvider } from './lib/store.jsx'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LabProvider>
      <App />
    </LabProvider>
  </React.StrictMode>
)
