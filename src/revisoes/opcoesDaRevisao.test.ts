import { describe, expect, test } from 'vitest'
import type { UltimaVersao, UltimoRelatorio } from '../processos/tipos'
import {
  MOTIVO_SEM_VERSAO_NA_PASSAGEM, type ContextoDaRevisao, avisoDaAprovacaoSubstituida, avisoDoAutorDaRevisao, opcoesDoResultado,
  resumoDaAprovacao, resumoDaRevisao,
} from './opcoesDaRevisao'
import type { RevisaoInterna } from './tipos'

const V8: UltimaVersao = { numero: 8, autorId: 'u1', autorNome: 'Ana', papeis: [], anterior: { numero: 7, autorId: 'u3' }, enviadaNestaPassagem: true }
const R2: UltimoRelatorio = { numero: 2, autorId: 'u4', autorNome: 'Dani', anterior: { numero: 1, autorId: 'u5' }, enviadoNestaPassagem: true }
const nada = { ultimaVersao: { ...V8, enviadaNestaPassagem: false }, ultimoRelatorio: { ...R2, enviadoNestaPassagem: false } }
const fluxograma = (mudancas: Partial<ContextoDaRevisao> = {}): ContextoDaRevisao => ({ etapa: 'revisao_interna', ...nada, ...mudancas })
const relatorio = (mudancas: Partial<ContextoDaRevisao> = {}): ContextoDaRevisao => ({ etapa: 'revisao_relatorio', ...nada, ...mudancas })
const rotulos = (contexto: ContextoDaRevisao) => opcoesDoResultado(contexto).map((opcao) => [opcao.rotulo, opcao.desabilitada])

describe('opcoesDoResultado', () => {
  test('na Revisão do fluxograma, "sem alteração" vale para a versão mais recente', () => {
    expect(rotulos(fluxograma({ ultimaVersao: V8 }))[0]).toEqual(['Sem alteração: vale para a V8', false])
  })

  test('na Revisão do relatório, "sem alteração" vale para o relatório mais recente', () => {
    expect(rotulos(relatorio())[0]).toEqual(['Sem alteração: vale para o Relatório R2', false])
  })

  test('"corrigida" liga o que foi enviado na passagem: a versão, o relatório ou os dois', () => {
    expect(rotulos(fluxograma({ ultimaVersao: V8 }))[1]).toEqual(['Corrigida: a V8 corrige a V7', false])
    expect(rotulos(relatorio({ ultimoRelatorio: R2 }))[1]).toEqual(['Corrigida: o Relatório R2 corrige o Relatório R1', false])
    expect(rotulos(relatorio({ ultimaVersao: V8, ultimoRelatorio: R2 }))[1])
      .toEqual(['Corrigida: a V8 corrige a V7; o Relatório R2 corrige o Relatório R1', false])
  })

  test('"corrigida" fica desabilitada, com o motivo, quando nada foi enviado nesta passagem (ou o enviado não tem anterior)', () => {
    for (const contexto of [fluxograma(), relatorio(), fluxograma({ ultimaVersao: { ...V8, anterior: undefined } })]) {
      expect(opcoesDoResultado(contexto)[1]).toMatchObject({ rotulo: 'Corrigida', desabilitada: true, motivo: MOTIVO_SEM_VERSAO_NA_PASSAGEM })
    }
    expect(MOTIVO_SEM_VERSAO_NA_PASSAGEM).toBe('Nada foi enviado desde que o processo entrou nesta etapa.')
  })
})

describe('avisoDoAutorDaRevisao', () => {
  test('na Revisão do fluxograma, avisa quem enviou a versão revisada', () => {
    expect(avisoDoAutorDaRevisao(fluxograma(), 'sem_alteracao', 'u1')).toBe('Você enviou a V8. A revisão do fluxograma deveria ser de outra pessoa.')
    expect(avisoDoAutorDaRevisao(fluxograma({ ultimaVersao: V8 }), 'corrigida', 'u3'))
      .toBe('Você enviou a V7. A revisão do fluxograma deveria ser de outra pessoa.')
    expect(avisoDoAutorDaRevisao(fluxograma({ ultimaVersao: V8 }), 'corrigida', 'u1')).toBeNull()
  })

  test('na Revisão do relatório, avisa quem enviou o relatório revisado', () => {
    expect(avisoDoAutorDaRevisao(relatorio(), 'sem_alteracao', 'u4'))
      .toBe('Você enviou o Relatório R2. A revisão do relatório deveria ser de outra pessoa.')
    expect(avisoDoAutorDaRevisao(relatorio({ ultimoRelatorio: R2 }), 'corrigida', 'u5'))
      .toBe('Você enviou o Relatório R1. A revisão do relatório deveria ser de outra pessoa.')
    expect(avisoDoAutorDaRevisao(relatorio(), 'sem_alteracao', 'u1')).toBeNull()
  })

  test('sem o que a opção revisa não há aviso', () => {
    expect(avisoDoAutorDaRevisao(fluxograma({ ultimaVersao: null }), 'sem_alteracao', 'u1')).toBeNull()
    expect(avisoDoAutorDaRevisao(relatorio(), 'corrigida', 'u5')).toBeNull()
  })
})

test('o aviso da aprovação diz qual aprovação ela substitui e quando foi registrada', () => {
  const anterior = { id: 'a', versao: 7, numeroEprotocolo: null, link: null, aprovadaEm: null, registradaPor: 'Ana', registradaEm: '2026-10-13T12:00:00Z' }
  expect(avisoDaAprovacaoSubstituida(anterior)).toBe('Esta aprovação toma o lugar da aprovação da V7, registrada em 13/10/2026.')
  expect(avisoDaAprovacaoSubstituida(null)).toBeNull()
})

describe('resumos do Agora', () => {
  const base: RevisaoInterna = {
    id: 'r', etapa: 'revisao_interna', comentario: null, revisor: 'Ana', revisadaEm: '2026-10-13', versaoRevisada: 7, versaoCorrigida: null,
    relatorioRevisado: null, relatorioCorrigido: null, resultado: 'sem_alteracao', escopo: null,
  }
  test('revisão do fluxograma', () => {
    expect(resumoDaRevisao(base)).toBe('Sem alteração · V7 · Ana')
    expect(resumoDaRevisao({ ...base, versaoCorrigida: 8, resultado: 'corrigida', escopo: 'fluxograma' })).toBe('Corrigida · V8 corrige a V7')
  })

  test('revisão do relatório', () => {
    const doRelatorio = { ...base, etapa: 'revisao_relatorio', relatorioRevisado: 1 } as const
    expect(resumoDaRevisao(doRelatorio)).toBe('Sem alteração · Relatório R1 · Ana')
    expect(resumoDaRevisao({ ...doRelatorio, relatorioCorrigido: 2, versaoCorrigida: 8, resultado: 'corrigida', escopo: 'ambos' }))
      .toBe('Corrigida · V8 corrige a V7; Relatório R2 corrige o Relatório R1')
  })

  test('aprovação, com e sem número', () => {
    const aprovacao = { id: 'a', versao: 8, numeroEprotocolo: 'PROT-1', link: null, aprovadaEm: null, registradaPor: null, registradaEm: '' }
    expect(resumoDaAprovacao(aprovacao)).toBe('V8 aprovada · E-protocolo PROT-1')
    expect(resumoDaAprovacao({ ...aprovacao, numeroEprotocolo: null })).toBe('V8 aprovada')
  })
})
