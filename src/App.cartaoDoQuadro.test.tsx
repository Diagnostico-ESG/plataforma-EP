import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import { cartaoDe, dia, montar, processo } from './testes/quadroDeTeste'

beforeEach(() => {
  window.location.hash = '#/processos'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const selos = (cartao: HTMLElement) => Array.from(cartao.querySelectorAll('.cartao-selos > *')).map((selo) => selo.textContent)

const SEM_RELATORIO = { ultimaVersao: { numero: 3, historica: false, temRelatorio: false } }

// ---- A barra e a etiqueta

test('a barra tem um pedaço por etapa ativa, com as anteriores preenchidas, a atual destacada e o nome acessível', async () => {
  montar([processo('Emitir Ofício', { etapa: 'revisao_interna' })])
  const cartao = await cartaoDe('Emitir Ofício')
  const barra = cartao.querySelector('[role="img"]')
  expect(barra?.getAttribute('aria-label')).toBe('Etapa 4 de 8: Revisão interna')
  expect(Array.from(barra?.children ?? []).map((pedaco) => pedaco.className.replace('pedaco pedaco-', ''))).toEqual([
    'resolvida', 'resolvida', 'resolvida', 'atual', 'seguinte', 'seguinte', 'seguinte', 'seguinte',
  ])
})

test('em Concluídos a barra está toda preenchida', async () => {
  montar([processo('Pronto', { etapa: 'concluidos', processo: { situacao: 'concluido', etiqueta: 'concluido' } })])
  const barra = (await cartaoDe('Pronto')).querySelector('[role="img"]')
  expect(barra?.getAttribute('aria-label')).toBe('Etapa 8 de 8: Concluídos')
  expect(Array.from(barra?.children ?? []).every((pedaco) => pedaco.className.includes('pedaco-resolvida'))).toBe(true)
})

test('o processo suspenso também tem barra, com a pílula Suspenso', async () => {
  montar([processo('Suspenso Teste', { processo: { situacao: 'suspenso' } })])
  const cartao = await cartaoDe('Suspenso Teste')
  expect(cartao.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe('Etapa 4 de 8: Revisão interna')
  expect(cartao.textContent).toContain('Suspenso')
})

test('o cartão mostra a etiqueta como pílula neutra com o texto, e o avatar do responsável do processo', async () => {
  montar([
    processo('A Fazer'), processo('Em Andamento', { processo: { etiqueta: 'em_andamento' } }),
    processo('Feita', { processo: { etiqueta: 'concluido' } }),
  ])
  for (const [nome, etiqueta] of [['A Fazer', 'A fazer'], ['Em Andamento', 'Em andamento'], ['Feita', 'Concluído']]) {
    const cartao = await cartaoDe(nome)
    const pilula = Array.from(cartao.querySelectorAll('.pilula')).find((elemento) => elemento.textContent === etiqueta)
    expect(pilula?.className).toContain('pilula-neutra')
    expect(cartao.querySelector('[role="img"][aria-label="Ana Teste"], .avatar')).not.toBeNull()
  }
})

// ---- Selos

test('dias na etapa: sem selo com 7 dias, "8 dias nesta etapa" com 8; nunca no suspenso, em Não iniciados nem em Concluídos', async () => {
  montar([
    processo('Sete Dias', { processo: { entrouNaEtapaEm: dia(-7) } }),
    processo('Oito Dias', { processo: { entrouNaEtapaEm: dia(-8) } }),
    processo('Suspenso Antigo', { processo: { entrouNaEtapaEm: dia(-40), situacao: 'suspenso' } }),
    processo('Parado Antigo', { etapa: 'nao_iniciados', processo: { entrouNaEtapaEm: dia(-40) } }),
    processo('Concluído Antigo', {
      etapa: 'concluidos', processo: { entrouNaEtapaEm: dia(-40), situacao: 'concluido', etiqueta: 'concluido', publicadoEm: dia(-41) },
    }),
  ])
  expect(selos(await cartaoDe('Sete Dias'))).toEqual([])
  expect(selos(await cartaoDe('Oito Dias'))).toEqual(['8 dias nesta etapa'])
  expect(selos(await cartaoDe('Suspenso Antigo'))).toEqual([])
  expect(selos(await cartaoDe('Parado Antigo'))).toEqual([])
  expect(selos(await cartaoDe('Concluído Antigo'))).toEqual([])
})

test('Sem publicação: só em Concluídos sem a data da publicação', async () => {
  montar([
    processo('Sem Data', { etapa: 'concluidos', processo: { situacao: 'concluido', etiqueta: 'concluido' } }),
    processo('Com Data', { etapa: 'concluidos', processo: { situacao: 'concluido', etiqueta: 'concluido', publicadoEm: dia(-3) } }),
    processo('Em Curso'),
  ])
  expect(selos(await cartaoDe('Sem Data'))).toEqual(['Sem publicação'])
  expect(selos(await cartaoDe('Com Data'))).toEqual([])
  expect(selos(await cartaoDe('Em Curso'))).toEqual([])
})

test('Relatório pendente: ausente antes da Revisão interna, presente da Revisão interna em diante, ausente com relatório, na versão histórica e em Concluídos', async () => {
  montar([
    processo('Antes da Revisão', { etapa: 'relatorio_modelagem_tecnica', cartao: SEM_RELATORIO }),
    processo('Na Revisão', { etapa: 'revisao_interna', cartao: SEM_RELATORIO }),
    processo('Na Publicação', { etapa: 'publicacao', cartao: SEM_RELATORIO }),
    processo('Com Relatório', { cartao: { ultimaVersao: { numero: 3, historica: false, temRelatorio: true } } }),
    processo('Versão Histórica', { cartao: { ultimaVersao: { numero: 5, historica: true, temRelatorio: false } } }),
    processo('Concluído', { etapa: 'concluidos', cartao: SEM_RELATORIO, processo: { situacao: 'concluido', publicadoEm: dia(-1) } }),
  ])
  expect(selos(await cartaoDe('Antes da Revisão'))).toEqual(['V3'])
  expect(selos(await cartaoDe('Na Revisão'))).toEqual(['Relatório pendente', 'V3'])
  expect(selos(await cartaoDe('Na Publicação'))).toEqual(['Relatório pendente', 'V3'])
  expect(selos(await cartaoDe('Com Relatório'))).toEqual(['V3'])
  expect(selos(await cartaoDe('Versão Histórica'))).toEqual(['V5F'])
  expect(selos(await cartaoDe('Concluído'))).toEqual(['V3'])
})

test('Sem responsável aparece só sem responsável', async () => {
  montar([processo('Sem Dono', { processo: { responsavel: null } }), processo('Com Dono')])
  expect(selos(await cartaoDe('Sem Dono'))).toEqual(['Sem responsável'])
  expect(selos(await cartaoDe('Com Dono'))).toEqual([])
})

test('Modelagem: hoje, futura com dia e mês, e nada depois que passou nem fora de Não iniciados e da Modelagem piloto', async () => {
  const futura = dia(6)
  const [, mes, diaDoMes] = futura.split('-')
  montar([
    processo('Modelagem Hoje', { etapa: 'modelagem', processo: { dataDaModelagemPiloto: dia(0) } }),
    processo('Modelagem Futura', { etapa: 'nao_iniciados', processo: { dataDaModelagemPiloto: futura } }),
    processo('Modelagem Passada', { etapa: 'modelagem', processo: { dataDaModelagemPiloto: dia(-1) } }),
    processo('Outra Etapa', { etapa: 'revisao_interna', processo: { dataDaModelagemPiloto: futura } }),
  ])
  expect(selos(await cartaoDe('Modelagem Hoje'))).toEqual(['Modelagem hoje'])
  expect(selos(await cartaoDe('Modelagem Futura'))).toEqual([`Modelagem ${diaDoMes}/${mes}`])
  expect(selos(await cartaoDe('Modelagem Passada'))).toEqual([])
  expect(selos(await cartaoDe('Outra Etapa'))).toEqual([])
})

test('versão: V3 e V5F em texto neutro, e nada sem versão', async () => {
  montar([
    processo('Versão Normal', { cartao: { ultimaVersao: { numero: 3, historica: false, temRelatorio: true } } }),
    processo('Versão Histórica', { cartao: { ultimaVersao: { numero: 5, historica: true, temRelatorio: false } } }),
    processo('Sem Versão'),
  ])
  expect(selos(await cartaoDe('Versão Normal'))).toEqual(['V3'])
  expect(selos(await cartaoDe('Versão Histórica'))).toEqual(['V5F'])
  expect(selos(await cartaoDe('Sem Versão'))).toEqual([])
})

test('subprocessos no singular e no plural, sem contar os cancelados (a view já os tira da contagem)', async () => {
  montar([processo('Pai Um', { cartao: { subprocessos: 1 } }), processo('Pai Três', { cartao: { subprocessos: 3 } }), processo('Pai Zero')])
  expect(selos(await cartaoDe('Pai Um'))).toEqual(['1 subprocesso'])
  expect(selos(await cartaoDe('Pai Três'))).toEqual(['3 subprocessos'])
  expect(selos(await cartaoDe('Pai Zero'))).toEqual([])
})

test('a ordem dos selos: dias, Sem responsável, Modelagem, versão e subprocessos', async () => {
  montar([processo('Tudo Junto', {
    etapa: 'modelagem', cartao: { ...SEM_RELATORIO, subprocessos: 2 },
    processo: { entrouNaEtapaEm: dia(-20), responsavel: null, dataDaModelagemPiloto: dia(0) },
  })])
  expect(selos(await cartaoDe('Tudo Junto'))).toEqual([
    '20 dias nesta etapa', 'Sem responsável', 'Modelagem hoje', 'V3', '2 subprocessos',
  ])
})

test('o cartão normal fica limpo: sem selos, mas com a barra', async () => {
  montar([processo('Cartão Normal')])
  const cartao = await cartaoDe('Cartão Normal')
  expect(cartao.querySelector('.cartao-selos')).toBeNull()
  expect(cartao.querySelector('[role="img"]')).not.toBeNull()
})

test('a Consulta vê a mesma barra e os mesmos selos', async () => {
  montar([processo('Para a Consulta', { cartao: SEM_RELATORIO, processo: { entrouNaEtapaEm: dia(-8) } })], 'consulta')
  const cartao = await cartaoDe('Para a Consulta')
  expect(cartao.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe('Etapa 4 de 8: Revisão interna')
  expect(selos(cartao)).toEqual(['8 dias nesta etapa', 'Relatório pendente', 'V3'])
})
