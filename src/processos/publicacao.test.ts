import { expect, test } from 'vitest'
import { acaoDaPublicacao, chegadaPedeJanela, linhaDaPublicacao, linhaDoConcluido, semPublicacao } from './publicacao'
import { umProcesso } from '../testes/processoDaLista'

const concluido = (mudancas = {}) => umProcesso('Emitir Ofício', { situacao: 'concluido', etiqueta: 'concluido', ...mudancas }, 'concluidos')

test('a linha de Concluídos diz a data da publicação ou a explicação de concluir sem publicação', () => {
  expect(linhaDoConcluido({ publicadoEm: '2026-10-05', explicacaoSemPublicacao: null })).toBe('Concluído · Publicado em 05/10/2026')
  expect(linhaDoConcluido({ publicadoEm: null, explicacaoSemPublicacao: 'Não será divulgado' }))
    .toBe('Concluído sem publicação: Não será divulgado')
  expect(linhaDoConcluido({ publicadoEm: null, explicacaoSemPublicacao: null })).toBe('Concluído sem publicação')
})

test('a linha da publicação só existe com a data', () => {
  expect(linhaDaPublicacao({ publicadoEm: '2026-10-05' })).toBe('Publicado em 05/10/2026')
  expect(linhaDaPublicacao({ publicadoEm: null })).toBeNull()
})

test('o selo "Sem publicação" é só de Concluídos sem a data', () => {
  expect(semPublicacao(concluido())).toBe(true)
  expect(semPublicacao(concluido({ publicadoEm: '2026-10-05' }))).toBe(false)
  expect(semPublicacao(umProcesso('Emitir Ofício', {}, 'publicacao'))).toBe(false)
})

test('a chegada pede a janela só para Concluídos sem a data da publicação', () => {
  expect(chegadaPedeJanela({ publicadoEm: null }, { codigo: 'concluidos' })).toBe(true)
  expect(chegadaPedeJanela({ publicadoEm: '2026-10-05' }, { codigo: 'concluidos' })).toBe(false)
  expect(chegadaPedeJanela({ publicadoEm: null }, { codigo: 'publicacao' })).toBe(false)
})

test('registrar ou corrigir: na Publicação e em Concluídos, não nas outras etapas', () => {
  expect(acaoDaPublicacao(umProcesso('Emitir Ofício', {}, 'publicacao'))).toBe('registrar')
  expect(acaoDaPublicacao(umProcesso('Emitir Ofício', { publicadoEm: '2026-10-05' }, 'publicacao'))).toBe('corrigir')
  expect(acaoDaPublicacao(concluido())).toBe('registrar')
  expect(acaoDaPublicacao(concluido({ publicadoEm: '2026-10-05' }))).toBe('corrigir')
  expect(acaoDaPublicacao(umProcesso('Emitir Ofício', {}, 'aprovacao_setor'))).toBeNull()
})

test('o suspenso e o cancelado não registram; o concluído fora do Quadro registra e corrige como qualquer concluído', () => {
  expect(acaoDaPublicacao(umProcesso('Emitir Ofício', { situacao: 'suspenso' }, 'publicacao'))).toBeNull()
  expect(acaoDaPublicacao(umProcesso('Emitir Ofício', { situacao: 'cancelado' }, 'publicacao'))).toBeNull()
  expect(acaoDaPublicacao(concluido({ noQuadro: false }))).toBe('registrar')
  expect(acaoDaPublicacao(concluido({ noQuadro: false, publicadoEm: '2026-10-05' }))).toBe('corrigir')
})
