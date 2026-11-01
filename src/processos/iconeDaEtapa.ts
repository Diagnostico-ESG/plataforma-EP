import type { NomeIcone } from '../components/Icone'
import {
  CODIGO_CONCLUIDOS, CODIGO_DA_APROVACAO, CODIGO_DA_MODELAGEM_PILOTO, CODIGO_DA_PUBLICACAO, CODIGO_DA_REVISAO_INTERNA,
  CODIGO_DA_TECNICA, CODIGO_DA_VALIDACAO, CODIGO_NAO_INICIADOS,
} from './codigosDasEtapas'

const ICONES_DAS_ETAPAS: Record<string, NomeIcone> = {
  [CODIGO_NAO_INICIADOS]: 'etapaNaoIniciados', [CODIGO_DA_MODELAGEM_PILOTO]: 'etapaModelagem', [CODIGO_DA_TECNICA]: 'etapaRelatorio',
  [CODIGO_DA_REVISAO_INTERNA]: 'etapaRevisao', [CODIGO_DA_VALIDACAO]: 'etapaValidacao', [CODIGO_DA_APROVACAO]: 'etapaAprovacao',
  [CODIGO_DA_PUBLICACAO]: 'etapaPublicacao', [CODIGO_CONCLUIDOS]: 'etapaConcluidos',
}

/** O ícone da etapa pelo código fixo dela; a etapa que o Administrador cria no Catálogo recebe o genérico. */
export function iconeDaEtapa(codigo: string): NomeIcone {
  return ICONES_DAS_ETAPAS[codigo] ?? 'etapaGenerica'
}
