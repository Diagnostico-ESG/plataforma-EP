import { CHAVE_AGUARDANDO_O_SETOR } from './colunasDoQuadro'
import type { FiltrosDosProcessos } from './enderecoDosProcessos'
import { ROTULO_DA_SITUACAO, ROTULO_DO_TIPO } from './rotulos'
import type { EtapaDoCatalogo, ListaDeProcessos, ProcessoDaLista } from './tipos'

export type OpcaoDoFiltro = { valor: string; rotulo: string }

export type OpcoesDosFiltros = {
  setores: OpcaoDoFiltro[]
  macroprocessos: OpcaoDoFiltro[]
  etapas: OpcaoDoFiltro[]
  tipos: OpcaoDoFiltro[]
  responsaveis: OpcaoDoFiltro[]
  situacoes: OpcaoDoFiltro[]
}

export function temFiltro(filtros: FiltrosDosProcessos): boolean {
  return Object.values(filtros).some((valor) => valor !== null)
}

export function filtrarProcessos(processos: ProcessoDaLista[], filtros: FiltrosDosProcessos): ProcessoDaLista[] {
  return processos.filter((processo) => passaNosFiltros(processo, filtros))
}

// Uma conferência por filtro; o filtro vazio deixa passar.
const CONFERENCIAS: Record<keyof FiltrosDosProcessos, (processo: ProcessoDaLista, valor: string) => boolean> = {
  setor: (processo, valor) => processo.setorId === valor,
  macroprocesso: (processo, valor) => processo.macroprocessoId === valor,
  etapa: (processo, valor) => estaNaEtapa(processo, valor),
  tipo: (processo, valor) => processo.tipo === valor,
  responsavel: (processo, valor) => processo.responsavel?.id === valor,
  situacao: (processo, valor) => processo.situacao === valor,
}

function passaNosFiltros(processo: ProcessoDaLista, filtros: FiltrosDosProcessos): boolean {
  return (Object.keys(CONFERENCIAS) as (keyof FiltrosDosProcessos)[])
    .every((nome) => filtros[nome] === null || CONFERENCIAS[nome](processo, filtros[nome]))
}

// Quem aguarda o setor ainda não está em nenhuma etapa do processo, como no Quadro.
function estaNaEtapa(processo: ProcessoDaLista, etapa: string): boolean {
  if (etapa === CHAVE_AGUARDANDO_O_SETOR) return processo.aguardandoOSetor
  return !processo.aguardandoOSetor && processo.etapaAtual?.codigo === etapa
}

/** As opções saem da lista carregada: só aparece o setor, o macroprocesso ou o responsável que tem processo. */
export function opcoesDosFiltros({ etapas, processos }: ListaDeProcessos): OpcoesDosFiltros {
  return {
    setores: semRepetir(processos.map((p) => ({ valor: p.setorId, rotulo: p.setorSigla }))),
    macroprocessos: semRepetir(processos.map((p) => ({ valor: p.macroprocessoId, rotulo: p.macroprocessoNome }))),
    etapas: opcoesDeEtapa(etapas, processos),
    tipos: Object.entries(ROTULO_DO_TIPO).map(([valor, rotulo]) => ({ valor, rotulo })),
    responsaveis: semRepetir(processos.flatMap((p) => (p.responsavel ? [{ valor: p.responsavel.id, rotulo: p.responsavel.nome }] : []))),
    situacoes: Object.entries(ROTULO_DA_SITUACAO).map(([valor, rotulo]) => ({ valor, rotulo })),
  }
}

function semRepetir(opcoes: OpcaoDoFiltro[]): OpcaoDoFiltro[] {
  const porValor = new Map(opcoes.map((opcao) => [opcao.valor, opcao]))
  return [...porValor.values()].sort((a, b) => a.rotulo.localeCompare(b.rotulo, 'pt-BR', { sensitivity: 'base' }))
}

// As mesmas etapas que viram coluna no Quadro: as ativas e a desativada que ainda tem processo.
function opcoesDeEtapa(etapas: EtapaDoCatalogo[], processos: ProcessoDaLista[]): OpcaoDoFiltro[] {
  const emUso = new Set(processos.map((processo) => processo.etapaAtual?.codigo))
  const doCatalogo = etapas
    .filter((etapa) => etapa.ativa || emUso.has(etapa.codigo))
    .sort((a, b) => a.ordem - b.ordem)
    .map((etapa) => ({ valor: etapa.codigo, rotulo: etapa.nome }))
  return [{ valor: CHAVE_AGUARDANDO_O_SETOR, rotulo: 'Aguardando o setor' }, ...doCatalogo]
}
