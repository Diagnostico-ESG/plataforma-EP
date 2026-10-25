import { describe, expect, test } from 'vitest'
import { barraDoCartao } from './barraDoCartao'
import type { ProcessoDaLista } from './tipos'

function processo(posicao: number | null, total = 8): ProcessoDaLista {
  return {
    id: 'p1', nome: 'Emitir Ofício', tipo: 'processo', setorId: 's1', setorSigla: 'TSA', macroprocessoId: 'm1',
    macroprocessoNome: 'Macro', processoPaiId: null, situacao: 'em_andamento', responsavel: null,
    etapaAtual: posicao === null ? null : { id: 'e', codigo: 'revisao_interna', nome: 'Revisão interna', ordem: posicao, posicao, total },
  }
}

describe('barraDoCartao', () => {
  test('um pedaço por etapa ativa: anteriores preenchidas, a atual destacada e as seguintes vazias', () => {
    const barra = barraDoCartao(processo(4))
    expect(barra?.pedacos).toHaveLength(8)
    expect(barra?.pedacos.map((pedaco) => pedaco.estado)).toEqual([
      'resolvida', 'resolvida', 'resolvida', 'atual', 'seguinte', 'seguinte', 'seguinte', 'seguinte',
    ])
  })

  test('em Não iniciados só a primeira está destacada', () => {
    expect(barraDoCartao(processo(1))?.pedacos.map((pedaco) => pedaco.estado).slice(0, 2)).toEqual(['atual', 'seguinte'])
  })

  test('em Concluídos, a barra inteira está preenchida', () => {
    expect(barraDoCartao(processo(8))?.pedacos.every((pedaco) => pedaco.estado === 'resolvida')).toBe(true)
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
