import type { ListaDeProcessos, ProcessoDaLista, SituacaoDoProcesso } from './tipos'

export type ColunaDoQuadro = { chave: string; titulo: string; processos: ProcessoDaLista[] }

export const CHAVE_AGUARDANDO_O_SETOR = 'aguardando-o-setor'

// Concluído e cancelado saem do Quadro e continuam na Lista (ticket 09).
const SITUACOES_NO_QUADRO = new Set<SituacaoDoProcesso>(['em_andamento', 'suspenso'])

function porNome(a: ProcessoDaLista, b: ProcessoDaLista): number {
  return a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })
}

/**
 * "Aguardando o setor" e uma coluna por etapa ativa de nível processo, na ordem do catálogo. A coluna de uma
 * etapa desativada aparece enquanto houver processo nela. Em cada coluna, os processos saem em ordem de nome.
 */
export function colunasDoQuadro({ etapas, processos }: ListaDeProcessos): ColunaDoQuadro[] {
  const noQuadro = processos.filter((processo) => SITUACOES_NO_QUADRO.has(processo.situacao)).sort(porNome)
  const emEtapa = noQuadro.filter((processo) => !processo.aguardandoOSetor)
  const daEtapa = (codigo: string) => emEtapa.filter((processo) => processo.etapaAtual?.codigo === codigo)
  const colunasDeEtapa = etapas
    .filter((etapa) => etapa.ativa || daEtapa(etapa.codigo).length > 0)
    .sort((a, b) => a.ordem - b.ordem)
    .map((etapa) => ({ chave: etapa.codigo, titulo: etapa.nome, processos: daEtapa(etapa.codigo) }))
  const aguardando = noQuadro.filter((processo) => processo.aguardandoOSetor)
  return [{ chave: CHAVE_AGUARDANDO_O_SETOR, titulo: 'Aguardando o setor', processos: aguardando }, ...colunasDeEtapa]
}
