import type { ListaDeProcessos, ProcessoDaLista, SetorDoQuadro, SituacaoDoProcesso } from './tipos'

export type ColunaDoQuadro = {
  chave: string; titulo: string; processos: ProcessoDaLista[]
  /** Só no Quadro por setor: o nome do setor, abaixo da sigla do título. */
  subtitulo?: string
  /** Só no Quadro por setor: o número da cor do setor, para o selo do título. */
  cor?: number
  /** No Quadro por responsável e por setor: a pessoa ou o setor da coluna foi desativado. */
  inativo?: boolean
}

// No Quadro: em andamento, suspensos e concluídos (já em Concluídos); o cancelado e o arquivado ficam só na Lista.
const SITUACOES_NO_QUADRO = new Set<SituacaoDoProcesso>(['em_andamento', 'suspenso', 'concluido'])

function porNome(a: ProcessoDaLista, b: ProcessoDaLista): number {
  return a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })
}

function processosDoQuadro(processos: ProcessoDaLista[]): ProcessoDaLista[] {
  return processos.filter((processo) => SITUACOES_NO_QUADRO.has(processo.situacao) && !processo.arquivadoEm).sort(porNome)
}

/**
 * Uma coluna por etapa ativa, na ordem do catálogo, de Não iniciados a Concluídos, mesmo vazia. Em cada coluna, os
 * processos saem em ordem de nome.
 */
export function colunasDoQuadro({ etapas, processos }: Pick<ListaDeProcessos, 'etapas' | 'processos'>): ColunaDoQuadro[] {
  const noQuadro = processosDoQuadro(processos)
  return etapas
    .filter((etapa) => etapa.ativa)
    .sort((a, b) => a.ordem - b.ordem)
    .map((etapa) => ({
      chave: etapa.codigo, titulo: etapa.nome, processos: noQuadro.filter((processo) => processo.etapaAtual?.codigo === etapa.codigo),
    }))
}

function porTitulo(a: ColunaDoQuadro, b: ColunaDoQuadro): number {
  return a.titulo.localeCompare(b.titulo, 'pt-BR', { sensitivity: 'base' })
}

function agruparPorPessoa(processos: ProcessoDaLista[]): ColunaDoQuadro[] {
  const pessoas = new Map<string, ColunaDoQuadro>()
  for (const processo of processos) {
    const { responsavel } = processo
    if (!responsavel) continue
    const coluna = pessoas.get(responsavel.id)
      ?? { chave: responsavel.id, titulo: responsavel.nome, processos: [], inativo: processo.cartao?.responsavelAtivo === false }
    coluna.processos.push(processo)
    pessoas.set(responsavel.id, coluna)
  }
  return [...pessoas.values()].sort(porTitulo)
}

/**
 * Uma coluna por pessoa que responde por algum cartão (inclusive os de Não iniciados e de Concluídos), em ordem de
 * nome; "Sem responsável" por último.
 */
export function colunasPorResponsavel(processos: ProcessoDaLista[]): ColunaDoQuadro[] {
  const noQuadro = processosDoQuadro(processos)
  const colunas = agruparPorPessoa(noQuadro)
  const semResponsavel = noQuadro.filter((processo) => processo.responsavel === null)
  if (semResponsavel.length === 0) return colunas
  return [...colunas, { chave: 'sem-responsavel', titulo: 'Sem responsável', processos: semResponsavel }]
}

function porSigla(a: SetorDoQuadro, b: SetorDoQuadro): number {
  return a.sigla.localeCompare(b.sigla, 'pt-BR', { sensitivity: 'base' })
}

/**
 * Uma coluna por setor ativo, mesmo vazia, e por setor inativo que ainda tem processo no Quadro. Primeiro os setores que têm
 * processo na tela, depois os vazios (ADR 0032), cada grupo em ordem de sigla.
 * Com o filtro de setor (setorFiltrado), só a coluna dele. Em cada coluna, os processos saem em ordem de nome.
 */
export function colunasPorSetor(setores: SetorDoQuadro[], processos: ProcessoDaLista[], setorFiltrado: string | null): ColunaDoQuadro[] {
  const noQuadro = processosDoQuadro(processos)
  const colunas = [...setores]
    .sort(porSigla)
    .map((setor) => ({
      chave: setor.id, titulo: setor.sigla, subtitulo: setor.nome, inativo: !setor.ativo, cor: setor.cor,
      processos: noQuadro.filter((processo) => processo.setorId === setor.id),
    }))
    .filter((coluna) => (setorFiltrado === null ? !coluna.inativo || coluna.processos.length > 0 : coluna.chave === setorFiltrado))
  // O filter mantém a ordem de sigla dentro de cada grupo.
  return [...colunas.filter((coluna) => coluna.processos.length > 0), ...colunas.filter((coluna) => coluna.processos.length === 0)]
}
