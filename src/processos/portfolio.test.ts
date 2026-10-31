import { describe, expect, test } from 'vitest'
import { umProcesso } from '../testes/processoDaLista'
import { visiveisNoPortfolio } from './portfolio'

const PROCESSOS = [
  umProcesso('Andando', {}, 'modelagem'),
  umProcesso('Parado', { situacao: 'suspenso' }, 'modelagem'),
  umProcesso('Pronto', { situacao: 'concluido' }, 'concluidos'),
  umProcesso('Antigo', { situacao: 'concluido', noQuadro: false }, 'concluidos'),
  umProcesso('Desistido', { situacao: 'cancelado' }, 'modelagem'),
]
const nomes = (processos: { nome: string }[]) => processos.map((processo) => processo.nome)

describe('visiveisNoPortfolio', () => {
  test('Todos: em andamento, suspenso e concluído (inclusive o que saiu do Quadro); o cancelado fica de fora', () => {
    expect(nomes(visiveisNoPortfolio(PROCESSOS, 'todos'))).toEqual(['Andando', 'Parado', 'Pronto', 'Antigo'])
  })

  test('Concluídos: só os concluídos', () => {
    expect(nomes(visiveisNoPortfolio(PROCESSOS, 'concluidos'))).toEqual(['Pronto', 'Antigo'])
  })

  test('cada situação mostra só os processos dela, inclusive os cancelados', () => {
    expect(nomes(visiveisNoPortfolio(PROCESSOS, 'em_andamento'))).toEqual(['Andando'])
    expect(nomes(visiveisNoPortfolio(PROCESSOS, 'suspensos'))).toEqual(['Parado'])
    expect(nomes(visiveisNoPortfolio(PROCESSOS, 'cancelados'))).toEqual(['Desistido'])
  })

  test('lista vazia continua vazia', () => {
    expect(visiveisNoPortfolio([], 'concluidos')).toEqual([])
  })
})
