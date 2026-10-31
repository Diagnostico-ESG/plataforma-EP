import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import { USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import { abrirFiltros } from './testes/filtrosDoQuadro'
import { umSetor } from './testes/processoDaLista'
import { cartaoDe, montar, processo } from './testes/quadroDeTeste'
import { VersoesFalso } from './versoes/VersoesFalso'

// "Destacar os meus" (ticket 02 de redesenho-do-quadro, ADR 0037): esmaece os cartões dos outros sem tirá-los da tela e sem
// ligação com o filtro Responsável.

beforeEach(() => {
  window.location.hash = '#/processos'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const EU = { id: USUARIO_DE_TESTE.id, nome: USUARIO_DE_TESTE.nome, fotoUrl: null }
const OUTRA = { id: 'u9', nome: 'Duda Teste', fotoUrl: null }

const meu = (nome: string) => processo(nome, { processo: { responsavel: EU } })
const dela = (nome: string) => processo(nome, { processo: { responsavel: OUTRA } })
const botao = async () => screen.findByRole('button', { name: 'Destacar os meus' })
const esmaecido = async (nome: string) => (await cartaoDe(nome)).classList.contains('cartao-esmaecido')
const nomesNoQuadro = () => Array.from(document.querySelectorAll('.cartao-nome')).map((nome) => nome.textContent)
const filtroResponsavel = async () => within(await abrirFiltros()).getByLabelText('Responsável') as HTMLSelectElement

test('Administrador e Integrante veem o Destacar os meus; a Consulta não', async () => {
  montar([meu('Emitir Ofício')], 'administrador')
  expect((await botao()).getAttribute('aria-pressed')).toBe('false')
  cleanup()
  montar([meu('Emitir Ofício')], 'integrante_ep')
  expect((await botao()).getAttribute('aria-pressed')).toBe('false')
  cleanup()
  montar([meu('Emitir Ofício')], 'consulta')
  await cartaoDe('Emitir Ofício')
  expect(screen.queryByRole('button', { name: 'Destacar os meus' })).toBeNull()
  expect(screen.queryByRole('button', { name: 'Só os meus' })).toBeNull()
})

test('ligar esmaece os cartões dos outros sem tirá-los, anuncia como pressionado e grava no endereço; desligar desfaz', async () => {
  montar([meu('Meu Processo'), dela('Processo Dela')])
  expect(await esmaecido('Meu Processo')).toBe(false)
  fireEvent.click(await botao())
  await waitFor(async () => expect(await esmaecido('Processo Dela')).toBe(true))
  expect(await esmaecido('Meu Processo')).toBe(false)
  expect(nomesNoQuadro()).toEqual(['Meu Processo', 'Processo Dela'])
  expect((await botao()).getAttribute('aria-pressed')).toBe('true')
  expect(window.location.hash).toBe('#/processos?destacar=1')
  fireEvent.click(await botao())
  await waitFor(async () => expect(await esmaecido('Processo Dela')).toBe(false))
  expect((await botao()).getAttribute('aria-pressed')).toBe('false')
  expect(window.location.hash).toBe('#/processos')
})

test('o destaque não mexe no filtro Responsável, e escolher a mim no filtro não liga o destaque', async () => {
  montar([meu('Meu Processo'), dela('Processo Dela')])
  await cartaoDe('Meu Processo')
  fireEvent.click(await botao())
  await waitFor(async () => expect(await esmaecido('Processo Dela')).toBe(true))
  expect((await filtroResponsavel()).value).toBe('')
  fireEvent.click(await botao())
  fireEvent.change(await filtroResponsavel(), { target: { value: EU.id } })
  await waitFor(() => expect(nomesNoQuadro()).toEqual(['Meu Processo']))
  expect((await botao()).getAttribute('aria-pressed')).toBe('false')
})

test('com o filtro Responsável em outra pessoa e o destaque ligado, todos os que sobram ficam esmaecidos, com o aviso', async () => {
  window.location.hash = `#/processos?responsavel=${OUTRA.id}&destacar=1`
  montar([meu('Meu Processo'), dela('Processo Dela')])
  expect(await esmaecido('Processo Dela')).toBe(true)
  expect(nomesNoQuadro()).toEqual(['Processo Dela'])
  expect(screen.getByText('Nenhum processo com você agora.')).toBeTruthy()
})

test('sem nenhum processo meu entre os que aparecem: o aviso fica acima do quadro, que continua na tela, esmaecido', async () => {
  montar([dela('Processo Dela')])
  await cartaoDe('Processo Dela')
  expect(screen.queryByText('Nenhum processo com você agora.')).toBeNull()
  fireEvent.click(await botao())
  const aviso = await screen.findByText('Nenhum processo com você agora.')
  expect(aviso.compareDocumentPosition(await cartaoDe('Processo Dela')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  expect(await esmaecido('Processo Dela')).toBe(true)
  expect(screen.queryByText('Nenhum processo com estes filtros.')).toBeNull()
  fireEvent.click(await botao())
  await waitFor(() => expect(screen.queryByText('Nenhum processo com você agora.')).toBeNull())
})

test('o cartão esmaecido continua um link para o verso e arrastável; o leitor de tela ouve que é de outra pessoa', async () => {
  window.location.hash = '#/processos?destacar=1'
  montar([meu('Meu Processo'), dela('Processo Dela')])
  const dela_ = await cartaoDe('Processo Dela')
  expect(dela_.getAttribute('href')).toContain('#/processos/')
  expect(dela_.getAttribute('draggable')).toBe('true')
  expect(within(dela_).getByText('Processo de outra pessoa.')).toBeTruthy()
  expect(within(await cartaoDe('Meu Processo')).queryByText('Processo de outra pessoa.')).toBeNull()
})

test('vale no Quadro por responsável e no Quadro por setor, e fica no endereço', async () => {
  window.location.hash = '#/processos?agrupar=responsavel&destacar=1'
  montar([meu('Meu Processo'), dela('Processo Dela')])
  expect(await esmaecido('Processo Dela')).toBe(true)
  expect(await esmaecido('Meu Processo')).toBe(false)
  expect((await botao()).getAttribute('aria-pressed')).toBe('true')
  cleanup()
  window.location.hash = '#/processos?agrupar=setor&destacar=1'
  montar([meu('Meu Processo'), dela('Processo Dela')], 'integrante_ep', [], new VersoesFalso(), [umSetor('s1', 'TSA', 'Setor de Testes A')])
  expect(await esmaecido('Processo Dela')).toBe(true)
  expect(await esmaecido('Meu Processo')).toBe(false)
})

test('a Consulta ignora o parâmetro destacar do endereço', async () => {
  window.location.hash = '#/processos?destacar=1'
  montar([meu('Meu Processo'), dela('Processo Dela')], 'consulta')
  expect(await esmaecido('Processo Dela')).toBe(false)
  expect(screen.queryByText('Nenhum processo com você agora.')).toBeNull()
})

test('Limpar filtros não desliga o destaque', async () => {
  window.location.hash = `#/processos?setor=s1&destacar=1`
  montar([meu('Meu Processo'), dela('Processo Dela')])
  await cartaoDe('Meu Processo')
  fireEvent.click(within(await abrirFiltros()).getByRole('button', { name: 'Limpar filtros' }))
  await waitFor(() => expect(window.location.hash).toBe('#/processos?destacar=1'))
  expect((await botao()).getAttribute('aria-pressed')).toBe('true')
  expect(await esmaecido('Processo Dela')).toBe(true)
})
