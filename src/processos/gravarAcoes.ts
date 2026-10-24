import { textoDaFalha } from '../acesso/falhasDeGravacao'
import { CadastroInexistente } from '../cadastros/cadastroInexistente'
import { FRASE_DO_REGISTRO_QUE_SUMIU } from '../revisoes/frasesDeRevisao'
import type { DadosDaAprovacao, DadosDaEdicaoDaRevisao, ModuloDeRevisoes } from '../revisoes/tipos'

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
