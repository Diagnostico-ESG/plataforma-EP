import { textoDaFalha } from '../acesso/falhasDeGravacao'
import { CadastroInexistente } from '../cadastros/cadastroInexistente'
import { FRASE_DO_REGISTRO_QUE_SUMIU } from '../revisoes/frasesDeRevisao'
import type { DadosDaAprovacao, DadosDaEdicaoDaRevisao, DadosDaRevisao, ModuloDeRevisoes } from '../revisoes/tipos'
import type { DadosDaChegada, ModuloDeProcessos } from './tipos'

// A edição espera a gravação. O registro que sumiu (a aprovação desfeita por outra pessoa) não é "o processo sumiu": a
// janela diz que o registro não existe mais, em vez de esconder o processo inteiro.
async function esperarAEdicao(gravar: () => Promise<void>): Promise<string | null> {
  try {
    await gravar()
  } catch (erro) {
    return erro instanceof CadastroInexistente ? FRASE_DO_REGISTRO_QUE_SUMIU : textoDaFalha(erro)
  }
  return null
}

/** Registrar a revisão da passagem; a janela espera: a frase da falha ou null quando gravou. */
export function gravarRevisao(
  revisoes: Pick<ModuloDeRevisoes, 'registrarRevisao'>, processoId: string, dados: DadosDaRevisao,
): Promise<string | null> {
  return esperarAEdicao(() => revisoes.registrarRevisao(processoId, dados))
}

/** Registrar a aprovação (ela toma o lugar da anterior); a janela espera: a frase da falha ou null quando gravou. */
export function gravarAprovacao(
  revisoes: Pick<ModuloDeRevisoes, 'registrarAprovacao'>, processoId: string, dados: DadosDaAprovacao,
): Promise<string | null> {
  return esperarAEdicao(() => revisoes.registrarAprovacao(processoId, dados))
}

/** A edição do resultado, do escopo e do comentário de uma revisão; a janela espera: a frase da falha ou null quando gravou. */
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

/** Levar o processo a Concluídos pela janela da chegada; a janela espera: a frase da falha ou null quando gravou. */
export function gravarChegada(
  processos: Pick<ModuloDeProcessos, 'moverProcesso'>, id: string, etapaId: string, dados: DadosDaChegada,
): Promise<string | null> {
  return esperarAEdicao(() => processos.moverProcesso(id, etapaId, dados))
}

/** Registrar ou corrigir a publicação pela janela; a janela espera: a frase da falha ou null quando gravou. */
export function gravarPublicacao(
  processos: Pick<ModuloDeProcessos, 'registrarPublicacao'>, id: string, data: string, link: string | null,
): Promise<string | null> {
  return esperarAEdicao(() => processos.registrarPublicacao(id, data, link))
}
