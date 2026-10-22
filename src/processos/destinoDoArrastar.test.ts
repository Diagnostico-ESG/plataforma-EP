import { describe, expect, test } from 'vitest'
import { avancoDoCartao, colunaDeDestino } from './destinoDoArrastar'
import type { EtapaDoCaminho, ProcessoDaLista, StatusDaEtapa } from './tipos'

const CODIGOS = ['modelagem', 'relatorio', 'revisao_interna', 'revisao_do_setor', 'aprovacao', 'eprotocolo']

/** Um processo na etapa `posicao` (1 a 6): as anteriores concluídas, a atual em andamento e as seguintes pendentes. */
function com(posicao: number, mudancas: Partial<ProcessoDaLista> = {}, status: Record<number, StatusDaEtapa> = {}): ProcessoDaLista {
  const codigo = CODIGOS[posicao - 1]
  return {
    id: 'p1', nome: 'Emitir Ofício', tipo: 'processo', setorId: 's1', setorSigla: 'TSA', macroprocessoId: 'm1',
    macroprocessoNome: 'Macro de Teste', processoPaiId: null, situacao: 'em_andamento',
    etapaAtual: { codigo, nome: codigo, ordem: posicao }, responsavel: null,
    cartao: {
      etapaAtualStatus: 'em_andamento', etapaAtualIniciadaEm: '2026-10-10', responsavelAtivo: null, ultimaVersao: null,
      subprocessos: 0,
      caminho: CODIGOS.map((cod, indice) => ({
        codigo: cod, status: status[indice + 1] ?? (indice < posicao - 1 ? 'concluida' : indice === posicao - 1 ? 'em_andamento' : 'pendente'),
      })),
    },
    ...mudancas,
  }
}

describe('colunaDeDestino', () => {
  test('é a coluna da etapa pendente logo depois da atual', () => {
    expect(colunaDeDestino(com(3))).toBe('revisao_do_setor')
  })

  test('pula a vizinha já resolvida e vai à primeira pendente depois dela', () => {
    expect(colunaDeDestino(com(3, {}, { 4: 'dispensada' }))).toBe('aprovacao')
    expect(colunaDeDestino(com(3, {}, { 4: 'realizada_anteriormente' }))).toBe('aprovacao')
  })

  test('não há destino com a etapa atual ainda pendente', () => {
    const processo = com(3)
    expect(colunaDeDestino({ ...processo, cartao: { ...processo.cartao!, etapaAtualStatus: 'pendente' } })).toBeNull()
  })

  test('não há destino na última etapa', () => {
    expect(colunaDeDestino(com(6))).toBeNull()
  })

  test('da Publicação em andamento, sem pendente depois, o destino é a coluna Concluídos', () => {
    const naPublicacao = com(6, { etapaAtual: { codigo: 'publicacao', nome: 'Publicação', ordem: 6 } })
    const caminho = naPublicacao.cartao!.caminho.map((pedaco, indice) => (indice === 5 ? { ...pedaco, codigo: 'publicacao' } : pedaco))
    expect(colunaDeDestino({ ...naPublicacao, cartao: { ...naPublicacao.cartao!, caminho } })).toBe('concluidos')
  })

  test('não há destino no processo concluído', () => {
    expect(colunaDeDestino(com(3, { situacao: 'concluido' }))).toBeNull()
  })

  test('não há destino no processo suspenso', () => {
    expect(colunaDeDestino(com(3, { situacao: 'suspenso' }))).toBeNull()
  })

  test('não há destino sem os dados do cartão', () => {
    expect(colunaDeDestino(com(3, { cartao: undefined }))).toBeNull()
  })

  test('não há destino quando a etapa atual não está no caminho', () => {
    expect(colunaDeDestino(com(3, { etapaAtual: { codigo: 'outra', nome: 'Outra', ordem: 9 } }))).toBeNull()
  })
})

function etapa(ordem: number, status: StatusDaEtapa): EtapaDoCaminho {
  return {
    id: `a${ordem}`, codigo: CODIGOS[ordem - 1], nome: CODIGOS[ordem - 1], ordem, obrigatoria: true, status, nota: null,
    iniciadaEm: null, resolvidaEm: null,
  }
}

describe('avancoDoCartao', () => {
  test('devolve a etapa em andamento e a próxima pendente', () => {
    const etapas = [etapa(1, 'concluida'), etapa(2, 'em_andamento'), etapa(3, 'pendente')]
    expect(avancoDoCartao(etapas)).toEqual({ etapa: etapas[1], proxima: etapas[2] })
  })

  test('pula a vizinha já resolvida', () => {
    const etapas = [etapa(1, 'em_andamento'), etapa(2, 'dispensada'), etapa(3, 'pendente')]
    expect(avancoDoCartao(etapas)?.proxima?.id).toBe('a3')
  })

  test('não há avanço com a etapa atual pendente', () => {
    expect(avancoDoCartao([etapa(1, 'concluida'), etapa(2, 'pendente'), etapa(3, 'pendente')])).toBeNull()
  })

  test('a Publicação em andamento, sem pendente depois, avança sem próxima (vai a Concluídos)', () => {
    const publicacao = { ...etapa(2, 'em_andamento'), codigo: 'publicacao' }
    expect(avancoDoCartao([etapa(1, 'concluida'), publicacao])).toEqual({ etapa: publicacao, proxima: null })
  })

  test('não há avanço sem pendente depois', () => {
    expect(avancoDoCartao([etapa(1, 'concluida'), etapa(2, 'em_andamento')])).toBeNull()
  })

  test('não há avanço com todas as etapas resolvidas', () => {
    expect(avancoDoCartao([etapa(1, 'concluida'), etapa(2, 'dispensada')])).toBeNull()
  })
})
