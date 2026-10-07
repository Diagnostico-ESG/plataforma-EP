import type { Database } from '../types/database'

export type Perfil = Database['public']['Enums']['perfil']
export type SessaoAtual = { usuarioId: string; email: string }
export type UsuarioAtual = { id: string; nome: string; fotoUrl: string | null; perfil: Perfil; ativo: boolean }
export type SituacaoDoUsuario = 'ativo' | 'inativo' | 'aguardando'
/** Uma linha de Administração > Usuários: um usuário que já entrou ou uma autorização aguardando primeiro acesso. */
export type LinhaDeUsuario = {
  chave: string
  nome: string | null
  email: string
  fotoUrl: string | null
  perfil: Perfil
  situacao: SituacaoDoUsuario
}
export type MotivoDeRecusa = 'fora_do_dominio' | 'sem_autorizacao' | 'inativo' | 'desconhecido'
export type RecusaDeEntrada = { motivo: MotivoDeRecusa; email: string }

export type EstadoDaEntrada =
  | { tipo: 'verificando' }
  | { tipo: 'fora'; recusa: RecusaDeEntrada | null }
  | { tipo: 'falha' }
  | { tipo: 'dentro'; usuario: UsuarioAtual }

/**
 * Único ponto por onde a interface fala com o Auth e com o banco no login e na administração de usuários.
 * Falha de gravação chega como Error cuja mensagem é o motivo em português.
 */
export type ModuloDeAcesso = {
  recusaNaChegada(): RecusaDeEntrada | null
  sessaoAtual(): Promise<SessaoAtual | null>
  entrarComGoogle(): Promise<void>
  sair(): Promise<void>
  lerProprioUsuario(id: string): Promise<UsuarioAtual | null>
  listarUsuarios(): Promise<LinhaDeUsuario[]>
  autorizarEmail(email: string, perfil: Perfil): Promise<void>
  mudarPerfilDaAutorizacao(email: string, perfil: Perfil): Promise<void>
  excluirAutorizacao(email: string): Promise<void>
}
