import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'
import { motivoDaFalhaDeGravacao } from './falhasDeGravacao'
import type { LinhaDeUsuario, ModuloDeAcesso, Perfil } from './tipos'

type ClienteSupabase = SupabaseClient<Database>
type FuncoesDeAdministracao = Pick<ModuloDeAcesso,
  'listarUsuarios' | 'autorizarEmail' | 'mudarPerfilDaAutorizacao' | 'excluirAutorizacao'>
type UsuarioDoBanco = {
  id: string; nome: string; foto_url: string | null; perfil: Perfil; ativo: boolean
  usuarios_emails: { email: string } | null
}
type RespostaDeAlteracao = { data: unknown[] | null; error: { message: string; code?: string } | null }

export function criarAdministracaoSupabase(cliente: ClienteSupabase): FuncoesDeAdministracao {
  return {
    listarUsuarios: () => listarUsuarios(cliente),
    autorizarEmail: (email, perfil) => autorizarEmail(cliente, email, perfil),
    mudarPerfilDaAutorizacao: async (email, perfil) =>
      conferirAlteracao(await cliente.from('autorizacoes').update({ perfil }).eq('email', email).select('email'), email),
    excluirAutorizacao: async (email) =>
      conferirAlteracao(await cliente.from('autorizacoes').delete().eq('email', email).select('email'), email),
  }
}

// Aguardando primeiro acesso vêm no topo: são as linhas que pedem ação do administrador.
async function listarUsuarios(cliente: ClienteSupabase): Promise<LinhaDeUsuario[]> {
  const [usuarios, autorizacoes] = await Promise.all([
    cliente.from('usuarios').select('id, nome, foto_url, perfil, ativo, usuarios_emails(email)').order('nome'),
    cliente.from('autorizacoes').select('email, perfil').order('email'),
  ])
  if (usuarios.error) throw new Error(`Falha ao listar os usuários: ${usuarios.error.message}`)
  if (autorizacoes.error) throw new Error(`Falha ao listar as autorizações: ${autorizacoes.error.message}`)
  const aguardando = autorizacoes.data.map(({ email, perfil }): LinhaDeUsuario =>
    ({ chave: email, nome: null, email, fotoUrl: null, perfil, situacao: 'aguardando' }))
  return [...aguardando, ...(usuarios.data as UsuarioDoBanco[]).map(linhaDoUsuario)]
}

function linhaDoUsuario(usuario: UsuarioDoBanco): LinhaDeUsuario {
  return {
    chave: usuario.id, nome: usuario.nome, email: usuario.usuarios_emails?.email ?? '',
    fotoUrl: usuario.foto_url, perfil: usuario.perfil, situacao: usuario.ativo ? 'ativo' : 'inativo',
  }
}

async function autorizarEmail(cliente: ClienteSupabase, email: string, perfil: Perfil): Promise<void> {
  const { error } = await cliente.from('autorizacoes').insert({ email, perfil })
  if (error) throw new Error(motivoDaFalhaDeGravacao(error))
}

// A RLS não acusa erro ao filtrar: nenhuma linha devolvida quer dizer que nada mudou.
function conferirAlteracao({ data, error }: RespostaDeAlteracao, email: string): void {
  if (error) throw new Error(motivoDaFalhaDeGravacao(error))
  if (!data?.length) {
    throw new Error(`a autorização de ${email} não foi encontrada (pode já ter sido usada no primeiro acesso)`)
  }
}
