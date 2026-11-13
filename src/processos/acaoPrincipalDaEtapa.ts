import { rotuloDoRelatorio } from '../versoes/rotuloDoRelatorio'
import { CODIGO_DA_APROVACAO, CODIGO_DA_REVISAO_DO_RELATORIO, CODIGO_DA_REVISAO_INTERNA } from './codigosDasEtapas'
import { acaoDaPublicacao } from './publicacao'
import type { ProcessoLido } from './tipos'

/** O botão azul do cabeçalho do verso (spec, "Verso enxuto"): o registro que a etapa atual pede. */
export type AcaoPrincipal = 'registrar_revisao' | 'registrar_aprovacao' | 'registrar_publicacao'

/** As duas etapas de revisão (ADR 0046): a Revisão do fluxograma e a Revisão do relatório. */
export function ehEtapaDeRevisao(codigo: string | undefined): codigo is 'revisao_interna' | 'revisao_relatorio' {
  return codigo === CODIGO_DA_REVISAO_INTERNA || codigo === CODIGO_DA_REVISAO_DO_RELATORIO
}

/**
 * O que o Agora diz no lugar do [Registrar revisão] quando não há o que revisar: na Revisão do fluxograma, sem versão; na do
 * relatório, sem relatório numerado. Null fora das duas etapas ou com o que revisar.
 */
export function semOQueRevisar(processo: Pick<ProcessoLido, 'etapaAtual' | 'ultimaVersao' | 'ultimoRelatorio'>): string | null {
  const etapa = processo.etapaAtual?.codigo
  if (etapa === CODIGO_DA_REVISAO_INTERNA && processo.ultimaVersao === null) return 'Sem versão para revisar.'
  if (etapa === CODIGO_DA_REVISAO_DO_RELATORIO && !processo.ultimoRelatorio) return 'Sem relatório para revisar.'
  return null
}

/**
 * O que o Agora diz que se revisa, antes do registro (spec, "Telas"): na Revisão do fluxograma, a versão mais recente; na
 * do relatório, o relatório mais recente. Null fora das duas etapas ou sem o que revisar.
 */
export function oQueSeRevisa(processo: Pick<ProcessoLido, 'etapaAtual' | 'ultimaVersao' | 'ultimoRelatorio'>): string | null {
  const etapa = processo.etapaAtual?.codigo
  if (etapa === CODIGO_DA_REVISAO_INTERNA && processo.ultimaVersao) return `A revisar: V${processo.ultimaVersao.numero}`
  if (etapa === CODIGO_DA_REVISAO_DO_RELATORIO && processo.ultimoRelatorio) return `A revisar: ${rotuloDoRelatorio(processo.ultimoRelatorio.numero)}`
  return null
}

/**
 * A ação principal da etapa atual, ou nenhuma. Quem só consulta e o processo parado não registram. Nas duas revisões ela
 * some quando a passagem já tem revisão (o [Editar revisão] fica no Agora) ou não há o que revisar; a aprovação pode ser
 * registrada de novo.
 */
export function acaoPrincipalDaEtapa(processo: ProcessoLido, podeAlterar: boolean, temRevisaoDaPassagem: boolean): AcaoPrincipal | null {
  if (!podeAlterar || processo.situacao === 'suspenso' || processo.situacao === 'cancelado') return null
  const etapa = processo.etapaAtual?.codigo
  if (ehEtapaDeRevisao(etapa)) return temRevisaoDaPassagem || semOQueRevisar(processo) ? null : 'registrar_revisao'
  if (etapa === CODIGO_DA_APROVACAO) return 'registrar_aprovacao'
  return acaoDaPublicacao(processo) === 'registrar' ? 'registrar_publicacao' : null
}
