import { describe, expect, test } from 'vitest'
import { podeRegistrarDataDaModelagem } from './dataDaModelagemPiloto'
import type { ProcessoLido } from './tipos'

const ETAPAS = [
  { id: 'e1', codigo: 'nao_iniciados', nome: 'Não iniciados', ordem: 1, passagens: [] },
  { id: 'e2', codigo: 'modelagem', nome: 'Modelagem piloto', ordem: 2, passagens: [] },
  { id: 'e3', codigo: 'revisao_interna', nome: 'Revisão interna', ordem: 3, passagens: [] },
  { id: 'e4', codigo: 'concluidos', nome: 'Concluídos', ordem: 4, passagens: [] },
]

function processo(ordem: number | null, situacao: ProcessoLido['situacao'] = 'em_andamento') {
  const etapaAtual = ordem === null ? null : { id: 'x', codigo: 'x', nome: 'x', ordem, posicao: ordem, total: 4 }
  return { situacao, etapaAtual, etapasDoVerso: ETAPAS }
}

describe('quando a data da modelagem piloto se registra', () => {
  test.each([[2], [3], [4]])('na etapa de ordem %i (a Modelagem piloto ou depois), em andamento', (ordem) => {
    expect(podeRegistrarDataDaModelagem(processo(ordem), true)).toBe(true)
  })

  test('concluído, na última etapa', () => {
    expect(podeRegistrarDataDaModelagem(processo(4, 'concluido'), true)).toBe(true)
  })

  test('em Não iniciados, não', () => {
    expect(podeRegistrarDataDaModelagem(processo(1), true)).toBe(false)
  })

  test.each<ProcessoLido['situacao']>(['suspenso', 'cancelado'])('processo %s, não', (situacao) => {
    expect(podeRegistrarDataDaModelagem(processo(3, situacao), true)).toBe(false)
  })

  test('quem não pode alterar (Consulta), não', () => {
    expect(podeRegistrarDataDaModelagem(processo(3), false)).toBe(false)
  })

  test('sem etapa atual ou sem a Modelagem piloto entre as etapas ativas, não', () => {
    expect(podeRegistrarDataDaModelagem(processo(null), true)).toBe(false)
    expect(podeRegistrarDataDaModelagem({ ...processo(3), etapasDoVerso: [ETAPAS[0], ETAPAS[2]] }, true)).toBe(false)
  })
})
