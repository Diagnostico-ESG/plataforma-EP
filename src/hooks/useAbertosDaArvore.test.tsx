import { act, renderHook } from '@testing-library/react'
import { expect, test } from 'vitest'
import { montarArvore, montarArvorePorSetor } from '../processos/arvoreDaLista'
import type { LinhaDaLista } from '../processos/linhasDaLista'
import {
  chaveDoMacro, chaveDoMacroNoSetor, chaveDoSetor, chaveDoSetorRaiz, estruturaPorMacro, estruturaPorSetor, useAbertosDaArvore,
} from './useAbertosDaArvore'

function linha(id: string, setorId = 's1'): LinhaDaLista {
  return {
    id, nome: id, tipo: 'processo', setorId, setorSigla: setorId.toUpperCase(), macroprocessoId: 'm1', macroprocessoNome: 'Macro',
    processoPaiId: null, situacao: 'em_andamento', etapaAtual: null, responsavel: null, nomeDoPai: null,
  }
}

const LINHAS = [linha('p1'), linha('p2', 's2')]
const ESTRUTURA = estruturaPorMacro(montarArvore(LINHAS, LINHAS, []))

test('macros e setores abrem por padrão; os processos, fechados', () => {
  const { result } = renderHook(() => useAbertosDaArvore(ESTRUTURA))
  expect(result.current.grupoAberto(chaveDoMacro('m1'))).toBe(true)
  expect(result.current.grupoAberto(chaveDoSetor('m1', 's1'))).toBe(true)
  expect(result.current.processoAberto('p1')).toBe(false)
  expect(result.current.tudoAberto).toBe(false)
})

test('alternar um processo diz se ele ficou aberto; alternar um grupo o fecha', () => {
  const { result } = renderHook(() => useAbertosDaArvore(ESTRUTURA))
  let ficouAberto = false
  act(() => { ficouAberto = result.current.alternarProcesso('p1') })
  expect(ficouAberto).toBe(true)
  expect(result.current.processoAberto('p1')).toBe(true)
  act(() => { ficouAberto = result.current.alternarProcesso('p1') })
  expect(ficouAberto).toBe(false)
  act(() => result.current.alternarGrupo(chaveDoMacro('m1')))
  expect(result.current.grupoAberto(chaveDoMacro('m1'))).toBe(false)
})

test('abrir tudo devolve os processos e abre todos os níveis; fechar tudo fecha macros, setores e processos', () => {
  const { result } = renderHook(() => useAbertosDaArvore(ESTRUTURA))
  let ids: string[] = []
  act(() => { ids = result.current.abrirTudo() })
  expect(ids).toEqual(['p1', 'p2'])
  expect(result.current.tudoAberto).toBe(true)
  act(() => result.current.fecharTudo())
  expect(result.current.grupoAberto(chaveDoMacro('m1'))).toBe(false)
  expect(result.current.grupoAberto(chaveDoSetor('m1', 's2'))).toBe(false)
  expect(result.current.processoAberto('p2')).toBe(false)
  expect(result.current.tudoAberto).toBe(false)
})

test('na árvore por Setor, setores e macroprocessos abrem por padrão e abrir/fechar tudo cobre todos os níveis', () => {
  const { result } = renderHook(() => useAbertosDaArvore(estruturaPorSetor(montarArvorePorSetor(LINHAS, LINHAS, []))))
  expect(result.current.grupoAberto(chaveDoSetorRaiz('s1'))).toBe(true)
  expect(result.current.grupoAberto(chaveDoMacroNoSetor('s2', 'm1'))).toBe(true)
  expect(result.current.processoAberto('p1')).toBe(false)
  let ids: string[] = []
  act(() => { ids = result.current.abrirTudo() })
  expect(ids).toEqual(['p1', 'p2'])
  expect(result.current.tudoAberto).toBe(true)
  act(() => result.current.fecharTudo())
  expect(result.current.grupoAberto(chaveDoSetorRaiz('s1'))).toBe(false)
  expect(result.current.grupoAberto(chaveDoMacroNoSetor('s2', 'm1'))).toBe(false)
  expect(result.current.processoAberto('p2')).toBe(false)
})
