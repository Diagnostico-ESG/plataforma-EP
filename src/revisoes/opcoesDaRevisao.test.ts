import { describe, expect, test } from 'vitest'
import type { UltimaVersao } from '../processos/tipos'
import {
  MOTIVO_SEM_VERSAO, MOTIVO_SEM_VERSAO_NA_PASSAGEM, avisoDaAprovacaoSubstituida, avisoDoAutorDaRevisao, opcoesDoResultado,
  resumoDaAprovacao, resumoDaRevisao,
} from './opcoesDaRevisao'

const ULTIMA: UltimaVersao = { numero: 8, autorId: 'u1', autorNome: 'Ana', papeis: [], anterior: { numero: 7, autorId: 'u3' }, enviadaNestaPassagem: true }

describe('opcoesDoResultado', () => {
  test('mostra a versão de cada opção', () => {
    expect(opcoesDoResultado(ULTIMA).map((opcao) => [opcao.rotulo, opcao.desabilitada])).toEqual([
      ['Sem alteração: vale para a V8', false], ['Corrigida: a V8 corrige a V7', false],
    ])
  })

  test('"Corrigida" fica desabilitada, com o motivo, sem versão enviada na passagem ou sem anterior', () => {
    for (const ultima of [{ ...ULTIMA, enviadaNestaPassagem: false }, { ...ULTIMA, anterior: undefined }]) {
      const [sem, corrigida] = opcoesDoResultado(ultima)
      expect(sem.desabilitada).toBe(false)
      expect(corrigida).toMatchObject({ rotulo: 'Corrigida', desabilitada: true, motivo: MOTIVO_SEM_VERSAO_NA_PASSAGEM })
    }
  })

  test('sem versão nenhuma, as duas ficam desabilitadas com o motivo', () => {
    expect(opcoesDoResultado(null).map((opcao) => [opcao.desabilitada, opcao.motivo])).toEqual([[true, MOTIVO_SEM_VERSAO], [true, MOTIVO_SEM_VERSAO]])
  })
})

describe('avisoDoAutorDaRevisao', () => {
  test('na "sem alteração" avisa quem enviou a mais recente', () => {
    expect(avisoDoAutorDaRevisao(ULTIMA, 'sem_alteracao', 'u1')).toBe('Você enviou a V8. A revisão interna deveria ser de outra pessoa.')
    expect(avisoDoAutorDaRevisao(ULTIMA, 'sem_alteracao', 'u2')).toBeNull()
  })

  test('na "corrigida" avisa quem enviou a versão revisada (a anterior), não a corrigida', () => {
    expect(avisoDoAutorDaRevisao(ULTIMA, 'corrigida', 'u3')).toBe('Você enviou a V7. A revisão interna deveria ser de outra pessoa.')
    expect(avisoDoAutorDaRevisao(ULTIMA, 'corrigida', 'u1')).toBeNull()
  })

  test('sem versão aplicável não há aviso', () => {
    expect(avisoDoAutorDaRevisao(null, 'sem_alteracao', 'u1')).toBeNull()
    expect(avisoDoAutorDaRevisao({ ...ULTIMA, enviadaNestaPassagem: false }, 'corrigida', 'u3')).toBeNull()
  })
})

test('o aviso da aprovação diz qual aprovação ela substitui e quando foi registrada', () => {
  const anterior = { id: 'a', versao: 7, numeroEprotocolo: null, link: null, aprovadaEm: null, registradaPor: 'Ana', registradaEm: '2026-10-13T12:00:00Z' }
  expect(avisoDaAprovacaoSubstituida(anterior)).toBe('Esta aprovação toma o lugar da aprovação da V7, registrada em 13/10/2026.')
  expect(avisoDaAprovacaoSubstituida(null)).toBeNull()
})

describe('resumos do Agora', () => {
  const base = { id: 'r', comentario: null, revisor: 'Ana', revisadaEm: '2026-10-13' }
  test('revisão', () => {
    expect(resumoDaRevisao({ ...base, versaoRevisada: 7, versaoCorrigida: null, resultado: 'sem_alteracao', escopo: null })).toBe('Sem alteração · V7 · Ana')
    expect(resumoDaRevisao({ ...base, versaoRevisada: 7, versaoCorrigida: 8, resultado: 'corrigida', escopo: 'ambos' }))
      .toBe('Corrigida · V8 corrige a V7 · fluxograma e relatório')
  })

  test('aprovação, com e sem número', () => {
    const aprovacao = { id: 'a', versao: 8, numeroEprotocolo: 'PROT-1', link: null, aprovadaEm: null, registradaPor: null, registradaEm: '' }
    expect(resumoDaAprovacao(aprovacao)).toBe('V8 aprovada · E-protocolo PROT-1')
    expect(resumoDaAprovacao({ ...aprovacao, numeroEprotocolo: null })).toBe('V8 aprovada')
  })
})
