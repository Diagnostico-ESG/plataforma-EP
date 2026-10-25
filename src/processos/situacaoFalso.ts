import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { CODIGO_CONCLUIDOS } from './codigosDasEtapas'
import { fraseDeSituacaoInvalida, fraseDoProcessoParado } from './frasesDeSituacao'
import type { ProcessoLido } from './tipos'

type SituacaoGuardada = 'em_andamento' | 'suspenso' | 'cancelado'

// As transições da spec (Regras de estado), como o gatilho do banco as confere.
const TRANSICOES: Record<SituacaoGuardada, SituacaoGuardada[]> = {
  em_andamento: ['suspenso', 'cancelado'], suspenso: ['em_andamento', 'cancelado'], cancelado: ['em_andamento'],
}

// "Concluído" é calculado, não guardado: para o banco o processo concluído está em andamento.
function situacaoGuardada(processo: ProcessoLido): SituacaoGuardada {
  return processo.situacao === 'concluido' ? 'em_andamento' : processo.situacao
}

/** Como as funções do banco: motivo obrigatório, transição da spec; retomar limpa o motivo e, em Concluídos, volta a ser concluído. */
export function mudarSituacao(processo: ProcessoLido, nova: SituacaoGuardada, motivo: string): ProcessoLido {
  const texto = motivo.trim()
  if (texto === '') throw new TravaDoBanco('O motivo é obrigatório.')
  const atual = situacaoGuardada(processo)
  if (!TRANSICOES[atual].includes(nova)) throw new TravaDoBanco(fraseDeSituacaoInvalida(atual, nova))
  const emConcluidos = processo.etapaAtual?.codigo === CODIGO_CONCLUIDOS
  const situacao = nova === 'em_andamento' && emConcluidos ? 'concluido' : nova
  return { ...processo, situacao, motivoDaSituacao: nova === 'em_andamento' ? null : texto }
}

/** Processo suspenso ou cancelado congela a etapa, a etiqueta e o responsável: o banco recusa qualquer mudança. */
export function conferirProcessoEmAndamento(processo: ProcessoLido): void {
  if (situacaoGuardada(processo) !== 'em_andamento') throw new TravaDoBanco(fraseDoProcessoParado(processo.situacao))
}
