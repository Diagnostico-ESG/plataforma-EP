import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { type ItemDoMenu, MenuDeAcoes } from './MenuDeAcoes'

afterEach(cleanup)

function montar() {
  const escolhido = vi.fn()
  const grupos: ItemDoMenu[][] = [
    [{ rotulo: 'Histórico', aoEscolher: () => escolhido('Histórico') }, { rotulo: 'Editar', aoEscolher: () => escolhido('Editar') }],
    [{ rotulo: 'Excluir', aoEscolher: () => escolhido('Excluir'), perigoso: true }],
  ]
  render(<MenuDeAcoes rotulo="Ações do processo" grupos={grupos} />)
  return { escolhido, botao: screen.getByRole('button', { name: 'Ações do processo' }) }
}

const item = (nome: string) => screen.getByRole('menuitem', { name: nome })

test('abre pelo botão com o foco no primeiro item, em grupos separados', () => {
  const { botao } = montar()
  expect(botao.getAttribute('aria-expanded')).toBe('false')
  expect(botao.getAttribute('aria-haspopup')).toBe('menu')
  fireEvent.click(botao)
  expect(botao.getAttribute('aria-expanded')).toBe('true')
  const menu = screen.getByRole('menu', { name: 'Ações do processo' })
  expect(within(menu).getAllByRole('group')).toHaveLength(2)
  expect(within(menu).getAllByRole('separator')).toHaveLength(1)
  expect(document.activeElement).toBe(item('Histórico'))
})

test('as setas dão a volta, e Home e End vão às pontas', () => {
  const { botao } = montar()
  fireEvent.click(botao)
  fireEvent.keyDown(item('Histórico'), { key: 'ArrowDown' })
  expect(document.activeElement).toBe(item('Editar'))
  fireEvent.keyDown(item('Editar'), { key: 'ArrowDown' })
  fireEvent.keyDown(item('Excluir'), { key: 'ArrowDown' })
  expect(document.activeElement).toBe(item('Histórico'))
  fireEvent.keyDown(item('Histórico'), { key: 'ArrowUp' })
  expect(document.activeElement).toBe(item('Excluir'))
  fireEvent.keyDown(item('Excluir'), { key: 'Home' })
  expect(document.activeElement).toBe(item('Histórico'))
  fireEvent.keyDown(item('Histórico'), { key: 'End' })
  expect(document.activeElement).toBe(item('Excluir'))
})

test('seta para baixo no botão abre no primeiro item, e seta para cima no último', () => {
  const { botao } = montar()
  fireEvent.keyDown(botao, { key: 'ArrowDown' })
  expect(document.activeElement).toBe(item('Histórico'))
  fireEvent.keyDown(item('Histórico'), { key: 'Escape' })
  fireEvent.keyDown(botao, { key: 'ArrowUp' })
  expect(document.activeElement).toBe(item('Excluir'))
})

test('Esc fecha, devolve o foco ao botão e impede a ação padrão (a janela de fora fica aberta)', () => {
  const { botao } = montar()
  fireEvent.click(botao)
  const seguiu = fireEvent.keyDown(item('Histórico'), { key: 'Escape' })
  expect(seguiu).toBe(false)
  expect(screen.queryByRole('menu')).toBeNull()
  expect(document.activeElement).toBe(botao)
})

test('escolher um item fecha o menu, devolve o foco ao botão e chama a ação', () => {
  const { botao, escolhido } = montar()
  fireEvent.click(botao)
  fireEvent.click(item('Editar'))
  expect(escolhido).toHaveBeenCalledWith('Editar')
  expect(screen.queryByRole('menu')).toBeNull()
  expect(document.activeElement).toBe(botao)
})

test('Tab e clique fora fecham o menu', () => {
  const { botao } = montar()
  fireEvent.click(botao)
  fireEvent.keyDown(item('Histórico'), { key: 'Tab' })
  expect(screen.queryByRole('menu')).toBeNull()
  fireEvent.click(botao)
  fireEvent.pointerDown(document.body)
  expect(screen.queryByRole('menu')).toBeNull()
})

test('clicar de novo no botão fecha o menu', () => {
  const { botao } = montar()
  fireEvent.click(botao)
  fireEvent.click(botao)
  expect(screen.queryByRole('menu')).toBeNull()
})

test('o item perigoso tem a marca de perigo', () => {
  const { botao } = montar()
  fireEvent.click(botao)
  expect(item('Excluir').classList.contains('menu-de-acoes-perigoso')).toBe(true)
  expect(item('Editar').classList.contains('menu-de-acoes-perigoso')).toBe(false)
})
