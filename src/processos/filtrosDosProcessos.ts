import { contemTrecho } from './buscaNaLista'
import type { FiltrosDosProcessos } from './enderecoDosProcessos'
import { ROTULO_DA_SITUACAO, ROTULO_DO_TIPO } from './rotulos'
import { corDoMacroprocesso } from './corDoMacroprocesso'
import { pessoaDaOpcao } from './pessoaDaOpcao'
import type { EtapaDoCatalogo, ListaDeProcessos, PessoaDaOpcao, ProcessoDaLista, ResponsavelDoProcesso } from './tipos'

/** `cor` é a marca do macroprocesso; `pessoa`, o Avatar do responsável. As demais opções só têm o texto. */
export type OpcaoDoFiltro = { valor: string; rotulo: string; cor?: string; pessoa?: PessoaDaOpcao }

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
  etapa: (processo, valor) => processo.etapaAtual?.codigo === valor,
  tipo: (processo, valor) => processo.tipo === valor,
  responsavel: (processo, valor) => processo.responsavel?.id === valor,
  situacao: (processo, valor) => processo.situacao === valor,
  busca: (processo, valor) => contemTrecho(processo.nome, valor),
  arquivados: (processo, valor) => valor !== 'esconder' || !processo.arquivadoEm,
}

function passaNosFiltros(processo: ProcessoDaLista, filtros: FiltrosDosProcessos): boolean {
  return (Object.keys(CONFERENCIAS) as (keyof FiltrosDosProcessos)[])
    .every((nome) => filtros[nome] === null || CONFERENCIAS[nome](processo, filtros[nome]))
}

/** As opções saem da lista carregada: só aparece o setor, o macroprocesso ou o responsável que tem processo. */
export function opcoesDosFiltros({ etapas, processos }: Pick<ListaDeProcessos, 'etapas' | 'processos'>): OpcoesDosFiltros {
  return {
    setores: semRepetir(processos.map((p) => ({ valor: p.setorId, rotulo: p.setorSigla }))),
    macroprocessos: semRepetir(processos.map((p) => ({ valor: p.macroprocessoId, rotulo: p.macroprocessoNome, cor: corDoMacroprocesso(p.macroprocessoId) }))),
    etapas: opcoesDeEtapa(etapas),
    tipos: Object.entries(ROTULO_DO_TIPO).map(([valor, rotulo]) => ({ valor, rotulo })),
    responsaveis: semRepetir(processos.flatMap((p) => (p.responsavel ? [opcaoDeResponsavel(p.responsavel)] : []))),
    situacoes: Object.entries(ROTULO_DA_SITUACAO).map(([valor, rotulo]) => ({ valor, rotulo })),
  }
}

function semRepetir(opcoes: OpcaoDoFiltro[]): OpcaoDoFiltro[] {
  const porValor = new Map(opcoes.map((opcao) => [opcao.valor, opcao]))
  return [...porValor.values()].sort((a, b) => a.rotulo.localeCompare(b.rotulo, 'pt-BR', { sensitivity: 'base' }))
}

// As mesmas etapas que viram coluna no Quadro: as ativas, inclusive Não iniciados e Concluídos.
function opcoesDeEtapa(etapas: EtapaDoCatalogo[]): OpcaoDoFiltro[] {
  return etapas
    .filter((etapa) => etapa.ativa)
    .sort((a, b) => a.ordem - b.ordem)
    .map((etapa) => ({ valor: etapa.codigo, rotulo: etapa.nome }))
}

function opcaoDeResponsavel(responsavel: ResponsavelDoProcesso): OpcaoDoFiltro {
  return { valor: responsavel.id, rotulo: responsavel.nome, pessoa: pessoaDaOpcao(responsavel) }
}
