import { indiceDaEtapaAtual } from './caminhoDeEtapas'
import type { EtapaDoProcesso, EtapaDoSetor, ProcessoLido, StatusDaEtapa } from './tipos'

const RESOLVIDOS: StatusDaEtapa[] = ['concluida', 'realizada_anteriormente', 'dispensada']

/** Aplica a mudança à etapa do processo e recalcula, como a view, a etapa atual e o "concluído". */
export function mudarEtapaDoProcesso(processo: ProcessoLido, id: string, mudancas: Partial<EtapaDoProcesso>): ProcessoLido {
  if (!processo.etapasDoProcesso.some((etapa) => etapa.id === id)) return processo
  const etapasDoProcesso = processo.etapasDoProcesso.map((etapa) => (etapa.id === id ? { ...etapa, ...mudancas } : etapa))
  const atual = etapasDoProcesso[indiceDaEtapaAtual(etapasDoProcesso)]
  const concluido = etapasDoProcesso.every((etapa) => !etapa.obrigatoria || RESOLVIDOS.includes(etapa.status))
  return {
    ...processo, etapasDoProcesso,
    etapaAtual: atual ? { codigo: atual.codigo, nome: atual.nome, ordem: atual.ordem } : null,
    situacao: concluido && processo.situacao === 'em_andamento' ? 'concluido' : processo.situacao,
  }
}

/** As etapas do setor mudaram: o processo aguarda o setor enquanto alguma delas não estiver resolvida. */
export function atualizarSetorDoProcesso(processo: ProcessoLido, etapasDoSetor: EtapaDoSetor[]): ProcessoLido {
  return { ...processo, etapasDoSetor, aguardandoOSetor: etapasDoSetor.some((etapa) => !RESOLVIDOS.includes(etapa.status)) }
}
