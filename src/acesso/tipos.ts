import type { Database } from '../types/database'

export type Perfil = Database['public']['Enums']['perfil']
export type SessaoAtual = { usuarioId: string; email: string }
export type UsuarioAtual = { id: string; nome: string; fotoUrl: string | null; perfil: Perfil; ativo: boolean }
export type MotivoDeRecusa = 'fora_do_dominio' | 'sem_autorizacao' | 'inativo'
export type RecusaDeEntrada = { motivo: MotivoDeRecusa; email: string }

export type EstadoDaEntrada =
  | { tipo: 'verificando' }
  | { tipo: 'fora'; recusa: RecusaDeEntrada | null }
  | { tipo: 'falha' }
  | { tipo: 'dentro'; usuario: UsuarioAtual }

/** Único ponto por onde a interface fala com o Auth e com o banco no login. */
export type ModuloDeAcesso = {
  recusaNaChegada(): RecusaDeEntrada | null
  sessaoAtual(): Promise<SessaoAtual | null>
  entrarComGoogle(): Promise<void>
  sair(): Promise<void>
  lerProprioUsuario(id: string): Promise<UsuarioAtual | null>
}
