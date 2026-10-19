import { expect, test } from 'vitest'
import { lerEnderecoDosProcessos, montarEnderecoDosProcessos, SEM_FILTROS } from './enderecoDosProcessos'

test('o caminho dá a visão e o item aberto', () => {
  expect(lerEnderecoDosProcessos('#/processos')).toEqual({ visao: 'quadro', aberto: null, filtros: SEM_FILTROS, agrupar: 'etapa' })
  expect(lerEnderecoDosProcessos('#/processos/lista')).toEqual({ visao: 'lista', aberto: null, filtros: SEM_FILTROS, agrupar: 'etapa' })
  expect(lerEnderecoDosProcessos('#/processos/p1').aberto).toBe('p1')
  expect(lerEnderecoDosProcessos('#/processos/lista/p1')).toMatchObject({ visao: 'lista', aberto: 'p1' })
  expect(lerEnderecoDosProcessos('#/processos/novo').aberto).toBe('novo')
})

test('os filtros vêm da consulta; a situação só vale na Lista', () => {
  const lista = lerEnderecoDosProcessos('#/processos/lista?setor=s1&tipo=subprocesso&situacao=cancelado')
  expect(lista.filtros).toEqual({ ...SEM_FILTROS, setor: 's1', tipo: 'subprocesso', situacao: 'cancelado' })
  const quadro = lerEnderecoDosProcessos('#/processos?setor=s1&situacao=cancelado')
  expect(quadro.filtros).toEqual({ ...SEM_FILTROS, setor: 's1' })
})

test('tipo ou situação desconhecidos e parâmetro vazio viram "sem filtro"', () => {
  const endereco = lerEnderecoDosProcessos('#/processos/lista?tipo=xyz&situacao=xyz&setor=')
  expect(endereco.filtros).toEqual(SEM_FILTROS)
})

test('montar: só os filtros preenchidos, e sem situação no Quadro', () => {
  expect(montarEnderecoDosProcessos({ visao: 'lista', aberto: null, filtros: SEM_FILTROS, agrupar: 'etapa' })).toBe('#/processos/lista')
  const comFiltros = { ...SEM_FILTROS, setor: 's1', etapa: 'modelagem' }
  expect(montarEnderecoDosProcessos({ visao: 'lista', aberto: 'p1', filtros: comFiltros, agrupar: 'etapa' }))
    .toBe('#/processos/lista/p1?setor=s1&etapa=modelagem')
  expect(montarEnderecoDosProcessos({ visao: 'quadro', aberto: null, filtros: { ...SEM_FILTROS, situacao: 'concluido' }, agrupar: 'etapa' }))
    .toBe('#/processos')
})

test('o endereço antigo com "aguardando-o-setor" vale como sem filtro de etapa', () => {
  expect(lerEnderecoDosProcessos('#/processos/lista?etapa=aguardando-o-setor').filtros.etapa).toBeNull()
})

test('ida e volta com todos os filtros', () => {
  const endereco = '#/processos/lista/p1?setor=s1&macroprocesso=m1&etapa=modelagem&tipo=processo&responsavel=u1&situacao=suspenso'
  expect(montarEnderecoDosProcessos(lerEnderecoDosProcessos(endereco))).toBe(endereco)
})

test('a busca vem da consulta, só na Lista, e endereço sem busca continua valendo', () => {
  expect(lerEnderecoDosProcessos('#/processos/lista?busca=pagar%20di').filtros).toEqual({ ...SEM_FILTROS, busca: 'pagar di' })
  expect(lerEnderecoDosProcessos('#/processos?busca=pagar').filtros).toEqual(SEM_FILTROS)
  expect(lerEnderecoDosProcessos('#/processos/lista?busca=').filtros.busca).toBeNull()
  expect(lerEnderecoDosProcessos('#/processos/lista?setor=s1').filtros.busca).toBeNull()
})

test('montar a busca: depois dos filtros, e fora do Quadro', () => {
  const filtros = { ...SEM_FILTROS, setor: 's1', busca: 'pagar di' }
  expect(montarEnderecoDosProcessos({ visao: 'lista', aberto: null, filtros, agrupar: 'etapa' })).toBe('#/processos/lista?setor=s1&busca=pagar+di')
  expect(montarEnderecoDosProcessos({ visao: 'quadro', aberto: null, filtros, agrupar: 'etapa' })).toBe('#/processos?setor=s1')
  expect(lerEnderecoDosProcessos(montarEnderecoDosProcessos({ visao: 'lista', aberto: 'p1', filtros, agrupar: 'etapa' })))
    .toEqual({ visao: 'lista', aberto: 'p1', filtros, agrupar: 'etapa' })
})

test('o agrupamento do Quadro vem de agrupar=responsavel; fora do Quadro ou com outro valor é por etapa', () => {
  expect(lerEnderecoDosProcessos('#/processos?agrupar=responsavel').agrupar).toBe('responsavel')
  expect(lerEnderecoDosProcessos('#/processos').agrupar).toBe('etapa')
  expect(lerEnderecoDosProcessos('#/processos?agrupar=outra-coisa').agrupar).toBe('etapa')
  expect(lerEnderecoDosProcessos('#/processos/lista?agrupar=responsavel').agrupar).toBe('etapa')
})

test('montar o agrupamento: depois dos filtros, só no Quadro, com ida e volta', () => {
  const filtros = { ...SEM_FILTROS, setor: 's1' }
  expect(montarEnderecoDosProcessos({ visao: 'quadro', aberto: null, filtros, agrupar: 'responsavel' }))
    .toBe('#/processos?setor=s1&agrupar=responsavel')
  expect(montarEnderecoDosProcessos({ visao: 'lista', aberto: null, filtros, agrupar: 'responsavel' }))
    .toBe('#/processos/lista?setor=s1')
  const endereco = '#/processos/p1?responsavel=u1&agrupar=responsavel'
  expect(montarEnderecoDosProcessos(lerEnderecoDosProcessos(endereco))).toBe(endereco)
})
