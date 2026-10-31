import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import type { Perfil } from './acesso/tipos'
import type { ProcessoLido } from './processos/tipos'
import { umSetor } from './testes/processoDaLista'
import { montar, processo } from './testes/quadroDeTeste'
import { opcoesDaColuna } from './testes/cabecalhoDaLista'
import { VersoesFalso } from './versoes/VersoesFalso'

// O controle Situação (Todos | Em andamento | Suspensos | Concluídos | Cancelados) na Lista e no Quadro por setor, no lugar de
// Todos | Concluídos e do "Mostrar cancelados (N)" (ticket 02 de redesenho-do-quadro): o portfólio mostra os concluídos sempre;
// o Quadro por etapa e por responsável não têm o controle.

beforeEach(() => {
  window.location.hash = '#/processos/lista'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const TSA = umSetor('s1', 'TSA', 'Setor de Testes A')
const ABC = umSetor('s2', 'ABC', 'Assessoria Fictícia')
const SETORES = [TSA, ABC]

const noSetor = (setor: typeof TSA, mudancas: Partial<ProcessoLido>) => ({ setorId: setor.id, setorSigla: setor.sigla, ...mudancas })
const andando = (nome: string, setor = TSA) => processo(nome, { etapa: 'modelagem', processo: noSetor(setor, {}) })
const parado = (nome: string, setor = TSA) => processo(nome, { etapa: 'modelagem', processo: noSetor(setor, { situacao: 'suspenso' }) })
const cancelado = (nome: string, setor = TSA) => processo(nome, { etapa: 'modelagem', processo: noSetor(setor, { situacao: 'cancelado' }) })
const concluido = (nome: string, setor = TSA, noQuadro = true) =>
  processo(nome, { etapa: 'concluidos', processo: noSetor(setor, { situacao: 'concluido', etiqueta: 'concluido', noQuadro }) })

const PORTFOLIO = [
  andando('Andando'), parado('Parado', ABC), concluido('Pronto'), concluido('Antigo', ABC, false), cancelado('Desistido'),
]

const abrir = (processos: ProcessoLido[] = PORTFOLIO, perfil: Perfil = 'integrante_ep') =>
  montar(processos, perfil, [], new VersoesFalso(), SETORES)
const textos = (seletor: string) => Array.from(document.querySelectorAll(seletor)).map((elemento) => elemento.textContent)
const naLista = () => textos('.tabela-de-processos tbody .cadastros-abrir')
const botao = (nome: string | RegExp) => screen.findByRole('button', { name: nome })
const esperarALista = () => screen.findAllByRole('cell')
// Abre e fecha o menu da Situação no cabeçalho, devolvendo as opções dele.
async function opcoesDaSituacao(): Promise<string[]> {
  const opcoes = await opcoesDaColuna('Situação')
  fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' })
  return opcoes
}

test('a Lista traz o controle Situação com as cinco opções, abre em Todos e não mostra o cancelado', async () => {
  abrir()
  await esperarALista()
  const grupo = screen.getByRole('group', { name: 'Situação' })
  expect(within(grupo).getAllByRole('button').map((opcao) => opcao.textContent))
    .toEqual(['Todos', 'Em andamento', 'Suspensos', 'Concluídos', 'Cancelados'])
  expect((await botao('Todos')).getAttribute('aria-pressed')).toBe('true')
  expect(naLista()).toEqual(['Andando', 'Antigo', 'Parado', 'Pronto'])
})

test.each([
  ['Em andamento', 'em_andamento', ['Andando']],
  ['Suspensos', 'suspensos', ['Parado']],
  ['Concluídos', 'concluidos', ['Antigo', 'Pronto']],
  ['Cancelados', 'cancelados', ['Desistido']],
])('%s mostra só os processos dessa situação e grava mostrar=%s no endereço; Todos desfaz', async (rotulo, valor, esperados) => {
  abrir()
  await esperarALista()
  fireEvent.click(await botao(rotulo))
  await waitFor(() => expect(naLista()).toEqual(esperados))
  expect(window.location.hash).toBe(`#/processos/lista?mostrar=${valor}`)
  expect((await botao(rotulo)).getAttribute('aria-pressed')).toBe('true')
  fireEvent.click(await botao('Todos'))
  await waitFor(() => expect(naLista()).toHaveLength(4))
  expect(window.location.hash).toBe('#/processos/lista')
})

test('Cancelados mostra o selo da situação na linha, e a linha "Mostrar cancelados (N)" não existe mais', async () => {
  abrir()
  await esperarALista()
  expect(screen.queryByRole('button', { name: /Mostrar cancelados/ })).toBeNull()
  fireEvent.click(await botao('Cancelados'))
  await waitFor(() => expect(naLista()).toEqual(['Desistido']))
  const linha = screen.getByText('Desistido', { selector: '.cadastros-abrir' }).closest('tr') as HTMLElement
  expect(within(linha).getByText('Cancelado')).toBeTruthy()
})

test('com uma situação escolhida o filtro Situação do cabeçalho some; em Todos ele volta, sem Cancelado', async () => {
  abrir()
  await esperarALista()
  expect(await opcoesDaSituacao()).toEqual(['Crescente', 'Decrescente', 'Todas', 'Em andamento', 'Suspenso', 'Concluído'])
  fireEvent.click(await botao('Suspensos'))
  await waitFor(() => expect(naLista()).toEqual(['Parado']))
  expect(await opcoesDaSituacao()).toEqual(['Crescente', 'Decrescente'])
})

test('o endereço antigo mostrar=concluidos abre a Lista já em Concluídos', async () => {
  window.location.hash = '#/processos/lista?mostrar=concluidos'
  abrir()
  await esperarALista()
  expect(naLista()).toEqual(['Antigo', 'Pronto'])
  expect((await botao('Concluídos')).getAttribute('aria-pressed')).toBe('true')
})

test('o Quadro por setor traz o controle, mostra os concluídos sempre e, escolhida uma situação, só ela', async () => {
  window.location.hash = '#/processos?agrupar=setor'
  abrir()
  await screen.findByText('Antigo', { selector: '.cartao-nome' })
  expect((await botao('Todos')).getAttribute('aria-pressed')).toBe('true')
  expect(textos('.cartao-nome').sort()).toEqual(['Andando', 'Antigo', 'Parado', 'Pronto'])
  fireEvent.click(await botao('Concluídos'))
  await waitFor(() => expect(textos('.cartao-nome').sort()).toEqual(['Antigo', 'Pronto']))
  expect(window.location.hash).toBe('#/processos?agrupar=setor&mostrar=concluidos')
  expect(screen.getByRole('region', { name: 'TSA · Setor de Testes A' })).toBeTruthy()
  fireEvent.click(await botao('Cancelados'))
  await waitFor(() => expect(textos('.cartao-nome')).toEqual(['Desistido']))
})

test('o Quadro por etapa e por responsável não têm o controle Situação', async () => {
  window.location.hash = '#/processos'
  abrir()
  await screen.findByText('Andando', { selector: '.cartao-nome' })
  expect(screen.queryByRole('group', { name: 'Situação' })).toBeNull()
  cleanup()
  window.location.hash = '#/processos?agrupar=responsavel'
  abrir()
  await screen.findByText('Andando', { selector: '.cartao-nome' })
  expect(screen.queryByRole('group', { name: 'Situação' })).toBeNull()
  expect(textos('.cartao-nome')).not.toContain('Desistido')
})

const SEM_ELA = {
  em_andamento: [parado('Parado'), concluido('Pronto'), cancelado('Desistido')],
  suspensos: [andando('Andando'), concluido('Pronto'), cancelado('Desistido')],
  concluidos: [andando('Andando'), parado('Parado'), cancelado('Desistido')],
  cancelados: [andando('Andando'), parado('Parado'), concluido('Pronto')],
}

test.each([
  ['em_andamento', 'Em andamento', 'Nenhum processo em andamento.'],
  ['suspensos', 'Suspensos', 'Nenhum processo suspenso.'],
  ['concluidos', 'Concluídos', 'Nenhum processo concluído.'],
  ['cancelados', 'Cancelados', 'Nenhum processo cancelado.'],
] as const)('situação %s sem processos mostra a frase dela com [Mostrar todos], e Mostrar todos volta a Todos', async (valor, rotulo, frase) => {
  window.location.hash = `#/processos/lista?mostrar=${valor}`
  abrir(SEM_ELA[valor])
  expect(await screen.findByText(frase)).toBeTruthy()
  expect(screen.queryByText('Nenhum processo com estes filtros.')).toBeNull()
  expect((await botao(rotulo)).getAttribute('aria-pressed')).toBe('true')
  fireEvent.click(screen.getByRole('button', { name: 'Mostrar todos' }))
  await waitFor(() => expect(window.location.hash).toBe('#/processos/lista'))
  expect(naLista().length).toBeGreaterThan(0)
})

test('a situação tem processos mas os filtros escondem todos: vale a frase dos filtros', async () => {
  window.location.hash = '#/processos/lista?mostrar=suspensos&setor=s1'
  abrir()
  expect(await screen.findByText('Nenhum processo com estes filtros.')).toBeTruthy()
  expect(screen.queryByText('Nenhum processo suspenso.')).toBeNull()
})

test('a Consulta vê o controle Situação e os cancelados, sem botões de alteração', async () => {
  abrir(PORTFOLIO, 'consulta')
  await esperarALista()
  fireEvent.click(await botao('Cancelados'))
  await waitFor(() => expect(naLista()).toEqual(['Desistido']))
  expect(screen.queryByRole('button', { name: 'Cadastrar processo' })).toBeNull()
})
