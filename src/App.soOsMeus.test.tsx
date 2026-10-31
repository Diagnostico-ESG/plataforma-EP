import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import { USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import { abrirFiltros } from './testes/filtrosDoQuadro'
import { botaoDaFormaDeVer } from './testes/formaDeVer'
import { cartaoDe, montar, processo } from './testes/quadroDeTeste'

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
const botao = async () => screen.findByRole('button', { name: 'Só os meus' })
const nomesNoQuadro = () => Array.from(document.querySelectorAll('.cartao-nome')).map((nome) => nome.textContent)
const filtroResponsavel = async () => within(await abrirFiltros()).getByLabelText('Responsável') as HTMLSelectElement

test('Administrador e Integrante veem o Só os meus; a Consulta não', async () => {
  montar([meu('Emitir Ofício')], 'administrador')
  expect((await botao()).getAttribute('aria-pressed')).toBe('false')
  cleanup()
  montar([meu('Emitir Ofício')], 'integrante_ep')
  expect((await botao()).getAttribute('aria-pressed')).toBe('false')
  cleanup()
  montar([meu('Emitir Ofício')], 'consulta')
  await cartaoDe('Emitir Ofício')
  expect(screen.queryByRole('button', { name: 'Só os meus' })).toBeNull()
})

test('ligar deixa só os meus, põe o filtro Responsável em mim e grava no endereço; desligar desfaz', async () => {
  montar([meu('Meu Processo'), dela('Processo Dela')])
  fireEvent.click(await botao())
  await waitFor(() => expect(nomesNoQuadro()).toEqual(['Meu Processo']))
  expect((await botao()).getAttribute('aria-pressed')).toBe('true')
  expect((await filtroResponsavel()).value).toBe(EU.id)
  expect(window.location.hash).toBe(`#/processos?responsavel=${EU.id}`)
  fireEvent.click(await botao())
  await waitFor(() => expect(nomesNoQuadro()).toEqual(['Meu Processo', 'Processo Dela']))
  expect((await botao()).getAttribute('aria-pressed')).toBe('false')
  expect((await filtroResponsavel()).value).toBe('')
  expect(window.location.hash).toBe('#/processos')
})

test('escolher a mim no filtro Responsável liga o botão; outra pessoa ou Todos desliga', async () => {
  montar([meu('Meu Processo'), dela('Processo Dela')])
  await cartaoDe('Meu Processo')
  fireEvent.change((await filtroResponsavel()), { target: { value: EU.id } })
  await waitFor(() => expect(screen.getByRole('button', { name: 'Só os meus' }).getAttribute('aria-pressed')).toBe('true'))
  fireEvent.change((await filtroResponsavel()), { target: { value: OUTRA.id } })
  await waitFor(() => expect(screen.getByRole('button', { name: 'Só os meus' }).getAttribute('aria-pressed')).toBe('false'))
  fireEvent.change((await filtroResponsavel()), { target: { value: EU.id } })
  fireEvent.change((await filtroResponsavel()), { target: { value: '' } })
  await waitFor(() => expect(screen.getByRole('button', { name: 'Só os meus' }).getAttribute('aria-pressed')).toBe('false'))
})

test('sem nenhum processo meu e sem outros filtros: a mensagem própria, e Ver todos desliga o Só os meus', async () => {
  montar([dela('Processo Dela')])
  fireEvent.click(await botao())
  expect(await screen.findByText('Nenhum processo com você agora.')).toBeTruthy()
  expect(screen.queryByText('Nenhum processo com estes filtros.')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Ver todos' }))
  await cartaoDe('Processo Dela')
  expect(screen.getByRole('button', { name: 'Só os meus' }).getAttribute('aria-pressed')).toBe('false')
  expect(screen.queryByText('Nenhum processo com você agora.')).toBeNull()
})

test('sem nenhum processo meu mas com outro filtro ligado: vale a mensagem dos filtros', async () => {
  window.location.hash = `#/processos?setor=s1&responsavel=${EU.id}`
  montar([dela('Processo Dela')])
  expect(await screen.findByText('Nenhum processo com estes filtros.')).toBeTruthy()
  expect(screen.queryByText('Nenhum processo com você agora.')).toBeNull()
  expect(screen.getAllByRole('button', { name: 'Limpar filtros' }).length).toBeGreaterThan(0)
})

test('Limpar filtros desliga o Só os meus junto com os outros filtros e mantém o agrupamento', async () => {
  window.location.hash = `#/processos?setor=s1&responsavel=${EU.id}&agrupar=responsavel`
  montar([meu('Meu Processo'), dela('Processo Dela')])
  await cartaoDe('Meu Processo')
  fireEvent.click(within(await abrirFiltros()).getByRole('button', { name: 'Limpar filtros' }))
  await waitFor(() => expect(window.location.hash).toBe('#/processos?agrupar=responsavel'))
  expect(screen.getByRole('button', { name: 'Só os meus' }).getAttribute('aria-pressed')).toBe('false')
  expect((await botaoDaFormaDeVer()).textContent).toContain('Quadro por responsável')
  await cartaoDe('Processo Dela')
})

test('Só os meus com o Quadro por responsável deixa só a minha coluna', async () => {
  window.location.hash = '#/processos?agrupar=responsavel'
  montar([meu('Meu Processo'), dela('Processo Dela')])
  await cartaoDe('Meu Processo')
  fireEvent.click(await botao())
  await waitFor(() => expect(screen.queryByRole('region', { name: OUTRA.nome })).toBeNull())
  expect(screen.getByRole('region', { name: EU.nome })).toBeTruthy()
})
