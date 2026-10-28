import { describe, expect, test } from 'vitest'
import { barraDoCartao } from './barraDoCartao'
import type { ProcessoDaLista } from './tipos'

function processo(posicao: number | null, total = 8, nome = 'Revisão interna'): ProcessoDaLista {
  return {
    id: 'p1', nome: 'Emitir Ofício', tipo: 'processo', setorId: 's1', setorSigla: 'TSA', macroprocessoId: 'm1',
    macroprocessoNome: 'Macro', processoPaiId: null, situacao: 'em_andamento', responsavel: null,
    etapaAtual: posicao === null ? null : { id: 'e', codigo: 'revisao_interna', nome, ordem: posicao, posicao, total },
  }
}

describe('barraDoCartao', () => {
  test('a fração preenchida é a posição da etapa atual sobre o total', () => {
    expect(barraDoCartao(processo(4))?.fracao).toBe(0.5)
  })

  test('em Não iniciados só o primeiro trecho está preenchido', () => {
    expect(barraDoCartao(processo(1))?.fracao).toBe(1 / 8)
  })

  test('em Concluídos, a barra está cheia', () => {
    expect(barraDoCartao(processo(8, 8, 'Concluídos'))?.fracao).toBe(1)
  })

  test('com etapa desativada no catálogo, a fração usa só as etapas ativas que restaram', () => {
    expect(barraDoCartao(processo(3, 6))?.fracao).toBe(0.5)
  })

  test('o nome acessível diz a posição, o total e a etapa atual', () => {
    expect(barraDoCartao(processo(4))?.nome).toBe('Etapa 4 de 8: Revisão interna')
  })

  test('o texto visível diz o nome e a posição da etapa', () => {
    expect(barraDoCartao(processo(4))?.texto).toBe('Revisão interna · 4 de 8')
  })

  test('sem etapa atual não há o que desenhar', () => {
    expect(barraDoCartao(processo(null))).toBeNull()
  })
})
