import { describe, expect, test } from 'vitest'
import { umProcessoLido } from '../testes/processoDaLista'
import { acaoPrincipalDaEtapa, oQueSeRevisa, semOQueRevisar } from './acaoPrincipalDaEtapa'
import type { ProcessoLido } from './tipos'

// Com a V8 e o Relatório V1, as duas revisões têm o que revisar.
const COM_O_QUE_REVISAR: Partial<ProcessoLido> = {
  ultimaVersao: { numero: 8, autorId: 'u1', autorNome: 'Ana', papeis: [] },
  ultimoRelatorio: { numero: 1, autorId: 'u1', autorNome: 'Ana', enviadoNestaPassagem: false },
}
const naEtapa = (etapa: string, mudancas: Partial<ProcessoLido> = {}) =>
  umProcessoLido('Emitir Ofício', { id: 'p1', ...COM_O_QUE_REVISAR, ...mudancas }, etapa)

describe('acaoPrincipalDaEtapa', () => {
  test.each(['revisao_interna', 'revisao_relatorio'])('a %s pede o registro da revisão enquanto a passagem não tem uma', (etapa) => {
    expect(acaoPrincipalDaEtapa(naEtapa(etapa), true, false)).toBe('registrar_revisao')
    expect(acaoPrincipalDaEtapa(naEtapa(etapa), true, true)).toBeNull()
  })

  test('sem o que revisar não há [Registrar revisão], e o Agora diz o que falta', () => {
    const semVersao = naEtapa('revisao_interna', { ultimaVersao: null })
    const semRelatorio = naEtapa('revisao_relatorio', { ultimoRelatorio: null })
    expect(acaoPrincipalDaEtapa(semVersao, true, false)).toBeNull()
    expect(acaoPrincipalDaEtapa(semRelatorio, true, false)).toBeNull()
    expect(semOQueRevisar(semVersao)).toBe('Sem versão para revisar.')
    expect(semOQueRevisar(semRelatorio)).toBe('Sem relatório para revisar.')
    expect(semOQueRevisar(naEtapa('revisao_relatorio', { ultimoRelatorio: undefined }))).toBe('Sem relatório para revisar.')
    expect(semOQueRevisar(naEtapa('revisao_relatorio'))).toBeNull()
    expect(semOQueRevisar(naEtapa('aprovacao_setor', { ultimaVersao: null }))).toBeNull()
  })

  test('o que se revisa: a versão mais recente no fluxograma, o relatório mais recente no relatório; nada sem ele ou fora das revisões', () => {
    expect(oQueSeRevisa(naEtapa('revisao_interna'))).toBe('A revisar: V8')
    expect(oQueSeRevisa(naEtapa('revisao_relatorio'))).toBe('A revisar: Relatório V1')
    expect(oQueSeRevisa(naEtapa('revisao_interna', { ultimaVersao: null }))).toBeNull()
    expect(oQueSeRevisa(naEtapa('revisao_relatorio', { ultimoRelatorio: null }))).toBeNull()
    expect(oQueSeRevisa(naEtapa('aprovacao_setor'))).toBeNull()
  })

  test('a Aprovação pelo setor sempre oferece registrar a aprovação', () => {
    expect(acaoPrincipalDaEtapa(naEtapa('aprovacao_setor'), true, false)).toBe('registrar_aprovacao')
    expect(acaoPrincipalDaEtapa(naEtapa('aprovacao_setor'), true, true)).toBe('registrar_aprovacao')
  })

  test('a Publicação e Concluídos sem data pedem registrar a publicação; com data, nada', () => {
    expect(acaoPrincipalDaEtapa(naEtapa('publicacao'), true, false)).toBe('registrar_publicacao')
    expect(acaoPrincipalDaEtapa(naEtapa('concluidos'), true, false)).toBe('registrar_publicacao')
    expect(acaoPrincipalDaEtapa(naEtapa('concluidos', { publicadoEm: '2026-10-01' }), true, false)).toBeNull()
  })

  test('as outras etapas não têm ação principal', () => {
    for (const etapa of ['nao_iniciados', 'modelagem', 'relatorio_modelagem_tecnica', 'revisao_setor']) {
      expect(acaoPrincipalDaEtapa(naEtapa(etapa), true, false)).toBeNull()
    }
  })

  test('quem só consulta, e o processo suspenso ou cancelado, não têm ação principal', () => {
    expect(acaoPrincipalDaEtapa(naEtapa('revisao_interna'), false, false)).toBeNull()
    expect(acaoPrincipalDaEtapa(naEtapa('aprovacao_setor', { situacao: 'suspenso' }), true, false)).toBeNull()
    expect(acaoPrincipalDaEtapa(naEtapa('publicacao', { situacao: 'cancelado' }), true, false)).toBeNull()
  })
})
