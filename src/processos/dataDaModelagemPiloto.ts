import { CODIGO_DA_MODELAGEM_PILOTO } from './codigosDasEtapas'
import type { ProcessoLido } from './tipos'

/** A Data da modelagem piloto aparece no verso da Modelagem piloto em diante (ADR 0042); em Não iniciados, não. */
export function mostraDataDaModelagem({ etapaAtual, etapasDoVerso }: Pick<ProcessoLido, 'etapaAtual' | 'etapasDoVerso'>): boolean {
  if (!etapaAtual) return false
  const modelagem = etapasDoVerso.find((etapa) => etapa.codigo === CODIGO_DA_MODELAGEM_PILOTO)
  return modelagem !== undefined && etapaAtual.ordem >= modelagem.ordem
}

/**
 * Quem pode registrar, alterar e apagar a data da modelagem piloto (ADR 0035): Administrador ou Integrante, com o processo em
 * andamento ou concluído e na Modelagem piloto ou numa etapa depois dela no catálogo. Fora disso a data é só leitura.
 */
export function podeRegistrarDataDaModelagem(
  processo: Pick<ProcessoLido, 'situacao' | 'etapaAtual' | 'etapasDoVerso'>, podeAlterar: boolean,
): boolean {
  if (!podeAlterar || (processo.situacao !== 'em_andamento' && processo.situacao !== 'concluido')) return false
  return mostraDataDaModelagem(processo)
}
