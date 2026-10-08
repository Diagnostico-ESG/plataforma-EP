import { rotuloDoPerfil } from './perfis'
import type { EstadoRegistrado, Perfil } from './tipos'

/** Autor nulo: a mudança foi feita por SQL no painel, como a autorização do primeiro administrador. */
export const AUTOR_DIRETO_NO_BANCO = 'Configuração inicial (direto no banco)'

const TEXTO_DA_ACAO: Record<string, string> = {
  autorizar: 'Autorizou o e-mail',
  excluir_autorizacao: 'Excluiu a autorização',
  primeiro_acesso: 'Primeiro acesso',
  mudar_perfil: 'Mudou o perfil',
  desativar: 'Desativou',
  reativar: 'Reativou',
  corrigir_nome: 'Corrigiu o nome',
}

const ROTULO_DO_CAMPO: Record<string, string> = {
  email: 'E-mail', nome: 'Nome', perfil: 'Perfil', ativo: 'Situação', situacao: 'Situação',
}

// Ação desconhecida (de uma funcionalidade futura) aparece pelo código: sumir do histórico é pior que texto cru.
export function textoDaAcao(acao: string, entidade: string): string {
  if (acao === 'mudar_perfil' && entidade === 'autorizacao') return 'Mudou o perfil da autorização'
  return TEXTO_DA_ACAO[acao] ?? acao
}

export function descreverEstado(estado: EstadoRegistrado): string {
  if (estado === null) return '—'
  return Object.entries(estado)
    .map(([campo, valor]) => `${ROTULO_DO_CAMPO[campo] ?? campo}: ${valorLegivel(campo, valor)}`)
    .join('; ')
}

function valorLegivel(campo: string, valor: string | boolean | null): string {
  if (campo === 'perfil') return rotuloDoPerfil(valor as Perfil)
  if (campo === 'ativo') return valor ? 'Ativo' : 'Inativo'
  if (campo === 'situacao' && valor === 'aguardando') return 'Aguardando primeiro acesso'
  return String(valor ?? '—')
}

const FORMATO_DO_MOMENTO = new Intl.DateTimeFormat('pt-BR',
  { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' })

export function formatarMomento(iso: string): string {
  return FORMATO_DO_MOMENTO.format(new Date(iso))
}
