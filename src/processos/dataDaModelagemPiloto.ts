import { CODIGO_DA_MODELAGEM_PILOTO } from './codigosDasEtapas'
import type { ProcessoLido } from './tipos'

/**
 * Quem pode registrar, alterar e apagar a data da modelagem piloto (ADR 0035): Administrador ou Integrante, com o processo em
 * andamento ou concluído e na Modelagem piloto ou numa etapa depois dela no catálogo. Fora disso a data é só leitura.
 */
export function podeRegistrarDataDaModelagem(
  { situacao, etapaAtual, etapasDoVerso }: Pick<ProcessoLido, 'situacao' | 'etapaAtual' | 'etapasDoVerso'>, podeAlterar: boolean,
): boolean {
  if (!podeAlterar || !etapaAtual) return false
  if (situacao !== 'em_andamento' && situacao !== 'concluido') return false
  const modelagem = etapasDoVerso.find((etapa) => etapa.codigo === CODIGO_DA_MODELAGEM_PILOTO)
  return modelagem !== undefined && etapaAtual.ordem >= modelagem.ordem
}
