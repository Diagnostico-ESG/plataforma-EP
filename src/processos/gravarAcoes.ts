import type { EtapaDoCaminho, ModuloDeProcessos } from './tipos'

export type AcaoDeAvanco = 'concluir' | 'dispensar' | 'realizada'
export type AcaoDeTexto = 'dispensar' | 'realizada' | 'voltar'

/** Concluir, Dispensar ou Realizada anteriormente com etapa pendente depois: a janela de avanço, com a próxima. */
export type PedidoDeAvanco = { acao: AcaoDeAvanco; etapa: EtapaDoCaminho; proxima: EtapaDoCaminho }

/** Dispensar e Realizada anteriormente sem etapa pendente depois, e Voltar: a janela que pede só a nota ou o motivo. */
export type PedidoDeTexto = { acao: AcaoDeTexto; etapa: EtapaDoCaminho }

/** O avanço numa chamada só: o responsável da próxima (null: ninguém) vai junto da resolução da etapa. */
export function gravarAvanco(
  processos: ModuloDeProcessos, acao: AcaoDeAvanco, etapa: EtapaDoCaminho, nota: string, responsavelId: string | null,
): Promise<void> {
  if (acao === 'concluir') return processos.concluirEtapa(etapa.id, responsavelId)
  if (acao === 'dispensar') return processos.dispensarEtapa(etapa.id, nota, responsavelId)
  return processos.registrarRealizadaAnteriormente(etapa.id, nota, responsavelId)
}

/** Sem etapa pendente depois não há responsável a escolher: o avanço leva null. */
export function gravarTexto(processos: ModuloDeProcessos, { acao, etapa }: PedidoDeTexto, texto: string): Promise<void> {
  if (acao === 'voltar') return processos.voltarParaEtapa(etapa.id, texto, null)
  return gravarAvanco(processos, acao, etapa, texto, null)
}
