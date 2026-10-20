import { textoDaFalha } from '../acesso/falhasDeGravacao'
import { CadastroInexistente } from '../cadastros/cadastroInexistente'
import type { DadosDaAprovacao, DadosDaRevisao, ModuloDeRevisoes } from '../revisoes/tipos'
import type { EtapaDoCaminho, ModuloDeProcessos } from './tipos'

export type AcaoDeAvanco = 'concluir' | 'dispensar' | 'realizada' | 'voltar'
export type AcaoDeTexto = 'dispensar' | 'realizada'

/**
 * Concluir, Dispensar ou Realizada anteriormente com etapa pendente depois, e Voltar: a janela que escolhe o
 * responsável. `proxima` é a etapa que ganha o responsável: a que o avanço inicia ou, no Voltar, a própria etapa reaberta.
 * Sem etapa pendente depois (`null`), só a conclusão da Aprovação abre a janela: ela pede o E-protocolo e não escolhe ninguém.
 */
export type PedidoDeAvanco = { acao: AcaoDeAvanco; etapa: EtapaDoCaminho; proxima: EtapaDoCaminho | null }

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

/**
 * Concluir a Revisão interna ou a Aprovação grava o registro e a conclusão juntos e a janela espera: devolve a frase da
 * falha (a janela fica aberta) ou null quando gravou. Etapa que sumiu (outra pessoa excluiu o processo) não é falha: avisa
 * por `aoSumir`.
 */
async function esperarAGravacao(gravar: () => Promise<void>, aoSumir: () => void): Promise<string | null> {
  try {
    await gravar()
  } catch (erro) {
    if (!(erro instanceof CadastroInexistente)) return textoDaFalha(erro)
    aoSumir()
  }
  return null
}

/** A revisão e a conclusão da Revisão interna juntas; a janela espera. */
export function gravarRevisao(
  revisoes: ModuloDeRevisoes, etapa: EtapaDoCaminho, dados: DadosDaRevisao, responsavelId: string | null, aoSumir: () => void,
): Promise<string | null> {
  return esperarAGravacao(() => revisoes.concluirRevisaoInterna(etapa.id, dados, responsavelId), aoSumir)
}

/** A aprovação e a conclusão da Aprovação pelo setor juntas; a janela espera. */
export function gravarAprovacao(
  revisoes: ModuloDeRevisoes, etapa: EtapaDoCaminho, dados: DadosDaAprovacao, responsavelId: string | null, aoSumir: () => void,
): Promise<string | null> {
  return esperarAGravacao(() => revisoes.concluirAprovacao(etapa.id, dados, responsavelId), aoSumir)
}
