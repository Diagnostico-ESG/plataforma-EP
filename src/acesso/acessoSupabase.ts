import type { ClienteSupabase } from '../lib/supabase'
import { criarAdministracaoSupabase } from './administracaoSupabase'
import { lerRecusaDaUrl } from './motivos'
import type { ModuloDeAcesso, SessaoAtual, UsuarioAtual } from './tipos'

const DOMINIO_INSTITUCIONAL = 'ccivil.pr.gov.br'

// urlDeChegada é lida no main.tsx antes de o supabase-js tratar o endereço de retorno do Google.
export function criarAcessoSupabase(cliente: ClienteSupabase, urlDeChegada: string): ModuloDeAcesso {
  const recusa = lerRecusaDaUrl(urlDeChegada)
  return {
    recusaNaChegada: () => recusa,
    sessaoAtual: () => lerSessao(cliente),
    entrarComGoogle: () => entrarComGoogle(cliente),
    sair: () => sair(cliente),
    lerProprioUsuario: (id) => lerUsuario(cliente, id),
    ...criarAdministracaoSupabase(cliente),
  }
}

async function lerSessao(cliente: ClienteSupabase): Promise<SessaoAtual | null> {
  const { data, error } = await cliente.auth.getSession()
  if (error) throw new Error(`Falha ao ler a sessão: ${error.message}`)
  const usuario = data.session?.user
  return usuario ? { usuarioId: usuario.id, email: usuario.email ?? '' } : null
}

async function entrarComGoogle(cliente: ClienteSupabase): Promise<void> {
  const { error } = await cliente.auth.signInWithOAuth({
    provider: 'google',
    // hd só sugere a conta institucional na tela do Google; quem barra é o banco.
    options: { redirectTo: window.location.origin, queryParams: { hd: DOMINIO_INSTITUCIONAL, prompt: 'select_account' } },
  })
  if (error) throw new Error(`Falha ao abrir a entrada do Google: ${error.message}`)
}

async function sair(cliente: ClienteSupabase): Promise<void> {
  const { error } = await cliente.auth.signOut()
  if (error) throw new Error(`Falha ao sair: ${error.message}`)
}

async function lerUsuario(cliente: ClienteSupabase, id: string): Promise<UsuarioAtual | null> {
  const { data, error } = await cliente.from('usuarios').select('id, nome, foto_url, perfil, ativo').eq('id', id).maybeSingle()
  if (error) throw new Error(`Falha ao ler o usuário ${id}: ${error.message}`)
  if (!data) return null
  return { id: data.id, nome: data.nome, fotoUrl: data.foto_url, perfil: data.perfil, ativo: data.ativo }
}
