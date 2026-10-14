import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { recalcularProcesso } from './andamentoFalso'
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

/** Como as funções do banco: motivo obrigatório, transição da spec; retomar limpa o motivo e recalcula o concluído. */
export function mudarSituacao(processo: ProcessoLido, nova: SituacaoGuardada, motivo: string): ProcessoLido {
  const texto = motivo.trim()
  if (texto === '') throw new TravaDoBanco('O motivo é obrigatório.')
  const atual = situacaoGuardada(processo)
  if (!TRANSICOES[atual].includes(nova)) throw new TravaDoBanco(fraseDeSituacaoInvalida(atual, nova))
  const mudado = { ...processo, situacao: nova, motivoDaSituacao: nova === 'em_andamento' ? null : texto }
  return recalcularProcesso(mudado, processo.etapasDoProcesso)
}

/** Processo suspenso ou cancelado congela as etapas dele: o banco recusa qualquer mudança. */
export function conferirProcessoEmAndamento(processo: ProcessoLido): void {
  if (situacaoGuardada(processo) !== 'em_andamento') throw new TravaDoBanco(fraseDoProcessoParado(processo.situacao))
}
