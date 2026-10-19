import { describe, expect, test } from 'vitest'
import { barraDoCartao } from './barraDoCartao'
import type { DadosDoCartao, PedacoDoCaminho, ProcessoDaLista, StatusDaEtapa } from './tipos'

const CODIGOS = ['modelagem', 'relatorio_modelagem_tecnica', 'revisao_interna', 'revisao_do_setor', 'aprovacao', 'eprotocolo']

function caminho(...status: StatusDaEtapa[]): PedacoDoCaminho[] {
  return CODIGOS.map((codigo, indice) => ({ codigo, status: status[indice] ?? 'pendente' }))
}

function processo(cartao: Partial<DadosDoCartao> | undefined, atual = 'revisao_interna'): ProcessoDaLista {
  return {
    id: 'p1', nome: 'Emitir Ofício', tipo: 'processo', setorId: 's1', setorSigla: 'TSA', macroprocessoId: 'm1',
    macroprocessoNome: 'Macro', processoPaiId: null, situacao: 'em_andamento', responsavel: null,
    etapaAtual: { codigo: atual, nome: 'Revisão interna', ordem: 3 },
    cartao: cartao && {
      etapaAtualStatus: 'em_andamento', etapaAtualIniciadaEm: null, responsavelAtivo: null, caminho: [],
      ultimaVersao: null, subprocessos: 0, ...cartao,
    },
  }
}

describe('barraDoCartao', () => {
  test('resolvidas, atual e seguintes, com dispensada e realizada anteriormente contando como resolvidas', () => {
    const barra = barraDoCartao(processo({ caminho: caminho('concluida', 'dispensada', 'em_andamento') }))
    expect(barra?.pedacos.map((pedaco) => pedaco.estado)).toEqual([
      'resolvida', 'resolvida', 'atual', 'seguinte', 'seguinte', 'seguinte',
    ])
    const anterior = barraDoCartao(processo({ caminho: caminho('realizada_anteriormente', 'concluida', 'pendente') }))
    expect(anterior?.pedacos.slice(0, 3).map((pedaco) => pedaco.estado)).toEqual(['resolvida', 'resolvida', 'atual'])
  })

  test('o nome acessível diz a posição, o total e a etapa atual', () => {
    expect(barraDoCartao(processo({ caminho: caminho('concluida', 'concluida', 'em_andamento') }))?.nome)
      .toBe('Etapa 3 de 6: Revisão interna')
  })

  test('o processo suspenso também tem barra', () => {
    const suspenso = { ...processo({ caminho: caminho('concluida', 'em_andamento') }, 'relatorio_modelagem_tecnica'), situacao: 'suspenso' as const }
    expect(barraDoCartao(suspenso)?.pedacos).toHaveLength(6)
  })

  test('sem cartão, sem caminho ou com a etapa atual fora do caminho, não há o que desenhar', () => {
    expect(barraDoCartao(processo(undefined))).toBeNull()
    expect(barraDoCartao(processo({ caminho: [] }))).toBeNull()
    expect(barraDoCartao(processo({ caminho: caminho('em_andamento') }, 'etapa_que_nao_existe'))).toBeNull()
  })
})
