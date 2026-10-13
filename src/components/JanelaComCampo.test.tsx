import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { JanelaComCampo } from './JanelaComCampo'

afterEach(cleanup)

function montar() {
  const aoConfirmar = vi.fn()
  const aoFechar = vi.fn()
  render(
    <JanelaComCampo aberta titulo="Dispensar a etapa Etapa Teste?" rotuloDoCampo="Nota" rotuloDaAcao="Dispensar"
      aoConfirmar={aoConfirmar} aoFechar={aoFechar} />,
  )
  const janela = within(screen.getByRole('dialog', { name: 'Dispensar a etapa Etapa Teste?' }))
  return { aoConfirmar, aoFechar, janela }
}

test('abre com o foco no campo e o botão da ação desabilitado', () => {
  const { janela } = montar()
  expect(document.activeElement).toBe(janela.getByLabelText('Nota'))
  expect((janela.getByRole('button', { name: 'Dispensar' }) as HTMLButtonElement).disabled).toBe(true)
})

test('só espaços não habilitam o botão; texto habilita', () => {
  const { janela } = montar()
  const botao = janela.getByRole('button', { name: 'Dispensar' }) as HTMLButtonElement
  fireEvent.change(janela.getByLabelText('Nota'), { target: { value: '   ' } })
  expect(botao.disabled).toBe(true)
  fireEvent.change(janela.getByLabelText('Nota'), { target: { value: 'Setor já conhecido' } })
  expect(botao.disabled).toBe(false)
})

test('confirmar entrega o texto sem espaços nas pontas e pede para fechar', () => {
  const { aoConfirmar, aoFechar, janela } = montar()
  fireEvent.change(janela.getByLabelText('Nota'), { target: { value: '  Setor já conhecido  ' } })
  fireEvent.click(janela.getByRole('button', { name: 'Dispensar' }))
  expect(aoConfirmar).toHaveBeenCalledWith('Setor já conhecido')
  expect(aoFechar).toHaveBeenCalled()
})

test('Cancelar e Esc fecham sem confirmar', () => {
  const { aoConfirmar, aoFechar, janela } = montar()
  fireEvent.change(janela.getByLabelText('Nota'), { target: { value: 'Texto' } })
  fireEvent.click(janela.getByRole('button', { name: 'Cancelar' }))
  act(() => (screen.getByRole('dialog') as HTMLDialogElement).close())
  expect(aoFechar).toHaveBeenCalled()
  expect(aoConfirmar).not.toHaveBeenCalled()
})
