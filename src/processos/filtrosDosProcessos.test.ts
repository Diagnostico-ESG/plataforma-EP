import { expect, test } from 'vitest'
import { SEM_FILTROS, type FiltrosDosProcessos } from './enderecoDosProcessos'
import { corDoMacroprocesso } from './corDoMacroprocesso'
import { filtrarProcessos, opcoesDosFiltros, temFiltro } from './filtrosDosProcessos'
import type { EtapaDoCatalogo, ProcessoDaLista } from './tipos'

const MODELAGEM = { id: 'e4', codigo: 'modelagem', nome: 'Reunião de modelagem', ordem: 4, posicao: 2, total: 3 }
const RELATORIO = { id: 'e5', codigo: 'relatorio', nome: 'Relatório', ordem: 5, posicao: 3, total: 3 }

function processo(nome: string, mudancas: Partial<ProcessoDaLista> = {}): ProcessoDaLista {
  return {
    id: nome, nome, tipo: 'processo', setorId: 's1', setorSigla: 'TSA', macroprocessoId: 'm1', macroprocessoNome: 'Macro Um',
    processoPaiId: null, situacao: 'em_andamento', etapaAtual: MODELAGEM, responsavel: null,
    ...mudancas,
  }
}

const ANA = { id: 'u1', nome: 'Ana Teste', fotoUrl: null }
const BRUNO = { id: 'u2', nome: 'Bruno Teste', fotoUrl: 'https://fotos.exemplo/bruno.png' }

const PROCESSOS = [
  processo('Alfa'),
  processo('Beta', { setorId: 's2', setorSigla: 'TSB', tipo: 'subprocesso', processoPaiId: 'Alfa', responsavel: BRUNO }),
  processo('Gama', { macroprocessoId: 'm2', macroprocessoNome: 'Macro Dois', situacao: 'concluido', etapaAtual: null }),
  processo('Delta', { etapaAtual: null, responsavel: ANA }),
  processo('Épsilon', { etapaAtual: RELATORIO, tipo: 'a_classificar', situacao: 'suspenso', responsavel: ANA }),
]

const nomes = (filtros: Partial<FiltrosDosProcessos>) =>
  filtrarProcessos(PROCESSOS, { ...SEM_FILTROS, ...filtros }).map((p) => p.nome)

test('temFiltro: falso sem nenhum, verdadeiro com um', () => {
  expect(temFiltro(SEM_FILTROS)).toBe(false)
  expect(temFiltro({ ...SEM_FILTROS, responsavel: 'u1' })).toBe(true)
})

test('cada filtro sozinho', () => {
  expect(nomes({})).toEqual(['Alfa', 'Beta', 'Gama', 'Delta', 'Épsilon'])
  expect(nomes({ setor: 's2' })).toEqual(['Beta'])
  expect(nomes({ macroprocesso: 'm2' })).toEqual(['Gama'])
  expect(nomes({ tipo: 'subprocesso' })).toEqual(['Beta'])
  expect(nomes({ responsavel: 'u1' })).toEqual(['Delta', 'Épsilon'])
  expect(nomes({ situacao: 'suspenso' })).toEqual(['Épsilon'])
})

test('arquivados: "esconder" tira o arquivado; sem o filtro ele aparece', () => {
  const arquivado = processo('Zeta', { situacao: 'concluido', etapaAtual: null, arquivadoEm: '2026-10-22T15:00:00+00:00' })
  const todos = [...PROCESSOS, arquivado]
  expect(filtrarProcessos(todos, { ...SEM_FILTROS, arquivados: 'esconder' }).map((p) => p.nome)).not.toContain('Zeta')
  expect(filtrarProcessos(todos, SEM_FILTROS).map((p) => p.nome)).toContain('Zeta')
  expect(temFiltro({ ...SEM_FILTROS, arquivados: 'esconder' })).toBe(true)
})

test('etapa: pega quem está na etapa atual escolhida', () => {
  expect(nomes({ etapa: 'modelagem' })).toEqual(['Alfa', 'Beta'])
})

test('a combinação de filtros é "e"', () => {
  expect(nomes({ setor: 's1', responsavel: 'u1', situacao: 'em_andamento' })).toEqual(['Delta'])
  expect(nomes({ setor: 's2', tipo: 'processo' })).toEqual([])
})

test('opções: sem repetição, na ordem certa; a etapa de filtro é só das ativas, inclusive as fixas', () => {
  const etapas: EtapaDoCatalogo[] = [
    { id: 'e5', codigo: RELATORIO.codigo, nome: RELATORIO.nome, ordem: RELATORIO.ordem, ativa: true },
    { id: 'e4', codigo: MODELAGEM.codigo, nome: MODELAGEM.nome, ordem: MODELAGEM.ordem, ativa: true },
    { id: 'e6', codigo: 'parada', nome: 'Desativada', ordem: 6, ativa: false },
    { id: 'e1', codigo: 'nao_iniciados', nome: 'Não iniciados', ordem: 1, ativa: true },
    { id: 'e9', codigo: 'concluidos', nome: 'Concluídos', ordem: 9, ativa: true },
  ]
  const opcoes = opcoesDosFiltros({ etapas, processos: [...PROCESSOS].reverse() })
  expect(opcoes.setores).toEqual([{ valor: 's1', rotulo: 'TSA', corDoSetor: 1 }, { valor: 's2', rotulo: 'TSB', corDoSetor: 1 }])
  expect(opcoes.macroprocessos).toEqual([
    { valor: 'm2', rotulo: 'Macro Dois', cor: corDoMacroprocesso('m2') },
    { valor: 'm1', rotulo: 'Macro Um', cor: corDoMacroprocesso('m1') },
  ])
  expect(opcoes.etapas).toEqual([
    { valor: 'nao_iniciados', rotulo: 'Não iniciados' },
    { valor: 'modelagem', rotulo: 'Reunião de modelagem' },
    { valor: 'relatorio', rotulo: 'Relatório' },
    { valor: 'concluidos', rotulo: 'Concluídos' },
  ])
  // Cada responsável leva a foto (ou a falta dela) para a caixa mostrar o Avatar ao lado do nome.
  expect(opcoes.responsaveis).toEqual([
    { valor: 'u1', rotulo: 'Ana Teste', pessoa: { nome: 'Ana Teste', fotoUrl: null } },
    { valor: 'u2', rotulo: 'Bruno Teste', pessoa: { nome: 'Bruno Teste', fotoUrl: 'https://fotos.exemplo/bruno.png' } },
  ])
  expect(opcoes.tipos.map((o) => o.rotulo)).toEqual(['Processo', 'Subprocesso', 'A classificar'])
  expect(opcoes.situacoes.map((o) => o.rotulo)).toEqual(['Em andamento', 'Suspenso', 'Cancelado', 'Concluído'])
})

test('a opção do filtro Setor leva a cor do setor; sem a cor vale a 1', () => {
  const opcoes = opcoesDosFiltros({ etapas: [], processos: [processo('Um', { setorCor: 13 }), processo('Dois', { setorId: 's2', setorSigla: 'TSB' })] })
  expect(opcoes.setores).toEqual([{ valor: 's1', rotulo: 'TSA', corDoSetor: 13 }, { valor: 's2', rotulo: 'TSB', corDoSetor: 1 }])
})
