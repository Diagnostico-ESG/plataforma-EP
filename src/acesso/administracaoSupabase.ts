import type { ClienteSupabase } from '../lib/supabase'
import type { Database } from '../types/database'
import { type ErroDoBanco, falhaDeGravacao } from './falhasDeGravacao'
import type { EstadoRegistrado, EventoDoHistorico, LinhaDeUsuario, ModuloDeAcesso, Perfil } from './tipos'

type FuncoesDeAdministracao = Pick<ModuloDeAcesso,
  'listarUsuarios' | 'autorizarEmail' | 'mudarPerfilDaAutorizacao' | 'excluirAutorizacao'
  | 'mudarPerfilDoUsuario' | 'desativarUsuario' | 'reativarUsuario' | 'corrigirNome' | 'listarHistorico'>
type EventoDoBanco = {
  id: number; ocorrido_em: string; acao: string; entidade: string; entidade_ref: string
  detalhes: { antes: EstadoRegistrado; depois: EstadoRegistrado }; autor: { nome: string } | null
}
type UsuarioDoBanco = {
  id: string; nome: string; foto_url: string | null; perfil: Perfil; ativo: boolean
  usuarios_emails: { email: string } | null
}
type AlteracaoDoUsuario = Pick<Database['public']['Tables']['usuarios']['Update'], 'nome' | 'perfil' | 'ativo'>
type RespostaDeAlteracao = { data: unknown[] | null; error: ErroDoBanco | null }

export function criarAdministracaoSupabase(cliente: ClienteSupabase): FuncoesDeAdministracao {
  return {
    listarUsuarios: () => listarUsuarios(cliente),
    autorizarEmail: (email, perfil) => autorizarEmail(cliente, email, perfil),
    mudarPerfilDaAutorizacao: async (email, perfil) => conferirAlteracao(
      await cliente.from('autorizacoes').update({ perfil }).eq('email', email).select('email'), naoAchada(email)),
    excluirAutorizacao: async (email) => conferirAlteracao(
      await cliente.from('autorizacoes').delete().eq('email', email).select('email'), naoAchada(email)),
    mudarPerfilDoUsuario: (id, perfil) => alterarUsuario(cliente, id, { perfil }),
    desativarUsuario: (id) => alterarUsuario(cliente, id, { ativo: false }),
    reativarUsuario: (id) => alterarUsuario(cliente, id, { ativo: true }),
    corrigirNome: (id, nome) => alterarUsuario(cliente, id, { nome }),
    listarHistorico: () => listarHistorico(cliente),
  }
}

// O alvo de um evento de usuário é o id; a tela mostra o nome atual (o administrador lê todos os usuários).
async function listarHistorico(cliente: ClienteSupabase): Promise<EventoDoHistorico[]> {
  const [eventos, usuarios] = await Promise.all([
    cliente.from('eventos').select('id, ocorrido_em, acao, entidade, entidade_ref, detalhes, autor:usuarios(nome)')
      .order('ocorrido_em', { ascending: false }).order('id', { ascending: false }),
    cliente.from('usuarios').select('id, nome'),
  ])
  if (eventos.error) throw new Error(`Falha ao ler o histórico: ${eventos.error.message}`)
  const nomes = new Map((usuarios.data ?? []).map(({ id, nome }) => [id, nome]))
  return (eventos.data as unknown as EventoDoBanco[]).map((evento) => ({
    id: evento.id, ocorridoEm: evento.ocorrido_em, autor: evento.autor?.nome ?? null,
    acao: evento.acao, entidade: evento.entidade, antes: evento.detalhes.antes, depois: evento.detalhes.depois,
    alvo: evento.entidade === 'usuario' ? nomes.get(evento.entidade_ref) ?? evento.entidade_ref : evento.entidade_ref,
  }))
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
  if (error) throw falhaDeGravacao(error)
}

function naoAchada(email: string): string {
  return `a autorização de ${email} não foi encontrada (pode já ter sido usada no primeiro acesso)`
}

async function alterarUsuario(cliente: ClienteSupabase, id: string, alteracao: AlteracaoDoUsuario): Promise<void> {
  const resposta = await cliente.from('usuarios').update(alteracao).eq('id', id).select('id')
  conferirAlteracao(resposta, `o usuário ${id} não foi encontrado ou seu perfil não permite alterá-lo`)
}

// A RLS não acusa erro ao filtrar: nenhuma linha devolvida quer dizer que nada mudou.
function conferirAlteracao({ data, error }: RespostaDeAlteracao, naoEncontrado: string): void {
  if (error) throw falhaDeGravacao(error)
  if (!data?.length) throw new Error(naoEncontrado)
}
