import { textoDaFalha } from '../acesso/falhasDeGravacao'
import { CadastroInexistente } from '../cadastros/cadastroInexistente'
import { FRASE_DO_REGISTRO_QUE_SUMIU } from '../revisoes/frasesDeRevisao'
import type { DadosDaAprovacao, DadosDaEdicaoDaRevisao, DadosDaRevisao, ModuloDeRevisoes } from '../revisoes/tipos'
import type { EtapaDoCaminho, ModuloDeProcessos } from './tipos'

export type AcaoDeAvanco = 'concluir' | 'dispensar' | 'realizada' | 'voltar'
export type AcaoDeTexto = 'dispensar' | 'realizada'

/**
 * Concluir, Dispensar ou Realizada anteriormente com etapa pendente depois, e Voltar: a janela que escolhe o
 * responsável. `proxima` é a etapa que ganha o responsável: a que o avanço inicia ou, no Voltar, a própria etapa reaberta.
 * Sem etapa pendente depois (`null`), só a conclusão da Revisão interna, da Aprovação e da Publicação abre a janela, sem escolher ninguém.
 */
export type PedidoDeAvanco = { acao: AcaoDeAvanco; etapa: EtapaDoCaminho; proxima: EtapaDoCaminho | null }

/** Dispensar e Realizada anteriormente sem etapa pendente depois: a janela que pede só a nota. */
export type PedidoDeTexto = { acao: AcaoDeTexto; etapa: EtapaDoCaminho }

/**
 * O avanço (ou a volta) numa chamada só: o responsável (null: ninguém) vai junto da mudança da etapa, e a escolha de
 * publicação (null sem a pergunta) junto de concluir e de registrar como realizada anteriormente.
 */
export function gravarAvanco(
  processos: ModuloDeProcessos, acao: AcaoDeAvanco, etapa: EtapaDoCaminho, texto: string, responsavelId: string | null,
  vaiParaPublicacao: boolean | null = null,
): Promise<void> {
  if (acao === 'concluir') return processos.concluirEtapa(etapa.id, responsavelId, vaiParaPublicacao)
  if (acao === 'dispensar') return processos.dispensarEtapa(etapa.id, texto, responsavelId)
  if (acao === 'voltar') return processos.voltarParaEtapa(etapa.id, texto, responsavelId)
  return processos.registrarRealizadaAnteriormente(etapa.id, texto, responsavelId, vaiParaPublicacao)
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

/** A aprovação, a escolha de publicação e a conclusão da Aprovação pelo setor juntas; a janela espera. */
export function gravarAprovacao(
  revisoes: ModuloDeRevisoes, etapa: EtapaDoCaminho, dados: DadosDaAprovacao, responsavelId: string | null, aoSumir: () => void,
  vaiParaPublicacao: boolean | null = null,
): Promise<string | null> {
  return esperarAGravacao(() => revisoes.concluirAprovacao(etapa.id, dados, responsavelId, vaiParaPublicacao), aoSumir)
}

// A edição também espera a gravação. O registro que sumiu (a aprovação desfeita por uma volta de outra pessoa) não é "o
// processo sumiu": a janela diz que o registro não existe mais, em vez de esconder o processo inteiro.
async function esperarAEdicao(gravar: () => Promise<void>): Promise<string | null> {
  try {
    await gravar()
  } catch (erro) {
    return erro instanceof CadastroInexistente ? FRASE_DO_REGISTRO_QUE_SUMIU : textoDaFalha(erro)
  }
  return null
}

/** A edição do escopo e do comentário de uma revisão; a janela espera: a frase da falha ou null quando gravou. */
export function gravarEdicaoDaRevisao(
  revisoes: Pick<ModuloDeRevisoes, 'editarRevisao'>, id: string, dados: DadosDaEdicaoDaRevisao,
): Promise<string | null> {
  return esperarAEdicao(() => revisoes.editarRevisao(id, dados))
}

/** A edição do número, do link e da data da aprovação; a janela espera: a frase da falha ou null quando gravou. */
export function gravarEdicaoDaAprovacao(
  revisoes: Pick<ModuloDeRevisoes, 'editarAprovacao'>, id: string, dados: DadosDaAprovacao,
): Promise<string | null> {
  return esperarAEdicao(() => revisoes.editarAprovacao(id, dados))
}
