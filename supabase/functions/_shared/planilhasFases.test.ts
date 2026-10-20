import { describe, expect, it } from 'vitest'
import { andamentosDe, etapasDoCatalogo, processoDe, type Marca } from './planilhasExemplos.ts'
import type { EtapaDoPacote, StatusDaEtapa } from './planilhasPacote.ts'
import { situacaoDasFases, type FaseDoProcesso } from './planilhasFases.ts'

const processo = processoDe(1)

function fases(marcas: Record<string, StatusDaEtapa | Marca>, etapas: EtapaDoPacote[] = etapasDoCatalogo()): FaseDoProcesso[] {
  return situacaoDasFases(etapas, andamentosDe(processo, marcas, etapas))
}

function situacoes(marcas: Record<string, StatusDaEtapa | Marca>, etapas?: EtapaDoPacote[]): string[] {
  return fases(marcas, etapas).map((f) => f.situacao)
}

const TUDO_RESOLVIDO: Record<string, StatusDaEtapa> = {
  modelagem: 'concluida',
  relatorio_modelagem_tecnica: 'concluida',
  revisao_interna: 'concluida',
  revisao_setor: 'concluida',
  aprovacao_setor: 'concluida',
  publicacao: 'concluida',
}

describe('situacaoDasFases', () => {
  it('devolve as fases I a VII, nessa ordem', () => {
    expect(fases({}).map((f) => f.fase)).toEqual(['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'])
  })

  it('as fases I a III saem sempre concluídas, sem data', () => {
    const iniciais = fases({}).slice(0, 3)
    expect(iniciais.map((f) => f.situacao)).toEqual(['Concluída', 'Concluída', 'Concluída'])
    expect(iniciais.map((f) => f.concluidaEm)).toEqual([null, null, null])
  })

  it('a fase IV nunca começada fica pronta para iniciar, porque a III é sempre concluída', () => {
    expect(situacoes({})).toEqual(['Concluída', 'Concluída', 'Concluída', 'Pronto para iniciar', 'Aguardando etapa anterior', 'Aguardando etapa anterior', 'Aguardando etapa anterior'])
  })

  it('uma etapa em andamento deixa a fase em andamento', () => {
    expect(situacoes({ modelagem: 'em_andamento' })[3]).toBe('Em andamento')
  })

  it('a fase seguinte fica pronta para iniciar quando a anterior está concluída e nada nela começou', () => {
    expect(situacoes({ modelagem: 'concluida' }).slice(3)).toEqual(['Concluída', 'Pronto para iniciar', 'Aguardando etapa anterior', 'Aguardando etapa anterior'])
  })

  it('concluída, realizada anteriormente e dispensada contam como resolvidas', () => {
    const marcas = { revisao_interna: 'concluida', revisao_setor: 'realizada_anteriormente', aprovacao_setor: 'dispensada' } as const
    expect(situacoes(marcas)[5]).toBe('Concluída')
  })

  it('uma etapa resolvida e outra pendente deixam a fase em andamento', () => {
    expect(situacoes({ revisao_interna: 'concluida' })[5]).toBe('Em andamento')
  })

  it('a fase que nada começou, com a anterior não concluída, aguarda a etapa anterior', () => {
    expect(situacoes({ modelagem: 'em_andamento' })[4]).toBe('Aguardando etapa anterior')
  })

  it('etapa sem andamento no processo conta como pendente', () => {
    const resultado = situacaoDasFases(etapasDoCatalogo(), [])
    expect(resultado[3].situacao).toBe('Pronto para iniciar')
  })

  it('a fase VII com todas as etapas dispensadas é "Dispensada" e não conta como concluída', () => {
    const resultado = fases({ ...TUDO_RESOLVIDO, publicacao: 'dispensada' })
    expect(resultado[6].situacao).toBe('Dispensada')
    expect(resultado[6].concluidaEm).toBeNull()
  })

  it('uma fase VI toda dispensada continua concluída (só a Publicação tem a exceção)', () => {
    const marcas = { revisao_interna: 'dispensada', revisao_setor: 'dispensada', aprovacao_setor: 'dispensada' } as const
    expect(situacoes(marcas)[5]).toBe('Concluída')
  })

  it('a Publicação realizada anteriormente conta como concluída', () => {
    expect(situacoes({ ...TUDO_RESOLVIDO, publicacao: 'realizada_anteriormente' })[6]).toBe('Concluída')
  })

  it('a data de conclusão da fase é a maior data de resolução entre as etapas dela', () => {
    const resultado = fases({
      ...TUDO_RESOLVIDO,
      revisao_interna: { status: 'concluida', resolvida_em: '2026-05-10' },
      revisao_setor: { status: 'concluida', resolvida_em: '2026-06-20' },
      aprovacao_setor: { status: 'concluida', resolvida_em: '2026-06-01' },
    })
    expect(resultado[5].concluidaEm).toBe('2026-06-20')
  })

  it('a fase concluída sem data de resolução fica sem data', () => {
    expect(fases(TUDO_RESOLVIDO)[3].concluidaEm).toBeNull()
  })

  it('a fase não concluída não tem data de conclusão', () => {
    const resultado = fases({ modelagem: { status: 'em_andamento', resolvida_em: '2026-05-10' } })
    expect(resultado[3].concluidaEm).toBeNull()
  })

  it('a fase sem etapa ativa é "Sem etapa" e a seguinte aguarda a etapa anterior', () => {
    const semFaseV = etapasDoCatalogo().filter((e) => e.fase !== 'V')
    const resultado = situacoes({ modelagem: 'concluida' }, semFaseV)
    expect(resultado.slice(3)).toEqual(['Concluída', 'Sem etapa', 'Aguardando etapa anterior', 'Aguardando etapa anterior'])
  })

  it('ignora as etapas das fases VIII e IX', () => {
    const comFaseIX: EtapaDoPacote[] = [...etapasDoCatalogo(), { id: '00000000-0000-4000-8000-000000000999', codigo: 'remodelagem', ordem: 7, fase: 'IX' }]
    expect(situacoes({ ...TUDO_RESOLVIDO }, comFaseIX)).toEqual(Array(7).fill('Concluída'))
  })

  it('ignora o andamento de uma etapa que não está no catálogo ativo', () => {
    const andamentos = andamentosDe(processo, { modelagem: 'concluida' })
    andamentos.push({ processo_id: processo.id, etapa_id: '00000000-0000-4000-8000-000000000888', status: 'em_andamento', iniciada_em: null, resolvida_em: null })
    expect(situacaoDasFases(etapasDoCatalogo(), andamentos)[4].situacao).toBe('Pronto para iniciar')
  })
})
