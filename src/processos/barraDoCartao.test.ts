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
  test('a posição e o total saem da etapa atual', () => {
    expect(barraDoCartao(processo(4))).toMatchObject({ posicao: 4, total: 8 })
  })

  test('em Concluídos a posição é a última', () => {
    expect(barraDoCartao(processo(8, 8, 'Concluídos'))).toMatchObject({ posicao: 8, total: 8 })
  })

  test('com etapa desativada no catálogo, o total usa só as etapas ativas que restaram', () => {
    expect(barraDoCartao(processo(3, 6))).toMatchObject({ posicao: 3, total: 6 })
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
