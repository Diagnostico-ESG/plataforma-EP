import { CHAVE_DOS_CONCLUIDOS, TITULO_DOS_CONCLUIDOS } from './publicacao'
import type { ListaDeProcessos, ProcessoDaLista, SituacaoDoProcesso } from './tipos'

export type ColunaDoQuadro = {
  chave: string; titulo: string; processos: ProcessoDaLista[]
  /** Só no Quadro por responsável: a pessoa da coluna foi desativada. */
  inativo?: boolean
}

// Nas colunas das etapas só em andamento e suspensos; o concluído vai à coluna Concluídos e o cancelado fica só na Lista.
const SITUACOES_NO_QUADRO = new Set<SituacaoDoProcesso>(['em_andamento', 'suspenso'])

function porNome(a: ProcessoDaLista, b: ProcessoDaLista): number {
  return a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })
}

function processosDoQuadro(processos: ProcessoDaLista[]): ProcessoDaLista[] {
  return processos.filter((processo) => SITUACOES_NO_QUADRO.has(processo.situacao)).sort(porNome)
}

function colunaDosConcluidos(processos: ProcessoDaLista[]): ColunaDoQuadro {
  const concluidos = processos.filter((processo) => processo.situacao === 'concluido').sort(porNome)
  return { chave: CHAVE_DOS_CONCLUIDOS, titulo: TITULO_DOS_CONCLUIDOS, processos: concluidos }
}

/**
 * Uma coluna por etapa ativa, na ordem do catálogo, e Concluídos no fim, sempre. A coluna de uma etapa desativada
 * aparece enquanto houver processo nela. Em cada coluna, os processos saem em ordem de nome.
 */
export function colunasDoQuadro({ etapas, processos }: ListaDeProcessos): ColunaDoQuadro[] {
  const noQuadro = processosDoQuadro(processos)
  const daEtapa = (codigo: string) => noQuadro.filter((processo) => processo.etapaAtual?.codigo === codigo)
  const colunasDasEtapas = etapas
    .filter((etapa) => etapa.ativa || daEtapa(etapa.codigo).length > 0)
    .sort((a, b) => a.ordem - b.ordem)
    .map((etapa) => ({ chave: etapa.codigo, titulo: etapa.nome, processos: daEtapa(etapa.codigo) }))
  return [...colunasDasEtapas, colunaDosConcluidos(processos)]
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

/** Uma coluna por pessoa que responde pela etapa atual de algum cartão, em ordem de nome; "Sem responsável" por último. */
export function colunasPorResponsavel(processos: ProcessoDaLista[]): ColunaDoQuadro[] {
  const noQuadro = processosDoQuadro(processos).filter((processo) => processo.etapaAtual !== null)
  const colunas = agruparPorPessoa(noQuadro)
  const semResponsavel = noQuadro.filter((processo) => processo.responsavel === null)
  if (semResponsavel.length === 0) return colunas
  return [...colunas, { chave: 'sem-responsavel', titulo: 'Sem responsável', processos: semResponsavel }]
}
