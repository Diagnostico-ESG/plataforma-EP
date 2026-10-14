import { expect, test } from 'vitest'
import { lerEnderecoDosProcessos, montarEnderecoDosProcessos, SEM_FILTROS } from './enderecoDosProcessos'

test('o caminho dá a visão e o item aberto', () => {
  expect(lerEnderecoDosProcessos('#/processos')).toEqual({ visao: 'quadro', aberto: null, filtros: SEM_FILTROS })
  expect(lerEnderecoDosProcessos('#/processos/lista')).toEqual({ visao: 'lista', aberto: null, filtros: SEM_FILTROS })
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
  expect(montarEnderecoDosProcessos({ visao: 'lista', aberto: null, filtros: SEM_FILTROS })).toBe('#/processos/lista')
  const comFiltros = { ...SEM_FILTROS, setor: 's1', etapa: 'modelagem' }
  expect(montarEnderecoDosProcessos({ visao: 'lista', aberto: 'p1', filtros: comFiltros }))
    .toBe('#/processos/lista/p1?setor=s1&etapa=modelagem')
  expect(montarEnderecoDosProcessos({ visao: 'quadro', aberto: null, filtros: { ...SEM_FILTROS, situacao: 'concluido' } }))
    .toBe('#/processos')
})

test('ida e volta com todos os filtros', () => {
  const endereco = '#/processos/lista/p1?setor=s1&macroprocesso=m1&etapa=aguardando-o-setor&tipo=processo&responsavel=u1&situacao=suspenso'
  expect(montarEnderecoDosProcessos(lerEnderecoDosProcessos(endereco))).toBe(endereco)
})
