import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { criarAcessoSupabase } from './acesso/acessoSupabase'
import { criarCadastrosSupabase } from './cadastros/cadastrosSupabase'
import { supabase } from './lib/supabase'

// Lida antes de o supabase-js tratar o retorno do Google, que pode trazer o motivo da recusa.
const urlDeChegada = window.location.href
const acesso = criarAcessoSupabase(supabase, urlDeChegada)
const cadastros = criarCadastrosSupabase(supabase)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App acesso={acesso} cadastros={cadastros} />
  </StrictMode>,
)
