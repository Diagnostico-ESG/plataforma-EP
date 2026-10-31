import { cleanup, fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import { umSetor } from './testes/processoDaLista'
import { cartaoDe, dia, montar, processo } from './testes/quadroDeTeste'
import { VersoesFalso } from './versoes/VersoesFalso'

beforeEach(() => {
  window.location.hash = '#/processos'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const selos = (cartao: HTMLElement) => Array.from(cartao.querySelectorAll('.cartao-selos > *')).map((selo) => selo.textContent)

const porResponsavel = async () => fireEvent.click(await screen.findByRole('button', { name: 'Responsável' }))
const barraDe = (cartao: HTMLElement) => cartao.querySelector('.barra-etapa')

const SEM_RELATORIO = { ultimaVersao: { numero: 3, historica: false, temRelatorio: false } }

// ---- A barra e a etiqueta

test('por etapa o cartão não traz a barra; a coluna já diz a etapa', async () => {
  montar([processo('Emitir Ofício', { etapa: 'revisao_interna' })])
  expect(barraDe(await cartaoDe('Emitir Ofício'))).toBeNull()
})

// Um tracinho por etapa: os feitos, o atual e os futuros, nesta ordem.
const tracinhosDe = (barra: Element | null) => Array.from(barra?.querySelectorAll('.barra-etapa-tracinho') ?? []).map((tracinho) => tracinho.getAttribute('data-estado'))

test('por responsável a barra diz "Nome · n de N", é uma faixa lisa preenchida até a etapa atual e tem o nome acessível', async () => {
  montar([processo('Emitir Ofício', { etapa: 'revisao_interna' })])
  await cartaoDe('Emitir Ofício')
  await porResponsavel()
  const barra = barraDe(await cartaoDe('Emitir Ofício'))
  expect(barra?.getAttribute('aria-label')).toBe('Etapa 4 de 8: Revisão interna')
  expect(barra?.querySelector('.barra-etapa-texto')?.textContent).toBe('Revisão interna · 4 de 8')
  expect(barra?.querySelectorAll('.barra-etapa-trilho')).toHaveLength(1)
  expect(tracinhosDe(barra)).toEqual(['feito', 'feito', 'feito', 'atual', 'futuro', 'futuro', 'futuro', 'futuro'])
})

test('em Não iniciados só o primeiro tracinho é o atual', async () => {
  montar([processo('Novo', { etapa: 'nao_iniciados' })])
  await cartaoDe('Novo')
  await porResponsavel()
  expect(tracinhosDe(barraDe(await cartaoDe('Novo')))).toEqual(['atual', 'futuro', 'futuro', 'futuro', 'futuro', 'futuro', 'futuro', 'futuro'])
})

// O Quadro por responsável não mostra concluídos (ticket 03 de repositorio-de-processos): a barra cheia se vê por setor.
test('em Concluídos o último tracinho é o atual e os outros estão feitos', async () => {
  montar([processo('Pronto', { etapa: 'concluidos', processo: { situacao: 'concluido', etiqueta: 'concluido' } })], 'integrante_ep', [],
    new VersoesFalso(), [umSetor('s1', 'TSA', 'Setor de Testes A')])
  await cartaoDe('Pronto')
  fireEvent.click(await screen.findByRole('button', { name: 'Setor' }))
  const barra = barraDe(await cartaoDe('Pronto'))
  expect(barra?.getAttribute('aria-label')).toBe('Etapa 8 de 8: Concluídos')
  expect(tracinhosDe(barra)).toEqual(['feito', 'feito', 'feito', 'feito', 'feito', 'feito', 'feito', 'atual'])
})

test('o processo suspenso mostra a barra da etapa onde parou, com a pílula Suspenso', async () => {
  montar([processo('Suspenso Teste', { processo: { situacao: 'suspenso' } })])
  await cartaoDe('Suspenso Teste')
  await porResponsavel()
  const cartao = await cartaoDe('Suspenso Teste')
  expect(barraDe(cartao)?.getAttribute('aria-label')).toBe('Etapa 4 de 8: Revisão interna')
  expect(cartao.textContent).toContain('Suspenso')
})

test('a etiqueta é só o ícone, com o nome no title e no texto para leitor de tela, e a linha do responsável', async () => {
  montar([
    processo('A Fazer'), processo('Em Andamento', { processo: { etiqueta: 'em_andamento' } }),
    processo('Feita', { processo: { etiqueta: 'concluido' } }),
  ])
  for (const [nome, etiqueta, classe] of [['A Fazer', 'A fazer', 'a_fazer'], ['Em Andamento', 'Iniciado', 'em_andamento'], ['Feita', 'Finalizado', 'concluido']]) {
    const cartao = await cartaoDe(nome)
    const icone = cartao.querySelector('.etiqueta')
    expect(icone?.textContent).toBe(etiqueta)
    expect(icone?.className).toContain(`etiqueta-${classe}`)
    expect(icone?.getAttribute('title')).toBe(`Etiqueta: ${etiqueta}`)
    expect(icone?.querySelector('svg')).not.toBeNull()
    expect(cartao.querySelector('.cartao-responsavel')?.textContent).toBe('Ana Teste')
  }
})

test('a barra do Quadro traz a legenda das etiquetas uma vez só, com ícone e nome; a Lista não', async () => {
  montar([processo('A Fazer'), processo('Outro')])
  const legenda = await screen.findByRole('list', { name: 'Legenda das etiquetas' })
  expect(screen.getAllByRole('list', { name: 'Legenda das etiquetas' })).toHaveLength(1)
  expect(legenda.closest('.quadro-barra')).not.toBeNull()
  const itens = Array.from(legenda.querySelectorAll('li'))
  expect(itens.map((item) => item.textContent)).toEqual(['A fazer', 'Iniciado', 'Finalizado'])
  expect(itens.every((item) => item.querySelector('svg'))).toBe(true)
  cleanup()
  window.location.hash = '#/processos/lista'
  montar([processo('A Fazer')])
  await screen.findByRole('cell', { name: 'A Fazer' })
  expect(screen.queryByRole('list', { name: 'Legenda das etiquetas' })).toBeNull()
})

// ---- Selos
test('o selo do setor no cartão diz o nome do setor, no title e para o leitor de tela', async () => {
  montar([processo('Com Setor')], 'integrante_ep', [], new VersoesFalso(), [umSetor('s1', 'TSA', 'Setor de Testes A')])
  const selo = (await cartaoDe('Com Setor')).querySelector('.selo-do-setor')
  expect(selo?.getAttribute('title')).toBe('Setor de Testes A')
  expect(selo?.getAttribute('aria-label')).toBe('Setor de Testes A')
})

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
  const oito = await cartaoDe('Oito Dias')
  expect(selos(oito)).toEqual(['8 dias nesta etapa'])
  // Sem fundo: ícone e texto, em vermelho.
  expect(oito.querySelector('.cartao-selos .pilula')).toBeNull()
  expect(oito.querySelector('.cartao-selos .selo-atraso svg')).not.toBeNull()
  expect(oito.className).toContain('cartao-parado')
  expect((await cartaoDe('Sete Dias')).className).not.toContain('cartao-parado')
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
  expect((await cartaoDe('Na Revisão')).querySelector('.cartao-selos .selo-vencendo svg')).not.toBeNull()
  expect(selos(await cartaoDe('Na Publicação'))).toEqual(['Relatório pendente', 'V3'])
  expect(selos(await cartaoDe('Com Relatório'))).toEqual(['V3'])
  expect(selos(await cartaoDe('Versão Histórica'))).toEqual(['V5F'])
  expect(selos(await cartaoDe('Concluído'))).toEqual(['V3'])
})

test('o cartão sem responsável diz "Sem responsável" em cinza; o com responsável traz o nome, sem avatar', async () => {
  montar([processo('Sem Dono', { processo: { responsavel: null } }), processo('Com Dono')])
  const semDono = await cartaoDe('Sem Dono')
  expect(semDono.querySelector('.cartao-selos')).toBeNull()
  expect(semDono.querySelector('.avatar')).toBeNull()
  expect(semDono.querySelector('.cartao-responsavel-vazio')?.textContent).toBe('Sem responsável')
  const comDono = await cartaoDe('Com Dono')
  expect(comDono.querySelector('.avatar')).toBeNull()
  expect(comDono.querySelector('.cartao-responsavel')?.textContent).toBe('Ana Teste')
})

test('nenhum cartão mostra a data da modelagem piloto, no passado, hoje ou no futuro', async () => {
  montar([
    processo('Modelagem Hoje', { etapa: 'modelagem', processo: { dataDaModelagemPiloto: dia(0) } }),
    processo('Modelagem Futura', { etapa: 'nao_iniciados', processo: { dataDaModelagemPiloto: dia(6) } }),
    processo('Modelagem Passada', { etapa: 'modelagem', processo: { dataDaModelagemPiloto: dia(-1) } }),
  ])
  for (const nome of ['Modelagem Hoje', 'Modelagem Futura', 'Modelagem Passada']) {
    const cartao = await cartaoDe(nome)
    expect(selos(cartao)).toEqual([])
    expect(cartao.textContent).not.toMatch(/Modelagem (hoje|\d)/)
  }
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

test('a ordem dos selos: dias, versão e subprocessos', async () => {
  montar([processo('Tudo Junto', {
    etapa: 'modelagem', cartao: { ...SEM_RELATORIO, subprocessos: 2 },
    processo: { entrouNaEtapaEm: dia(-20), responsavel: null, dataDaModelagemPiloto: dia(0) },
  })])
  expect(selos(await cartaoDe('Tudo Junto'))).toEqual(['20 dias nesta etapa', 'V3', '2 subprocessos'])
})

test('o cartão normal fica limpo: sem selos, sem faixa de parado e sem barra por etapa', async () => {
  montar([processo('Cartão Normal')])
  const cartao = await cartaoDe('Cartão Normal')
  expect(cartao.querySelector('.cartao-selos')).toBeNull()
  expect(cartao.className).not.toContain('cartao-parado')
})

test('a Consulta vê os mesmos selos e a mesma faixa de parado', async () => {
  montar([processo('Para a Consulta', { cartao: SEM_RELATORIO, processo: { entrouNaEtapaEm: dia(-8) } })], 'consulta')
  const cartao = await cartaoDe('Para a Consulta')
  expect(cartao.className).toContain('cartao-parado')
  expect(selos(cartao)).toEqual(['8 dias nesta etapa', 'Relatório pendente', 'V3'])
})
