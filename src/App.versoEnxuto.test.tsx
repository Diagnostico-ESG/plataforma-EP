import { cleanup, within } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import { montarVerso, processoLido } from './testes/processoNoVerso'
import { versoAberto } from './testes/versoDoCartao'

// O verso enxuto (ticket 04 de redesenho-do-quadro): a ação principal da etapa atual no cabeçalho, a linha de dados e a
// linha dos campos da etapa.

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const cabecalho = async () => within((await versoAberto()).getByRole('banner'))
const botoesDoCabecalho = async () => (await cabecalho()).queryAllByRole('button').map((botao) => botao.textContent ?? '')
const CONCLUIDO = { situacao: 'concluido', etiqueta: 'concluido', publicadoEm: null } as const

test.each([
  ['revisao_interna', 'Registrar revisão', {}],
  ['aprovacao_setor', 'Registrar aprovação', {}],
  ['publicacao', 'Registrar publicação', {}],
  ['concluidos', 'Registrar publicação', CONCLUIDO],
])('na etapa %s o cabeçalho tem o botão %s, e o Agora não', async (etapa, rotulo, mudancas) => {
  montarVerso(processoLido(mudancas, etapa))
  expect(await (await cabecalho()).findByRole('button', { name: rotulo })).toBeTruthy()
  const agora = within(await (await versoAberto()).findByRole('region', { name: /^Agora/ }))
  expect(agora.queryByRole('button', { name: rotulo })).toBeNull()
})

test('o botão do cabeçalho é o azul cheio da etapa e abre a janela de registro', async () => {
  montarVerso(processoLido({}, 'revisao_interna'))
  const botao = await (await cabecalho()).findByRole('button', { name: 'Registrar revisão' })
  expect(botao.className).toContain('botao-principal')
})

test.each(['nao_iniciados', 'modelagem', 'relatorio_modelagem_tecnica', 'revisao_setor'])(
  'na etapa %s o cabeçalho não tem botão azul', async (etapa) => {
    montarVerso(processoLido({}, etapa))
    await versoAberto()
    expect((await botoesDoCabecalho()).filter((nome) => nome.startsWith('Registrar'))).toEqual([])
    expect((await cabecalho()).queryAllByRole('button').filter((botao) => botao.className.includes('botao-principal'))).toEqual([])
  },
)

test('a Consulta vê o verso sem ação principal em nenhuma etapa', async () => {
  montarVerso(processoLido({}, 'revisao_interna'), 'consulta')
  await versoAberto()
  expect(await botoesDoCabecalho()).not.toContain('Registrar revisão')
  expect((await botoesDoCabecalho()).some((nome) => nome.startsWith('Registrar'))).toBe(false)
})

// Linha de dados

test('a linha de dados do cabeçalho traz setor, macroprocesso, tipo e situação', async () => {
  montarVerso(processoLido())
  const dados = within((await cabecalho()).getByRole('region', { name: 'Sobre' }))
  expect(dados.getAllByRole('term').map((rotulo) => rotulo.textContent)).toEqual(['Setor', 'Macroprocesso', 'Tipo', 'Situação'])
})

test('o subprocesso mostra o pai no cabeçalho, como link', async () => {
  const pai = processoLido({ id: 'p1', nome: 'Emitir Ofício' })
  window.location.hash = '#/processos/p2'
  montarVerso(processoLido({ id: 'p2', nome: 'Conferir Ofício', tipo: 'subprocesso', processoPaiId: 'p1' }), 'integrante_ep', [pai])
  const faz = within(await (await cabecalho()).findByRole('region', { name: 'Faz parte de' }))
  expect(faz.getByRole('link', { name: 'Emitir Ofício' }).getAttribute('href')).toBe('#/processos/p1')
})

// Campos da etapa

const camposDaEtapa = async () => (await versoAberto()).findByRole('region', { name: /^Agora/ }).then((agora) => agora.querySelector('.agora-campos') as HTMLElement)

test('a Modelagem piloto mostra a Data da modelagem piloto na linha dos campos', async () => {
  montarVerso(processoLido({}, 'modelagem'))
  expect(within(await camposDaEtapa()).getByRole('button', { name: 'Registrar data' })).toBeTruthy()
})

test('a Validação com o setor mostra a data da validação na linha dos campos', async () => {
  montarVerso(processoLido({}, 'revisao_setor'))
  expect(within(await camposDaEtapa()).getByLabelText('Data da validação')).toBeTruthy()
})

test('uma etapa sem campos próprios deixa a linha dos campos vazia', async () => {
  montarVerso(processoLido({}, 'nao_iniciados'))
  expect((await camposDaEtapa()).childElementCount).toBe(0)
})
