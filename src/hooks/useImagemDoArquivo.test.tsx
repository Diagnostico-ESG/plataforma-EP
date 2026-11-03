import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import type { ArquivoDaVersao, ModuloDeVersoes } from '../versoes/tipos'
import { useImagemDoArquivo } from './useImagemDoArquivo'

// miniatura-rapida (ADR 0038): o conteúdo fica guardado por módulo e por id de arquivo; aqui, o que o verso inteiro não mostra:
// pedidos juntos viram um e o mesmo arquivo em outro lugar da tela não pede de novo.

const arquivo = (id: string) => ({ id, nome: `${id}.png`, formato: 'png' }) as unknown as ArquivoDaVersao

function moduloQueBaixa() {
  const baixarArquivo = vi.fn((pedido: ArquivoDaVersao) => Promise.resolve(new Blob([pedido.id])))
  return { modulo: { baixarArquivo } as unknown as ModuloDeVersoes, baixarArquivo }
}

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:miniatura')
  URL.revokeObjectURL = vi.fn()
})

test('dois pedidos juntos do mesmo arquivo viram um só', async () => {
  const { modulo, baixarArquivo } = moduloQueBaixa()
  const primeiro = renderHook(() => useImagemDoArquivo(modulo, arquivo('a1')))
  const segundo = renderHook(() => useImagemDoArquivo(modulo, arquivo('a1')))
  await waitFor(() => expect(primeiro.result.current.tipo).toBe('pronta'))
  await waitFor(() => expect(segundo.result.current.tipo).toBe('pronta'))
  expect(baixarArquivo).toHaveBeenCalledTimes(1)
})

test('o mesmo arquivo em outro lugar da tela, depois de o primeiro sair, usa a cópia guardada', async () => {
  const { modulo, baixarArquivo } = moduloQueBaixa()
  const primeiro = renderHook(() => useImagemDoArquivo(modulo, arquivo('a1')))
  await waitFor(() => expect(primeiro.result.current.tipo).toBe('pronta'))
  primeiro.unmount()
  const outro = renderHook(() => useImagemDoArquivo(modulo, arquivo('a1')))
  await waitFor(() => expect(outro.result.current.tipo).toBe('pronta'))
  expect(baixarArquivo).toHaveBeenCalledTimes(1)
})

test('outro arquivo (outro id, como numa versão nova) é baixado', async () => {
  const { modulo, baixarArquivo } = moduloQueBaixa()
  const primeiro = renderHook(() => useImagemDoArquivo(modulo, arquivo('a1')))
  const segundo = renderHook(() => useImagemDoArquivo(modulo, arquivo('a2')))
  await waitFor(() => expect(primeiro.result.current.tipo).toBe('pronta'))
  await waitFor(() => expect(segundo.result.current.tipo).toBe('pronta'))
  expect(baixarArquivo).toHaveBeenCalledTimes(2)
})
