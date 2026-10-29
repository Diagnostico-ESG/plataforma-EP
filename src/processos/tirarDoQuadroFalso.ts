import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { CODIGO_CONCLUIDOS } from './codigosDasEtapas'
import { FRASE_DE_JA_FORA_DO_QUADRO, FRASE_DE_TIRAR_SO_CONCLUIDO, FRASE_DE_VOLTAR_SO_CONCLUIDO } from './frasesDoQuadro'
import type { ProcessoLido } from './tipos'

// As regras de tirar_do_quadro e voltar_ao_quadro do banco, para a implementação falsa.
const emConcluidos = (processo: ProcessoLido): boolean => processo.situacao === 'concluido' && processo.etapaAtual?.codigo === CODIGO_CONCLUIDOS

/** Como tirar_do_quadro: só o concluído que ainda está no Quadro. */
export function tirarDoQuadro(processo: ProcessoLido, agora: string): ProcessoLido {
  if (!emConcluidos(processo)) throw new TravaDoBanco(FRASE_DE_TIRAR_SO_CONCLUIDO)
  if (processo.noQuadro === false) throw new TravaDoBanco(FRASE_DE_JA_FORA_DO_QUADRO)
  return { ...processo, tiradoDoQuadroEm: agora, noQuadro: false }
}

/** Como voltar_ao_quadro (o Desfazer): só o concluído; no que já está no Quadro não muda nada. */
export function voltarAoQuadro(processo: ProcessoLido): ProcessoLido {
  if (!emConcluidos(processo)) throw new TravaDoBanco(FRASE_DE_VOLTAR_SO_CONCLUIDO)
  return { ...processo, tiradoDoQuadroEm: null, noQuadro: true }
}
