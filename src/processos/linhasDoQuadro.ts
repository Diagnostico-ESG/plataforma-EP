import type { ColunaDoQuadro } from './colunasDoQuadro'
import type { ProcessoDaLista, SetorDoQuadro } from './tipos'

/** As linhas do Quadro por etapa: por setor ou por responsável. */
export type TipoDeLinha = 'setor' | 'responsavel'

export type LinhaDoQuadro = {
  chave: string
  /** A sigla do setor, o nome da pessoa ou "Sem responsável". */
  titulo: string
  /** Só por setor: o nome do setor, para o selo. */
  nome?: string
  /** Só por responsável: a própria pessoa, que a tela chama de "Você". */
  voce?: boolean
  /** O setor ou a pessoa da linha foi desativado. */
  inativo?: boolean
}

export const CHAVE_SEM_RESPONSAVEL = 'sem-responsavel'

/** A linha em que o processo está: o setor dele ou o responsável (ou ninguém). */
export function chaveDaLinha(tipo: TipoDeLinha, processo: ProcessoDaLista): string {
  if (tipo === 'setor') return processo.setorId
  return processo.responsavel?.id ?? CHAVE_SEM_RESPONSAVEL
}

function porTitulo(a: LinhaDoQuadro, b: LinhaDoQuadro): number {
  return a.titulo.localeCompare(b.titulo, 'pt-BR', { sensitivity: 'base' })
}

function linhasPorSetor(processos: ProcessoDaLista[], setores: SetorDoQuadro[]): LinhaDoQuadro[] {
  const comCartao = new Set(processos.map((processo) => processo.setorId))
  return setores
    .filter((setor) => comCartao.has(setor.id))
    .map((setor) => ({ chave: setor.id, titulo: setor.sigla, nome: setor.nome, inativo: !setor.ativo }))
    .sort(porTitulo)
}

function linhasPorResponsavel(processos: ProcessoDaLista[], usuarioId: string): LinhaDoQuadro[] {
  const pessoas = new Map<string, LinhaDoQuadro>()
  for (const { responsavel, cartao } of processos) {
    if (!responsavel || pessoas.has(responsavel.id)) continue
    pessoas.set(responsavel.id, {
      chave: responsavel.id, titulo: responsavel.nome, voce: responsavel.id === usuarioId, inativo: cartao?.responsavelAtivo === false,
    })
  }
  const ordenadas = [...pessoas.values()].sort(porTitulo)
  const semResponsavel = processos.some((processo) => processo.responsavel === null)
  return semResponsavel ? [...ordenadas, { chave: CHAVE_SEM_RESPONSAVEL, titulo: 'Sem responsável' }] : ordenadas
}

/**
 * As linhas que têm algum cartão nas colunas dadas (já filtradas): por setor em ordem de sigla; por responsável em ordem de
 * nome, com "Sem responsável" por último.
 */
export function linhasDoQuadro(tipo: TipoDeLinha, colunas: ColunaDoQuadro[], setores: SetorDoQuadro[], usuarioId: string): LinhaDoQuadro[] {
  const processos = colunas.flatMap((coluna) => coluna.processos)
  return tipo === 'setor' ? linhasPorSetor(processos, setores) : linhasPorResponsavel(processos, usuarioId)
}
