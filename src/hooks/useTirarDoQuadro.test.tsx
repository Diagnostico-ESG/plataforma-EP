import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { ProcessosFalso } from '../processos/ProcessosFalso'
import { CATALOGO_DE_TESTE, umProcessoLido } from '../testes/processoDaLista'
import { SEGUNDOS_DO_AVISO, useTirarDoQuadro } from './useTirarDoQuadro'

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

function montar(aoMudar = vi.fn()) {
  const processos = new ProcessosFalso()
  processos.etapasDoCatalogo = CATALOGO_DE_TESTE
  processos.processos = [
    umProcessoLido('Emitir Ofício', { id: 'p1', situacao: 'concluido', etiqueta: 'concluido', noQuadro: true }, 'concluidos'),
    umProcessoLido('Pagar Diária', { id: 'p2', situacao: 'concluido', etiqueta: 'concluido', noQuadro: true }, 'concluidos'),
  ]
  const gancho = renderHook(() => useTirarDoQuadro(processos, aoMudar))
  return { processos, gancho, aoMudar }
}

const noQuadro = async (processos: ProcessosFalso, id: string) => (await processos.lerProcesso(id))?.noQuadro

test('tirar grava, avisa o Quadro, guarda o aviso e roda o "depois" de quem chamou', async () => {
  const { processos, gancho, aoMudar } = montar()
  const depois = vi.fn()
  await act(() => gancho.result.current.tirar({ id: 'p1', nome: 'Emitir Ofício' }, depois))
  expect(await noQuadro(processos, 'p1')).toBe(false)
  expect(gancho.result.current.aviso).toEqual({ id: 'p1', nome: 'Emitir Ofício' })
  expect(depois).toHaveBeenCalledTimes(1)
  expect(aoMudar).toHaveBeenCalledTimes(1)
})

test('o aviso some sozinho depois de 8 segundos e antes disso continua', async () => {
  const { gancho } = montar()
  await act(() => gancho.result.current.tirar({ id: 'p1', nome: 'Emitir Ofício' }))
  act(() => vi.advanceTimersByTime((SEGUNDOS_DO_AVISO - 1) * 1000))
  expect(gancho.result.current.aviso).not.toBeNull()
  act(() => vi.advanceTimersByTime(1000))
  expect(gancho.result.current.aviso).toBeNull()
})

test('fechar esconde o aviso', async () => {
  const { gancho } = montar()
  await act(() => gancho.result.current.tirar({ id: 'p1', nome: 'Emitir Ofício' }))
  act(() => gancho.result.current.fechar())
  expect(gancho.result.current.aviso).toBeNull()
})

test('desfazer devolve o cartão, avisa o Quadro e tira o aviso', async () => {
  const { processos, gancho, aoMudar } = montar()
  await act(() => gancho.result.current.tirar({ id: 'p1', nome: 'Emitir Ofício' }))
  await act(() => gancho.result.current.desfazer())
  expect(await noQuadro(processos, 'p1')).toBe(true)
  expect(gancho.result.current.aviso).toBeNull()
  expect(aoMudar).toHaveBeenCalledTimes(2)
})

test('um aviso novo substitui o anterior e reinicia a contagem', async () => {
  const { gancho } = montar()
  await act(() => gancho.result.current.tirar({ id: 'p1', nome: 'Emitir Ofício' }))
  act(() => vi.advanceTimersByTime(6000))
  await act(() => gancho.result.current.tirar({ id: 'p2', nome: 'Pagar Diária' }))
  act(() => vi.advanceTimersByTime(6000))
  expect(gancho.result.current.aviso).toEqual({ id: 'p2', nome: 'Pagar Diária' })
  act(() => vi.advanceTimersByTime(2000))
  expect(gancho.result.current.aviso).toBeNull()
})

test('falha ao tirar guarda a mensagem, não cria aviso e não avisa o Quadro', async () => {
  const { processos, gancho, aoMudar } = montar()
  processos.falhaDeGravacao = 'falha de conexão simulada'
  await act(() => gancho.result.current.tirar({ id: 'p1', nome: 'Emitir Ofício' }))
  expect(gancho.result.current.falha).toContain('falha de conexão simulada')
  expect(gancho.result.current.aviso).toBeNull()
  expect(aoMudar).not.toHaveBeenCalled()
})

test('o processo que sumiu não é falha: o Quadro recarrega', async () => {
  const { gancho, aoMudar } = montar()
  await act(() => gancho.result.current.tirar({ id: 'p9', nome: 'Sumiu' }))
  expect(gancho.result.current.falha).toBeNull()
  expect(aoMudar).toHaveBeenCalledTimes(1)
})
