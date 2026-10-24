import type { ListaDeProcessos, ProcessoDaLista, SituacaoDoProcesso } from './tipos'

export type ColunaDoQuadro = {
  chave: string; titulo: string; processos: ProcessoDaLista[]
  /** Só no Quadro por responsável: a pessoa da coluna foi desativada. */
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
export function colunasDoQuadro({ etapas, processos }: ListaDeProcessos): ColunaDoQuadro[] {
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
