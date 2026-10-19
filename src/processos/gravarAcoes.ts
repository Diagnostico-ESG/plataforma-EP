import type { EtapaDoCaminho, ModuloDeProcessos } from './tipos'

export type AcaoDeAvanco = 'concluir' | 'dispensar' | 'realizada' | 'voltar'
export type AcaoDeTexto = 'dispensar' | 'realizada'

/**
 * Concluir, Dispensar ou Realizada anteriormente com etapa pendente depois, e Voltar: a janela que escolhe o
 * responsável. `proxima` é a etapa que ganha o responsável: a que o avanço inicia ou, no Voltar, a própria etapa reaberta.
 */
export type PedidoDeAvanco = { acao: AcaoDeAvanco; etapa: EtapaDoCaminho; proxima: EtapaDoCaminho }

/** Dispensar e Realizada anteriormente sem etapa pendente depois: a janela que pede só a nota. */
export type PedidoDeTexto = { acao: AcaoDeTexto; etapa: EtapaDoCaminho }

/** O avanço (ou a volta) numa chamada só: o responsável (null: ninguém) vai junto da mudança da etapa. */
export function gravarAvanco(
  processos: ModuloDeProcessos, acao: AcaoDeAvanco, etapa: EtapaDoCaminho, texto: string, responsavelId: string | null,
): Promise<void> {
  if (acao === 'concluir') return processos.concluirEtapa(etapa.id, responsavelId)
  if (acao === 'dispensar') return processos.dispensarEtapa(etapa.id, texto, responsavelId)
  if (acao === 'voltar') return processos.voltarParaEtapa(etapa.id, texto, responsavelId)
  return processos.registrarRealizadaAnteriormente(etapa.id, texto, responsavelId)
}

/** Sem etapa pendente depois não há responsável a escolher: o avanço leva null. */
export function gravarTexto(processos: ModuloDeProcessos, { acao, etapa }: PedidoDeTexto, texto: string): Promise<void> {
  return gravarAvanco(processos, acao, etapa, texto, null)
}
