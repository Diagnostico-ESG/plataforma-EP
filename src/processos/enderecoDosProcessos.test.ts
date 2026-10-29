import { expect, test } from 'vitest'
import { lerEnderecoDosProcessos, montarEnderecoDosProcessos, SEM_FILTROS } from './enderecoDosProcessos'
import { ORDENACAO_PADRAO } from './ordenacaoDaLista'

test('o caminho dá a visão e o item aberto', () => {
  expect(lerEnderecoDosProcessos('#/processos')).toEqual({ visao: 'quadro', aberto: null, filtros: SEM_FILTROS, agrupar: 'etapa', mostrar: 'todos', ordenacao: ORDENACAO_PADRAO })
  expect(lerEnderecoDosProcessos('#/processos/lista')).toEqual({ visao: 'lista', aberto: null, filtros: SEM_FILTROS, agrupar: 'etapa', mostrar: 'todos', ordenacao: ORDENACAO_PADRAO })
  expect(lerEnderecoDosProcessos('#/processos/p1').aberto).toBe('p1')
  expect(lerEnderecoDosProcessos('#/processos/lista/p1')).toMatchObject({ visao: 'lista', aberto: 'p1' })
  expect(lerEnderecoDosProcessos('#/processos/novo').aberto).toBe('novo')
})

test('os filtros vêm da consulta; a situação só vale na Lista', () => {
  const lista = lerEnderecoDosProcessos('#/processos/lista?setor=s1&tipo=subprocesso&situacao=suspenso')
  expect(lista.filtros).toEqual({ ...SEM_FILTROS, setor: 's1', tipo: 'subprocesso', situacao: 'suspenso' })
  const quadro = lerEnderecoDosProcessos('#/processos?setor=s1&situacao=suspenso')
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

test('o parâmetro antigo "arquivados" de um endereço guardado é ignorado e não volta para o endereço', () => {
  expect(lerEnderecoDosProcessos('#/processos/lista?arquivados=esconder').filtros).toEqual(SEM_FILTROS)
  expect(lerEnderecoDosProcessos('#/processos/lista?setor=s1&arquivados=esconder').filtros).toEqual({ ...SEM_FILTROS, setor: 's1' })
  const filtros = { ...SEM_FILTROS, setor: 's1' }
  expect(montarEnderecoDosProcessos({ visao: 'lista', aberto: null, filtros, agrupar: 'etapa' })).toBe('#/processos/lista?setor=s1')
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
    .toEqual({ visao: 'lista', aberto: 'p1', filtros, agrupar: 'etapa', mostrar: 'todos', ordenacao: ORDENACAO_PADRAO })
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

test('agrupar=setor vale só no Quadro, lido e montado com ida e volta', () => {
  expect(lerEnderecoDosProcessos('#/processos?agrupar=setor').agrupar).toBe('setor')
  expect(lerEnderecoDosProcessos('#/processos/lista?agrupar=setor').agrupar).toBe('etapa')
  expect(montarEnderecoDosProcessos({ visao: 'lista', aberto: null, filtros: SEM_FILTROS, agrupar: 'setor' })).toBe('#/processos/lista')
  const endereco = '#/processos/p1?macroprocesso=m1&agrupar=setor'
  expect(montarEnderecoDosProcessos(lerEnderecoDosProcessos(endereco))).toBe(endereco)
})

test('mostrar=concluidos vale na Lista e no Quadro por setor; nas outras visões é ignorado', () => {
  expect(lerEnderecoDosProcessos('#/processos/lista?mostrar=concluidos').mostrar).toBe('concluidos')
  expect(lerEnderecoDosProcessos('#/processos?agrupar=setor&mostrar=concluidos').mostrar).toBe('concluidos')
  expect(lerEnderecoDosProcessos('#/processos?mostrar=concluidos').mostrar).toBe('todos')
  expect(lerEnderecoDosProcessos('#/processos?agrupar=responsavel&mostrar=concluidos').mostrar).toBe('todos')
  expect(lerEnderecoDosProcessos('#/processos/lista').mostrar).toBe('todos')
  expect(lerEnderecoDosProcessos('#/processos/lista?mostrar=xyz').mostrar).toBe('todos')
})

test('mostrar só vai para o endereço quando é Concluídos e a visão o usa', () => {
  const base = { aberto: null, filtros: { ...SEM_FILTROS, setor: 's1' }, agrupar: 'etapa' as const }
  expect(montarEnderecoDosProcessos({ ...base, visao: 'lista', mostrar: 'concluidos' })).toBe('#/processos/lista?setor=s1&mostrar=concluidos')
  expect(montarEnderecoDosProcessos({ ...base, visao: 'lista', mostrar: 'todos' })).toBe('#/processos/lista?setor=s1')
  expect(montarEnderecoDosProcessos({ ...base, visao: 'quadro', agrupar: 'setor', mostrar: 'concluidos' }))
    .toBe('#/processos?setor=s1&agrupar=setor&mostrar=concluidos')
  expect(montarEnderecoDosProcessos({ ...base, visao: 'quadro', mostrar: 'concluidos' })).toBe('#/processos?setor=s1')
})

test('com Concluídos o filtro de situação é ignorado; situacao=cancelado nunca vale', () => {
  expect(lerEnderecoDosProcessos('#/processos/lista?situacao=suspenso&mostrar=concluidos').filtros.situacao).toBeNull()
  expect(lerEnderecoDosProcessos('#/processos/lista?situacao=cancelado').filtros.situacao).toBeNull()
  const filtros = { ...SEM_FILTROS, situacao: 'suspenso' as const }
  expect(montarEnderecoDosProcessos({ visao: 'lista', aberto: null, filtros, agrupar: 'etapa', mostrar: 'concluidos' }))
    .toBe('#/processos/lista?mostrar=concluidos')
})

test('ler e montar são inversos com mostrar', () => {
  for (const endereco of ['#/processos/lista?setor=s1&mostrar=concluidos', '#/processos?agrupar=setor&mostrar=concluidos']) {
    expect(montarEnderecoDosProcessos(lerEnderecoDosProcessos(endereco))).toBe(endereco)
  }
})

test('ordenar e sentido valem na Lista', () => {
  expect(lerEnderecoDosProcessos('#/processos/lista?ordenar=etapa&sentido=decrescente').ordenacao)
    .toEqual({ coluna: 'etapa', sentido: 'decrescente' })
  expect(lerEnderecoDosProcessos('#/processos/lista?ordenar=responsavel').ordenacao).toEqual({ coluna: 'responsavel', sentido: 'crescente' })
})

test('coluna ou sentido desconhecidos voltam ao padrão, cada um por si; no Quadro a ordenação é ignorada', () => {
  expect(lerEnderecoDosProcessos('#/processos/lista?ordenar=xyz&sentido=decrescente').ordenacao)
    .toEqual({ coluna: 'processo', sentido: 'decrescente' })
  expect(lerEnderecoDosProcessos('#/processos/lista?ordenar=setor&sentido=xyz').ordenacao).toEqual({ coluna: 'setor', sentido: 'crescente' })
  expect(lerEnderecoDosProcessos('#/processos?ordenar=setor&sentido=decrescente').ordenacao).toEqual(ORDENACAO_PADRAO)
})

test('montar: a ordenação padrão não vai ao endereço; as outras vão, e só na Lista', () => {
  const base = { aberto: null, filtros: SEM_FILTROS, agrupar: 'etapa' as const }
  expect(montarEnderecoDosProcessos({ ...base, visao: 'lista', ordenacao: ORDENACAO_PADRAO })).toBe('#/processos/lista')
  expect(montarEnderecoDosProcessos({ ...base, visao: 'lista', ordenacao: { coluna: 'responsavel', sentido: 'crescente' } }))
    .toBe('#/processos/lista?ordenar=responsavel')
  expect(montarEnderecoDosProcessos({ ...base, visao: 'lista', ordenacao: { coluna: 'processo', sentido: 'decrescente' } }))
    .toBe('#/processos/lista?sentido=decrescente')
  expect(montarEnderecoDosProcessos({ ...base, visao: 'quadro', ordenacao: { coluna: 'setor', sentido: 'decrescente' } })).toBe('#/processos')
})

test('ler e montar são inversos com a ordenação e os filtros', () => {
  const endereco = '#/processos/lista?tipo=processo&mostrar=concluidos&ordenar=etapa&sentido=decrescente'
  expect(montarEnderecoDosProcessos(lerEnderecoDosProcessos(endereco))).toBe(endereco)
})
