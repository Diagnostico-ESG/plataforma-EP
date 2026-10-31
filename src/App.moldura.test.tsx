import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from './App'
import type { Perfil } from './acesso/tipos'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import { PlanilhasFalso } from './planilhas/PlanilhasFalso'
import { ProcessosFalso } from './processos/ProcessosFalso'
import { RevisoesFalso } from './revisoes/RevisoesFalso'
import { VersoesFalso } from './versoes/VersoesFalso'

beforeEach(() => {
  window.location.hash = ''
  sessionStorage.clear()
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function montar(perfil: Perfil = 'integrante_ep') {
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })} cadastros={new CadastrosFalso()} processos={new ProcessosFalso()}
    versoes={new VersoesFalso()} revisoes={new RevisoesFalso()} planilhas={new PlanilhasFalso()} />)
}

const faixa = async () => within(await screen.findByRole('navigation', { name: 'Áreas do sistema' }))
const rotulos = (navegacao: HTMLElement) => Array.from(navegacao.querySelectorAll('button')).map((b) => b.getAttribute('aria-label'))

test('a faixa lateral tem Processos, Setores, Painel, Administração e Ajuda para o Administrador', async () => {
  montar('administrador')
  const navegacao = await screen.findByRole('navigation', { name: 'Áreas do sistema' })
  expect(rotulos(navegacao)).toEqual(['Processos', 'Setores', 'Painel', 'Administração', 'Ajuda'])
})

test.each<Perfil>(['integrante_ep', 'consulta'])('para %s, a faixa lateral não tem Administração', async (perfil) => {
  montar(perfil)
  const navegacao = await screen.findByRole('navigation', { name: 'Áreas do sistema' })
  expect(rotulos(navegacao)).toEqual(['Processos', 'Setores', 'Painel', 'Ajuda'])
})

test('na Lista, Processos fica marcado como a tela atual', async () => {
  window.location.hash = '#/processos/lista'
  montar()
  expect((await faixa()).getByRole('button', { name: 'Processos' }).getAttribute('aria-current')).toBe('page')
})

test('Processos volta à última forma de ver da sessão', async () => {
  window.location.hash = '#/processos?agrupar=setor'
  montar()
  await screen.findByRole('region', { name: 'Processos' })
  fireEvent.click((await faixa()).getByRole('button', { name: 'Setores' }))
  await waitFor(() => expect(window.location.hash).toBe('#/setores'))
  fireEvent.click((await faixa()).getByRole('button', { name: 'Processos' }))
  await waitFor(() => expect(window.location.hash).toBe('#/processos?agrupar=setor'))
})

test('sem forma de ver guardada, Processos abre o Quadro por etapa', async () => {
  window.location.hash = '#/setores'
  montar()
  fireEvent.click((await faixa()).getByRole('button', { name: 'Processos' }))
  await waitFor(() => expect(window.location.hash).toBe('#/processos'))
})

test('com o armazenamento da sessão bloqueado, Processos abre o Quadro por etapa', async () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('bloqueado') })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('bloqueado') })
  window.location.hash = '#/setores'
  montar()
  fireEvent.click((await faixa()).getByRole('button', { name: 'Processos' }))
  await waitFor(() => expect(window.location.hash).toBe('#/processos'))
})

test('Painel abre a tela Em breve e fica marcado', async () => {
  montar()
  fireEvent.click((await faixa()).getByRole('button', { name: 'Painel' }))
  expect(await screen.findByText('Em breve: o Painel com os números do EP chega na v1.5.')).toBeTruthy()
  expect((await faixa()).getByRole('button', { name: 'Painel' }).getAttribute('aria-current')).toBe('page')
})

test('Ajuda abre a tela Em breve', async () => {
  montar()
  fireEvent.click((await faixa()).getByRole('button', { name: 'Ajuda' }))
  expect(await screen.findByText('Em breve: a Ajuda da plataforma.')).toBeTruthy()
  expect(window.location.hash).toBe('#/ajuda')
})

test('a barra de cima não tem mais Quadro | Lista', async () => {
  montar()
  await screen.findByRole('heading', { name: 'Processos' })
  expect(screen.queryByRole('group', { name: 'Forma de ver os processos' })).toBeNull()
})

test.each(['Buscar', 'Notificações'])('%s mostra o aviso Em breve', async (rotulo) => {
  montar()
  const barra = within(await screen.findByRole('banner'))
  fireEvent.click(barra.getByRole('button', { name: rotulo }))
  expect(barra.getByRole('status').textContent).toBe('Em breve')
})
