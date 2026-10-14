import { describe, expect, test } from 'vitest'
import { ROTULO_DO_STATUS, acoesDaEtapa, formatarData, indiceDaEtapaAtual } from './caminhoDeEtapas'
import type { EtapaDoSetor, StatusDaEtapa } from './tipos'

function etapa(ordem: number, status: StatusDaEtapa, obrigatoria = false): EtapaDoSetor {
  return {
    id: `a${ordem}`, codigo: `etapa_${ordem}`, nome: `Etapa ${ordem}`, ordem, obrigatoria, status,
    nota: null, iniciadaEm: null, resolvidaEm: null,
  }
}

describe('etapa atual', () => {
  test('é a primeira não resolvida', () => {
    expect(indiceDaEtapaAtual([etapa(1, 'dispensada'), etapa(2, 'pendente'), etapa(3, 'pendente')])).toBe(1)
    expect(indiceDaEtapaAtual([etapa(1, 'concluida'), etapa(2, 'em_andamento'), etapa(3, 'pendente')])).toBe(1)
  })

  test('com todas resolvidas, não há etapa atual', () => {
    expect(indiceDaEtapaAtual([etapa(1, 'realizada_anteriormente'), etapa(2, 'concluida')])).toBe(-1)
  })
})

describe('ações da etapa', () => {
  test('a atual pendente e opcional: iniciar, dispensar e realizada anteriormente', () => {
    expect(acoesDaEtapa([etapa(1, 'pendente'), etapa(2, 'pendente')], 0)).toEqual(['iniciar', 'dispensar', 'realizada'])
  })

  test('a atual em andamento e obrigatória: concluir e realizada anteriormente, sem dispensar', () => {
    expect(acoesDaEtapa([etapa(1, 'concluida'), etapa(2, 'em_andamento', true)], 1)).toEqual(['concluir', 'realizada'])
  })

  test('a pendente depois da atual não tem ação', () => {
    const etapas = [etapa(1, 'concluida'), etapa(2, 'pendente'), etapa(3, 'pendente')]
    expect(acoesDaEtapa(etapas, 2)).toEqual([])
  })

  test('a resolvida anterior à atual pode ser voltada', () => {
    const etapas = [etapa(1, 'concluida'), etapa(2, 'dispensada'), etapa(3, 'em_andamento'), etapa(4, 'pendente')]
    expect(acoesDaEtapa(etapas, 0)).toEqual(['voltar'])
    expect(acoesDaEtapa(etapas, 1)).toEqual(['voltar'])
  })

  test('com todas resolvidas (processo concluído), qualquer uma pode ser voltada', () => {
    const etapas = [etapa(1, 'concluida'), etapa(2, 'realizada_anteriormente')]
    expect(acoesDaEtapa(etapas, 0)).toEqual(['voltar'])
    expect(acoesDaEtapa(etapas, 1)).toEqual(['voltar'])
  })
})

test('rótulos de status com o texto da tela', () => {
  expect(ROTULO_DO_STATUS).toEqual({
    pendente: 'Pendente', em_andamento: 'Em andamento', concluida: 'Concluída',
    realizada_anteriormente: 'Realizada anteriormente', dispensada: 'Dispensada',
  })
})

test('a data do banco (AAAA-MM-DD) aparece como DD/MM/AAAA; sem data, um traço', () => {
  expect(formatarData('2026-10-13')).toBe('13/10/2026')
  expect(formatarData(null)).toBe('—')
})
