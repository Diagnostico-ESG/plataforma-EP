import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { criarAcessoSupabase } from './acesso/acessoSupabase'
import { criarCadastrosSupabase } from './cadastros/cadastrosSupabase'
import { supabase } from './lib/supabase'
import { criarPlanilhasSupabase } from './planilhas/planilhasSupabase'
import { RECUSAS_DOS_PROCESSOS, criarProcessosSupabase } from './processos/processosSupabase'
import { criarRevisoesSupabase } from './revisoes/revisoesSupabase'
import { criarVersoesSupabase } from './versoes/versoesSupabase'

// Lida antes de o supabase-js tratar o retorno do Google, que pode trazer o motivo da recusa.
const urlDeChegada = window.location.href
const acesso = criarAcessoSupabase(supabase, urlDeChegada)
const cadastros = criarCadastrosSupabase(supabase)
const processos = criarProcessosSupabase(supabase)
const versoes = criarVersoesSupabase(supabase)
const revisoes = criarRevisoesSupabase(supabase, RECUSAS_DOS_PROCESSOS)
const planilhas = criarPlanilhasSupabase(supabase)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App acesso={acesso} cadastros={cadastros} processos={processos} versoes={versoes} revisoes={revisoes}
      planilhas={planilhas} />
  </StrictMode>,
)
