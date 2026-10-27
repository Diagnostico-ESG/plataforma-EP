import { describe, expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { gravarNumeroDaVersao, numeroNovoValido, previaDoNumero } from './numeroDaVersao'
import type { Versao } from './tipos'

const V7: Versao = {
  id: 'v7', numero: 7, historica: false, piloto: false, enviadaEm: '2026-10-20T10:00:00Z', autor: 'Ana', etapa: null,
  arquivos: [
    { id: 'a1', papel: 'bpm', nome: 'CEE_V7_Compras.bpm', formato: 'bpm', tamanho: 1 },
    { id: 'a2', papel: 'relatorio', nome: 'CEE_V7_Compras_Relatório V2.docx', formato: 'docx', tamanho: 1, numeroDoRelatorio: 2 },
  ],
}

describe('numeroNovoValido', () => {
  test.each([['5', 5], ['12', 12]])('"%s" vale', (texto, esperado) => {
    expect(numeroNovoValido(texto, V7)).toBe(esperado)
  })

  test.each(['', '0', '7', 'abc', '-1', '2,5', ' 5'])('"%s" não vale (vazio, zero, igual ao atual ou fora do formato)', (texto) => {
    expect(numeroNovoValido(texto, V7)).toBeNull()
  })
})

describe('previaDoNumero', () => {
  test('mostra o rótulo novo e os nomes novos, com o Relatório V2 como estava', () => {
    expect(previaDoNumero(V7, 5)).toEqual({ rotulo: 'V5', nomes: ['CEE_V5_Compras.bpm', 'CEE_V5_Compras_Relatório V2.docx'] })
  })

  test('mantém a letra do tipo na histórica e na piloto', () => {
    const historica: Versao = { ...V7, numero: 3, historica: true, arquivos: [{ ...V7.arquivos[0], nome: 'CEE_V3F_Compras.bpm' }] }
    expect(previaDoNumero(historica, 2)).toEqual({ rotulo: 'V2F', nomes: ['CEE_V2F_Compras.bpm'] })
    const piloto: Versao = { ...V7, numero: 4, piloto: true, arquivos: [{ ...V7.arquivos[0], nome: 'CEE_V4P_Compras.bpm' }] }
    expect(previaDoNumero(piloto, 9)).toEqual({ rotulo: 'V9P', nomes: ['CEE_V9P_Compras.bpm'] })
  })

  test('não lista arquivo cujo nome não leva o rótulo', () => {
    const sem: Versao = { ...V7, arquivos: [{ ...V7.arquivos[0], nome: 'planilha.bpm' }] }
    expect(previaDoNumero(sem, 5).nomes).toEqual([])
  })
})

describe('gravarNumeroDaVersao', () => {
  test('pede ao módulo a troca com o número que a tela viu e devolve null quando gravou', async () => {
    const pedidos: unknown[][] = []
    const modulo = { editarNumero: (...pedido: [string, number, number]) => { pedidos.push(pedido); return Promise.resolve() } }
    expect(await gravarNumeroDaVersao(modulo, V7, 5)).toBeNull()
    expect(pedidos).toEqual([['v7', 7, 5]])
  })

  test('devolve a frase pronta da recusa', async () => {
    const modulo = { editarNumero: () => Promise.reject(new TravaDoBanco('Este processo já tem a V5.')) }
    expect(await gravarNumeroDaVersao(modulo, V7, 5)).toBe('Este processo já tem a V5.')
  })

  test('devolve o motivo da falha de conexão', async () => {
    const modulo = { editarNumero: () => Promise.reject(new Error('sem conexão')) }
    expect(await gravarNumeroDaVersao(modulo, V7, 5)).toBe('A alteração não foi salva: sem conexão.')
  })
})
