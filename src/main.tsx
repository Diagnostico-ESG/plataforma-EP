import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { criarAcessoSupabase } from './acesso/acessoSupabase'
import { supabase } from './lib/supabase'

// Lida antes de o supabase-js tratar o retorno do Google, que pode trazer o motivo da recusa.
const urlDeChegada = window.location.href
const acesso = criarAcessoSupabase(supabase, urlDeChegada)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App acesso={acesso} />
  </StrictMode>,
)
