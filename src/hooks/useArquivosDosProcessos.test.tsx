import { act, renderHook, waitFor } from '@testing-library/react'
import { expect, test } from 'vitest'
import { VersoesFalso } from '../versoes/VersoesFalso'
import type { Versao } from '../versoes/tipos'
import { useArquivosDosProcessos } from './useArquivosDosProcessos'

const VERSAO: Versao = { id: 'v1', numero: 1, historica: false, piloto: false, enviadaEm: '2026-10-02T12:00:00Z', autor: null, etapa: null, arquivos: [] }

test('buscar passa por carregando e chega às versões do processo', async () => {
  const falso = new VersoesFalso()
  falso.versoes = { p1: [VERSAO] }
  const { result } = renderHook(() => useArquivosDosProcessos(falso))
  act(() => result.current.buscar(['p1']))
  expect(result.current.estados.p1).toEqual({ tipo: 'carregando' })
  await waitFor(() => expect(result.current.estados.p1).toEqual({ tipo: 'pronto', versoes: [VERSAO] }))
})

test('a falha de um processo não atinge o outro; buscar de novo no que falhou volta a carregar', async () => {
  const falso = new VersoesFalso()
  falso.versoes = { p2: [VERSAO] }
  const { result } = renderHook(() => useArquivosDosProcessos(falso))
  falso.falharLeitura = true
  act(() => result.current.buscar(['p1']))
  await waitFor(() => expect(result.current.estados.p1).toEqual({ tipo: 'erro' }))
  falso.falharLeitura = false
  act(() => result.current.buscar(['p1', 'p2']))
  expect(result.current.estados.p1).toEqual({ tipo: 'carregando' })
  await waitFor(() => expect(result.current.estados.p2?.tipo).toBe('pronto'))
  expect(result.current.estados.p1).toEqual({ tipo: 'pronto', versoes: [] })
})

test('buscar de novo num processo já pronto mantém o que ele mostrava enquanto refaz a leitura', async () => {
  const falso = new VersoesFalso()
  falso.versoes = { p1: [VERSAO] }
  const { result } = renderHook(() => useArquivosDosProcessos(falso))
  act(() => result.current.buscar(['p1']))
  await waitFor(() => expect(result.current.estados.p1?.tipo).toBe('pronto'))
  act(() => result.current.buscar(['p1']))
  expect(result.current.estados.p1?.tipo).toBe('pronto')
})
