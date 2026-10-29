import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { CODIGO_CONCLUIDOS } from './codigosDasEtapas'
import { FRASE_DA_PUBLICACAO_FORA_DA_ETAPA } from './frasesDePublicacao'
import { publicacaoPelaData } from './movimentoFalso'
import { conferirProcessoEmAndamento } from './situacaoFalso'
import type { ProcessoLido } from './tipos'

const ETAPAS_DA_PUBLICACAO = ['publicacao', CODIGO_CONCLUIDOS]

/**
 * Como registrar_publicacao do banco: o parado é recusado; a etapa tem de ser a Publicação ou Concluídos; a data não é
 * futura e o link é http ou https. O processo fica onde está.
 */
export function registrarPublicacao(processo: ProcessoLido, data: string, link: string | null, hoje: string): ProcessoLido {
  conferirProcessoEmAndamento(processo)
  if (!ETAPAS_DA_PUBLICACAO.includes(processo.etapaAtual?.codigo ?? '')) throw new TravaDoBanco(FRASE_DA_PUBLICACAO_FORA_DA_ETAPA)
  return { ...processo, ...publicacaoPelaData(data, link, hoje) }
}
