import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import { botaoDaFormaDeVer, escolherFormaDeVer, faixaDeControles } from './testes/formaDeVer'
import { cartaoDe, montar, processo } from './testes/quadroDeTeste'

beforeEach(() => {
  window.location.hash = '#/processos'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const itens = () => within(screen.getByRole('menu', { name: 'Forma de ver' })).getAllByRole('menuitemradio')

test('"Quadro ▾" mostra a forma escolhida e abre o menu com as quatro formas, a atual marcada', async () => {
  montar([processo('Emitir Ofício')])
  const botao = await botaoDaFormaDeVer()
  expect(botao.textContent).toContain('Quadro por etapa')
  fireEvent.click(botao)
  expect(itens().map((item) => item.textContent)).toEqual(['Quadro por etapa', 'Quadro por responsável', 'Quadro por setor', 'Lista'])
  expect(itens().map((item) => item.getAttribute('aria-checked'))).toEqual(['true', 'false', 'false', 'false'])
})

test('escolher no menu troca a forma de ver e o endereço', async () => {
  montar([processo('Emitir Ofício')])
  await escolherFormaDeVer('Quadro por setor')
  await waitFor(() => expect(window.location.hash).toBe('#/processos?agrupar=setor'))
  expect((await botaoDaFormaDeVer()).textContent).toContain('Quadro por setor')
  await escolherFormaDeVer('Lista')
  await waitFor(() => expect(window.location.hash).toBe('#/processos/lista'))
  expect(await screen.findByRole('table')).toBeTruthy()
  expect((await botaoDaFormaDeVer()).textContent).toContain('Lista')
})

test('pelo teclado: a seta abre com o foco no primeiro item e desce, Esc fecha e devolve o foco ao botão', async () => {
  montar([processo('Emitir Ofício')])
  const botao = await botaoDaFormaDeVer()
  botao.focus()
  fireEvent.keyDown(botao, { key: 'ArrowDown' })
  await waitFor(() => expect(document.activeElement?.textContent).toBe('Quadro por etapa'))
  fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowDown' })
  expect(document.activeElement?.textContent).toBe('Quadro por responsável')
  fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'Escape' })
  expect(screen.queryByRole('menu', { name: 'Forma de ver' })).toBeNull()
  expect(document.activeElement).toBe(botao)
})

test('o endereço antigo com agrupar=responsavel abre o Quadro por responsável', async () => {
  window.location.hash = '#/processos?agrupar=responsavel'
  montar([processo('Emitir Ofício')])
  expect((await botaoDaFormaDeVer()).textContent).toContain('Quadro por responsável')
  expect(await screen.findByRole('region', { name: 'Ana Teste' })).toBeTruthy()
})

test('o endereço antigo da Lista agrupada abre a árvore, com "Lista" no menu', async () => {
  window.location.hash = '#/processos/lista?agrupar=macroprocesso'
  montar([processo('Emitir Ofício')])
  expect((await botaoDaFormaDeVer()).textContent).toContain('Lista')
  expect(within(screen.getByRole('group', { name: 'Agrupar por' })).getByRole('button', { name: 'Macroprocesso' })
    .getAttribute('aria-pressed')).toBe('true')
})

test('com um processo aberto, trocar de forma de ver fecha o processo e mantém os filtros', async () => {
  const p = processo('Emitir Ofício')
  window.location.hash = `#/processos/${p.id}?tipo=processo`
  montar([p])
  await escolherFormaDeVer('Lista')
  await waitFor(() => expect(window.location.hash).toBe('#/processos/lista?tipo=processo'))
})

test('o Quadro não tem mais o Agrupar por; a Lista tem o dela', async () => {
  montar([processo('Emitir Ofício')])
  await cartaoDe('Emitir Ofício')
  expect(screen.queryByRole('group', { name: 'Agrupar por' })).toBeNull()
  await escolherFormaDeVer('Lista')
  expect(await screen.findByRole('group', { name: 'Agrupar por' })).toBeTruthy()
})

test('na faixa, só Cadastrar processo é azul cheio, e ele vem antes da forma de ver', async () => {
  montar([processo('Emitir Ofício')])
  const faixa = await faixaDeControles()
  const principais = faixa.querySelectorAll('.botao-principal')
  expect(Array.from(principais).map((botao) => botao.textContent)).toEqual(['Cadastrar processo'])
  const botoes = within(faixa).getAllByRole('button')
  expect(botoes.indexOf(principais[0] as HTMLElement)).toBeLessThan(botoes.indexOf(await botaoDaFormaDeVer()))
})
