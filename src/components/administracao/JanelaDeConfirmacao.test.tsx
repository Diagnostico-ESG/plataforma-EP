import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { JanelaDeConfirmacao } from './JanelaDeConfirmacao'

afterEach(cleanup)

function montar(aberta: boolean) {
  const aoConfirmar = vi.fn()
  const aoFechar = vi.fn()
  render(
    <JanelaDeConfirmacao aberta={aberta} titulo="Desativar Ana Teste?" texto="Ana Teste perde o acesso."
      rotuloDaAcao="Desativar" aoConfirmar={aoConfirmar} aoFechar={aoFechar} />,
  )
  return { aoConfirmar, aoFechar }
}

test('fechada, não aparece', () => {
  montar(false)
  expect(screen.queryByRole('dialog')).toBeNull()
})

test('aberta, mostra título, texto e botões, com o foco no Cancelar', () => {
  montar(true)
  const janela = within(screen.getByRole('dialog', { name: 'Desativar Ana Teste?' }))
  expect(janela.getByText('Ana Teste perde o acesso.')).toBeTruthy()
  expect(janela.getByRole('button', { name: 'Desativar' })).toBeTruthy()
  expect(document.activeElement).toBe(janela.getByRole('button', { name: 'Cancelar' }))
})

test('o botão da ação confirma e pede para fechar', () => {
  const { aoConfirmar, aoFechar } = montar(true)
  fireEvent.click(screen.getByRole('button', { name: 'Desativar' }))
  expect(aoConfirmar).toHaveBeenCalledTimes(1)
  expect(aoFechar).toHaveBeenCalled()
})

test('Cancelar fecha sem confirmar', () => {
  const { aoConfirmar, aoFechar } = montar(true)
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
  expect(aoConfirmar).not.toHaveBeenCalled()
  expect(aoFechar).toHaveBeenCalled()
})

test('Esc (o navegador fecha o <dialog>) pede para fechar sem confirmar', () => {
  const { aoConfirmar, aoFechar } = montar(true)
  act(() => (screen.getByRole('dialog') as HTMLDialogElement).close())
  expect(aoFechar).toHaveBeenCalled()
  expect(aoConfirmar).not.toHaveBeenCalled()
})
