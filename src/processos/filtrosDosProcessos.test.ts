import { expect, test } from 'vitest'
import { SEM_FILTROS, type FiltrosDosProcessos } from './enderecoDosProcessos'
import { filtrarProcessos, opcoesDosFiltros, temFiltro } from './filtrosDosProcessos'
import type { EtapaDoCatalogo, ProcessoDaLista } from './tipos'

const MODELAGEM = { codigo: 'modelagem', nome: 'Reunião de modelagem', ordem: 4 }
const RELATORIO = { codigo: 'relatorio', nome: 'Relatório', ordem: 5 }

function processo(nome: string, mudancas: Partial<ProcessoDaLista> = {}): ProcessoDaLista {
  return {
    id: nome, nome, tipo: 'processo', setorId: 's1', setorSigla: 'TSA', macroprocessoId: 'm1', macroprocessoNome: 'Macro Um',
    processoPaiId: null, situacao: 'em_andamento', etapaAtual: MODELAGEM, aguardandoOSetor: false, responsavel: null,
    ...mudancas,
  }
}

const ANA = { id: 'u1', nome: 'Ana Teste', fotoUrl: null }
const BRUNO = { id: 'u2', nome: 'Bruno Teste', fotoUrl: null }

const PROCESSOS = [
  processo('Alfa'),
  processo('Beta', { setorId: 's2', setorSigla: 'TSB', tipo: 'subprocesso', processoPaiId: 'Alfa', responsavel: BRUNO }),
  processo('Gama', { macroprocessoId: 'm2', macroprocessoNome: 'Macro Dois', situacao: 'concluido', etapaAtual: null }),
  processo('Delta', { aguardandoOSetor: true, responsavel: ANA }),
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

test('etapa: a do catálogo não pega quem aguarda o setor; "aguardando-o-setor" pega só esses', () => {
  expect(nomes({ etapa: 'modelagem' })).toEqual(['Alfa', 'Beta'])
  expect(nomes({ etapa: 'aguardando-o-setor' })).toEqual(['Delta'])
})

test('a combinação de filtros é "e"', () => {
  expect(nomes({ setor: 's1', responsavel: 'u1', situacao: 'em_andamento' })).toEqual(['Delta'])
  expect(nomes({ setor: 's2', tipo: 'processo' })).toEqual([])
})

test('opções: sem repetição, na ordem certa', () => {
  const etapas: EtapaDoCatalogo[] = [
    { id: 'e5', ...RELATORIO, ativa: true },
    { id: 'e4', ...MODELAGEM, ativa: true },
    { id: 'e6', codigo: 'parada', nome: 'Desativada sem processo', ordem: 6, ativa: false },
  ]
  const opcoes = opcoesDosFiltros({ etapas, processos: [...PROCESSOS].reverse() })
  expect(opcoes.setores).toEqual([{ valor: 's1', rotulo: 'TSA' }, { valor: 's2', rotulo: 'TSB' }])
  expect(opcoes.macroprocessos).toEqual([{ valor: 'm2', rotulo: 'Macro Dois' }, { valor: 'm1', rotulo: 'Macro Um' }])
  expect(opcoes.etapas).toEqual([
    { valor: 'aguardando-o-setor', rotulo: 'Aguardando o setor' },
    { valor: 'modelagem', rotulo: 'Reunião de modelagem' },
    { valor: 'relatorio', rotulo: 'Relatório' },
  ])
  expect(opcoes.responsaveis).toEqual([{ valor: 'u1', rotulo: 'Ana Teste' }, { valor: 'u2', rotulo: 'Bruno Teste' }])
  expect(opcoes.tipos.map((o) => o.rotulo)).toEqual(['Processo', 'Subprocesso', 'A classificar'])
  expect(opcoes.situacoes.map((o) => o.rotulo)).toEqual(['Em andamento', 'Suspenso', 'Cancelado', 'Concluído'])
})
