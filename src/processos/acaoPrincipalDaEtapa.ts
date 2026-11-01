import { CODIGO_DA_APROVACAO, CODIGO_DA_REVISAO_INTERNA } from './codigosDasEtapas'
import { acaoDaPublicacao } from './publicacao'
import type { ProcessoLido } from './tipos'

/** O botão azul do cabeçalho do verso (spec, "Verso enxuto"): o registro que a etapa atual pede. */
export type AcaoPrincipal = 'registrar_revisao' | 'registrar_aprovacao' | 'registrar_publicacao'

/**
 * A ação principal da etapa atual, ou nenhuma. Quem só consulta e o processo parado não registram. Na Revisão interna ela
 * some quando a passagem já tem revisão (o [Editar revisão] fica no Agora); a aprovação pode ser registrada de novo.
 */
export function acaoPrincipalDaEtapa(processo: ProcessoLido, podeAlterar: boolean, temRevisaoDaPassagem: boolean): AcaoPrincipal | null {
  if (!podeAlterar || processo.situacao === 'suspenso' || processo.situacao === 'cancelado') return null
  const etapa = processo.etapaAtual?.codigo
  if (etapa === CODIGO_DA_REVISAO_INTERNA) return temRevisaoDaPassagem ? null : 'registrar_revisao'
  if (etapa === CODIGO_DA_APROVACAO) return 'registrar_aprovacao'
  return acaoDaPublicacao(processo) === 'registrar' ? 'registrar_publicacao' : null
}
