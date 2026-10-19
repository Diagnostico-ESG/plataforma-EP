import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { JanelaComCampo } from '../JanelaComCampo'
import { JanelaDoVerso } from './JanelaDoVerso'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

test('abre como janela modal, com o nome recebido', () => {
  const modal = vi.spyOn(HTMLDialogElement.prototype, 'showModal')
  render(<JanelaDoVerso rotulo="Processo Emitir Ofício" aoFechar={vi.fn()}><p>conteúdo</p></JanelaDoVerso>)
  const janela = screen.getByRole('dialog', { name: 'Processo Emitir Ofício' }) as HTMLDialogElement
  expect(modal).toHaveBeenCalledTimes(1)
  expect(janela.open).toBe(true)
  expect(janela.classList.contains('verso-estreita')).toBe(false)
})

test('Esc pede para fechar, e quem fecha é quem a abriu', () => {
  const aoFechar = vi.fn()
  render(<JanelaDoVerso rotulo="Processo Emitir Ofício" aoFechar={aoFechar}><button type="button">Algo</button></JanelaDoVerso>)
  fireEvent.keyDown(screen.getByRole('button', { name: 'Algo' }), { key: 'Escape' })
  expect(aoFechar).toHaveBeenCalledTimes(1)
  expect((screen.getByRole('dialog', { name: 'Processo Emitir Ofício' }) as HTMLDialogElement).open).toBe(true)
})

test('o Esc de uma janela aberta dentro dela fecha só a de dentro', () => {
  const aoFecharVerso = vi.fn()
  const aoFecharMotivo = vi.fn()
  render(
    <JanelaDoVerso rotulo="Processo Emitir Ofício" aoFechar={aoFecharVerso}>
      <JanelaComCampo aberta titulo="Suspender?" rotuloDoCampo="Motivo" rotuloDaAcao="Suspender processo" aoConfirmar={vi.fn()}
        aoFechar={aoFecharMotivo} />
    </JanelaDoVerso>,
  )
  fireEvent.keyDown(screen.getByLabelText('Motivo'), { key: 'Escape' })
  expect(aoFecharMotivo).toHaveBeenCalled()
  expect(aoFecharVerso).not.toHaveBeenCalled()
})

test('estreita, para os formulários', () => {
  render(<JanelaDoVerso rotulo="Novo processo" estreita aoFechar={vi.fn()}><p>formulário</p></JanelaDoVerso>)
  expect(screen.getByRole('dialog', { name: 'Novo processo' }).classList.contains('verso-estreita')).toBe(true)
})
