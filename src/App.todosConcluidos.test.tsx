import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import type { Perfil } from './acesso/tipos'
import type { ProcessoLido } from './processos/tipos'
import { umSetor } from './testes/processoDaLista'
import { montar, processo } from './testes/quadroDeTeste'
import { VersoesFalso } from './versoes/VersoesFalso'

// Todos | Concluídos na Lista e no Quadro por setor, e os cancelados fora de tudo até alguém pedir (ticket 02 de
// repositorio-de-processos): o portfólio mostra os concluídos sempre; o Quadro por etapa e por responsável não têm o par.

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
const naLista = () => textos('.tabela-de-processos tbody:not(.bloco-de-cancelados) .cadastros-abrir')
const noBlocoDosCancelados = () => textos('.bloco-de-cancelados .cadastros-abrir')
const botao = (nome: string | RegExp) => screen.findByRole('button', { name: nome })
const esperarALista = () => screen.findAllByRole('cell')

test('a Lista traz o par Todos | Concluídos, abre em Todos e não mostra o cancelado', async () => {
  abrir()
  await esperarALista()
  expect((await botao('Todos')).getAttribute('aria-pressed')).toBe('true')
  expect((await botao('Concluídos')).getAttribute('aria-pressed')).toBe('false')
  expect(naLista()).toEqual(['Andando', 'Antigo', 'Parado', 'Pronto'])
})

test('Concluídos mostra só os concluídos, põe mostrar=concluidos no endereço e esconde o filtro Situação; Todos desfaz', async () => {
  abrir()
  await esperarALista()
  expect(screen.getByLabelText('Situação')).toBeTruthy()
  fireEvent.click(await botao('Concluídos'))
  await waitFor(() => expect(naLista()).toEqual(['Antigo', 'Pronto']))
  expect(window.location.hash).toBe('#/processos/lista?mostrar=concluidos')
  expect((await botao('Concluídos')).getAttribute('aria-pressed')).toBe('true')
  expect(screen.queryByLabelText('Situação')).toBeNull()
  fireEvent.click(await botao('Todos'))
  await waitFor(() => expect(naLista()).toHaveLength(4))
  expect(window.location.hash).toBe('#/processos/lista')
  expect(screen.getByLabelText('Situação')).toBeTruthy()
})

test('recarregar com mostrar=concluidos abre a Lista já em Concluídos', async () => {
  window.location.hash = '#/processos/lista?mostrar=concluidos'
  abrir()
  await esperarALista()
  expect(naLista()).toEqual(['Antigo', 'Pronto'])
  expect((await botao('Concluídos')).getAttribute('aria-pressed')).toBe('true')
})

test('o filtro Situação não oferece Cancelado', async () => {
  abrir()
  await esperarALista()
  const opcoes = Array.from((screen.getByLabelText('Situação') as HTMLSelectElement).options).map((opcao) => opcao.textContent)
  expect(opcoes).toEqual(['Todas', 'Em andamento', 'Suspenso', 'Concluído'])
})

test('o Quadro por setor traz o par, mostra os concluídos sempre e, em Concluídos, só eles', async () => {
  window.location.hash = '#/processos?agrupar=setor'
  abrir()
  await screen.findByText('Antigo', { selector: '.cartao-nome' })
  expect((await botao('Todos')).getAttribute('aria-pressed')).toBe('true')
  expect(textos('.cartao-nome').sort()).toEqual(['Andando', 'Antigo', 'Parado', 'Pronto'])
  fireEvent.click(await botao('Concluídos'))
  await waitFor(() => expect(textos('.cartao-nome').sort()).toEqual(['Antigo', 'Pronto']))
  expect(window.location.hash).toBe('#/processos?agrupar=setor&mostrar=concluidos')
  expect(screen.getByRole('region', { name: 'TSA · Setor de Testes A' })).toBeTruthy()
})

test('o Quadro por etapa e por responsável não têm o par Todos | Concluídos', async () => {
  window.location.hash = '#/processos'
  abrir()
  await screen.findByText('Andando', { selector: '.cartao-nome' })
  expect(screen.queryByRole('button', { name: 'Concluídos' })).toBeNull()
  cleanup()
  window.location.hash = '#/processos?agrupar=responsavel'
  abrir()
  await screen.findByText('Andando', { selector: '.cartao-nome' })
  expect(screen.queryByRole('button', { name: 'Concluídos' })).toBeNull()
  expect(textos('.cartao-nome')).not.toContain('Desistido')
})

test('"Mostrar cancelados (N)" abre o bloco Cancelados no fim da Lista e "Esconder cancelados" o fecha, sem mexer no endereço', async () => {
  abrir([...PORTFOLIO, cancelado('Desistido Dois', ABC)])
  await esperarALista()
  fireEvent.click(await botao('Mostrar cancelados (2)'))
  expect(noBlocoDosCancelados()).toEqual(['Desistido', 'Desistido Dois'])
  expect(within(document.querySelector('.bloco-de-cancelados') as HTMLElement).getByText('Cancelados')).toBeTruthy()
  expect(window.location.hash).toBe('#/processos/lista')
  fireEvent.click(await botao('Esconder cancelados'))
  await waitFor(() => expect(noBlocoDosCancelados()).toEqual([]))
  expect(await botao('Mostrar cancelados (2)')).toBeTruthy()
})

test('o N dos cancelados respeita os filtros', async () => {
  window.location.hash = '#/processos/lista?setor=s2'
  abrir([...PORTFOLIO, cancelado('Desistido Dois', ABC)])
  await esperarALista()
  expect(await botao('Mostrar cancelados (1)')).toBeTruthy()
})

test('com Concluídos a linha dos cancelados some, e sem cancelado nenhum ela não existe', async () => {
  window.location.hash = '#/processos/lista?mostrar=concluidos'
  abrir()
  await esperarALista()
  expect(screen.queryByRole('button', { name: /cancelados/ })).toBeNull()
  cleanup()
  window.location.hash = '#/processos/lista'
  abrir([andando('Andando')])
  await esperarALista()
  expect(screen.queryByRole('button', { name: /cancelados/ })).toBeNull()
})

test('Concluídos sem nenhum concluído diz que não há processo e o Limpar filtros volta para Todos', async () => {
  window.location.hash = '#/processos/lista?mostrar=concluidos'
  abrir([andando('Andando')])
  expect(await screen.findByText('Nenhum processo com estes filtros.')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }))
  await waitFor(() => expect(window.location.hash).toBe('#/processos/lista'))
  expect(await screen.findByText('Andando', { selector: '.cadastros-abrir' })).toBeTruthy()
})

test('a Consulta vê o par e o bloco de cancelados, sem botões de alteração', async () => {
  abrir(PORTFOLIO, 'consulta')
  await esperarALista()
  expect(await botao('Todos')).toBeTruthy()
  fireEvent.click(await botao('Mostrar cancelados (1)'))
  expect(noBlocoDosCancelados()).toEqual(['Desistido'])
  expect(screen.queryByRole('button', { name: 'Cadastrar processo' })).toBeNull()
})
