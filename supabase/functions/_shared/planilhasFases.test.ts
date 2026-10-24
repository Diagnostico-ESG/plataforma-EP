import { describe, expect, it } from 'vitest'
import { etapasDoCatalogo, processoNaTrilha, uuid, type PassoDaTrilha } from './planilhasExemplos.ts'
import { situacaoDasFases, type FaseDoProcesso } from './planilhasFases.ts'
import type { EtapaDoPacote, ProcessoDoPacote } from './planilhasPacote.ts'

const passo = (etapa: string, dia: string, extra: Partial<PassoDaTrilha> = {}): PassoDaTrilha => ({
  etapa,
  entrou: `${dia}T12:00:00Z`,
  ...extra,
})
const concluido = (dia: string): Partial<PassoDaTrilha> => ({ etiqueta: 'concluido', concluidoEm: `${dia}T12:00:00Z` })

// O caminho até a Revisão interna: a IV e a V ficaram para trás (entradas em 2026-04-01 e 2026-05-01).
const ATE_REVISAO_INTERNA = [
  passo('nao_iniciados', '2026-03-01'),
  passo('modelagem', '2026-03-02'),
  passo('relatorio_modelagem_tecnica', '2026-04-01'),
  passo('revisao_interna', '2026-05-01'),
]
const ATE_APROVACAO = [...ATE_REVISAO_INTERNA, passo('revisao_setor', '2026-05-10'), passo('aprovacao_setor', '2026-06-01')]

function fasesDe(
  passos: PassoDaTrilha[],
  campos: Partial<ProcessoDoPacote> = {},
  etapas: EtapaDoPacote[] = etapasDoCatalogo(),
): FaseDoProcesso[] {
  const { processo, passagens } = processoNaTrilha(1, passos, campos)
  return situacaoDasFases(etapas, processo, passagens)
}

const situacoes = (fases: FaseDoProcesso[]): string[] => fases.slice(3).map((fase) => fase.situacao)
const datas = (fases: FaseDoProcesso[]): (string | null)[] => fases.slice(3).map((fase) => fase.concluidaEm)

describe('situacaoDasFases: o que a posição no catálogo diz de cada fase', () => {
  it('sempre devolve as sete fases, de I a VII', () => {
    expect(fasesDe([passo('nao_iniciados', '2026-03-01')]).map((fase) => fase.fase)).toEqual(
      ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'],
    )
  })

  it('dá as fases I a III como concluídas, sem data, em qualquer posição', () => {
    for (const passos of [[passo('nao_iniciados', '2026-03-01')], ATE_REVISAO_INTERNA]) {
      for (const fase of fasesDe(passos).slice(0, 3)) {
        expect(fase.situacao).toBe('Concluída')
        expect(fase.concluidaEm).toBeNull()
      }
    }
  })

  it('em Não iniciados nenhuma fase foi iniciada', () => {
    const fases = fasesDe([passo('nao_iniciados', '2026-03-01')])
    expect(situacoes(fases)).toEqual(['Não iniciada', 'Não iniciada', 'Não iniciada', 'Não iniciada'])
    expect(datas(fases)).toEqual([null, null, null, null])
  })

  it('numa etapa da fase, ela está em andamento e as anteriores, concluídas pela entrada na etapa depois delas', () => {
    const fases = fasesDe(ATE_REVISAO_INTERNA)
    expect(situacoes(fases)).toEqual(['Concluída', 'Concluída', 'Em andamento', 'Não iniciada'])
    expect(datas(fases)).toEqual(['2026-04-01', '2026-05-01', null, null])
  })

  it('na primeira etapa de uma fase, a fase anterior já está concluída', () => {
    expect(situacoes(fasesDe([passo('nao_iniciados', '2026-03-01'), passo('modelagem', '2026-03-02')]))).toEqual(
      ['Em andamento', 'Não iniciada', 'Não iniciada', 'Não iniciada'],
    )
  })

  it('na última etapa da fase com A fazer, a fase segue em andamento', () => {
    const fases = fasesDe(ATE_APROVACAO)
    expect(situacoes(fases)).toEqual(['Concluída', 'Concluída', 'Em andamento', 'Não iniciada'])
    expect(fases[5].concluidaEm).toBeNull()
  })

  it('na última etapa da fase com Concluído, a fase conta como concluída, na data do Concluído', () => {
    const fases = fasesDe([...ATE_REVISAO_INTERNA, passo('revisao_setor', '2026-05-10'), passo('aprovacao_setor', '2026-06-01', concluido('2026-06-03'))])
    expect(situacoes(fases)).toEqual(['Concluída', 'Concluída', 'Concluída', 'Não iniciada'])
    expect(datas(fases)).toEqual(['2026-04-01', '2026-05-01', '2026-06-03', null])
  })

  it('numa etapa do meio da fase com Concluído, a fase ainda não terminou', () => {
    const passos = [...ATE_REVISAO_INTERNA.slice(0, 3), passo('revisao_interna', '2026-05-01', concluido('2026-05-02'))]
    expect(situacoes(fasesDe(passos))[2]).toBe('Em andamento')
  })

  it('na Publicação sem a data da publicação, a VII está em andamento e a VI, concluída pela entrada', () => {
    const fases = fasesDe([...ATE_APROVACAO, passo('publicacao', '2026-07-01')])
    expect(situacoes(fases)).toEqual(['Concluída', 'Concluída', 'Concluída', 'Em andamento'])
    expect(datas(fases)).toEqual(['2026-04-01', '2026-05-01', '2026-07-01', null])
  })

  it('na Publicação com Concluído mas sem a data da publicação, a VII fica "Sem publicação"', () => {
    const fases = fasesDe([...ATE_APROVACAO, passo('publicacao', '2026-07-01', concluido('2026-07-02'))])
    expect(fases[6].situacao).toBe('Sem publicação')
    expect(fases[6].concluidaEm).toBeNull()
  })

  it('na Publicação com Concluído e a data da publicação, a VII está concluída nessa data', () => {
    const fases = fasesDe([...ATE_APROVACAO, passo('publicacao', '2026-07-01', concluido('2026-07-02'))], {
      publicado_em: '2026-07-10',
    })
    expect(fases[6]).toEqual({ fase: 'VII', situacao: 'Concluída', concluidaEm: '2026-07-10' })
  })

  it('em Concluídos com a data da publicação, todas as fases estão concluídas', () => {
    const fases = fasesDe([...ATE_APROVACAO, passo('publicacao', '2026-07-01'), passo('concluidos', '2026-07-12')], {
      publicado_em: '2026-07-10',
    })
    expect(situacoes(fases)).toEqual(['Concluída', 'Concluída', 'Concluída', 'Concluída'])
    expect(datas(fases)).toEqual(['2026-04-01', '2026-05-01', '2026-07-01', '2026-07-10'])
  })

  it('em Concluídos sem a data da publicação, a VII é "Sem publicação" e as outras estão concluídas', () => {
    const fases = fasesDe([...ATE_APROVACAO, passo('publicacao', '2026-07-01'), passo('concluidos', '2026-07-12')])
    expect(situacoes(fases)).toEqual(['Concluída', 'Concluída', 'Concluída', 'Sem publicação'])
    expect(datas(fases)).toEqual(['2026-04-01', '2026-05-01', '2026-07-01', null])
  })

  it('uma fase sem etapa ativa é "Sem etapa" e a seguinte segue a regra', () => {
    const semFaseVI = etapasDoCatalogo().filter((etapa) => etapa.fase !== 'VI')
    const fases = fasesDe([passo('nao_iniciados', '2026-03-01'), passo('modelagem', '2026-03-02'), passo('publicacao', '2026-07-01')], {}, semFaseVI)
    expect(situacoes(fases)).toEqual(['Concluída', 'Concluída', 'Sem etapa', 'Em andamento'])
    expect(fases[5].concluidaEm).toBeNull()
  })

  it('com a etapa atual fora do catálogo, nenhuma fase foi iniciada e nada quebra', () => {
    const fases = fasesDe(ATE_REVISAO_INTERNA, { etapa_atual_id: uuid(999) })
    expect(situacoes(fases)).toEqual(['Não iniciada', 'Não iniciada', 'Não iniciada', 'Não iniciada'])
  })
})

describe('situacaoDasFases: a data de conclusão', () => {
  it('mantém a data do Concluído quando o processo segue em frente', () => {
    const passos = [...ATE_APROVACAO.slice(0, 5), passo('aprovacao_setor', '2026-06-01', concluido('2026-06-03')), passo('publicacao', '2026-06-20')]
    expect(fasesDe(passos)[5].concluidaEm).toBe('2026-06-03')
  })

  it('vale a data mais recente quando o processo volta e conclui de novo', () => {
    const passos = [
      ...ATE_APROVACAO.slice(0, 5),
      passo('aprovacao_setor', '2026-06-01', concluido('2026-06-03')),
      passo('publicacao', '2026-06-20'),
      passo('aprovacao_setor', '2026-06-25', concluido('2026-06-26')),
    ]
    expect(fasesDe(passos)[5]).toEqual({ fase: 'VI', situacao: 'Concluída', concluidaEm: '2026-06-26' })
  })

  it('vale a entrada mais recente depois da fase quando o processo voltou, e sai de novo sem concluir', () => {
    const passos = [...ATE_APROVACAO, passo('publicacao', '2026-06-20'), passo('revisao_interna', '2026-06-22'), passo('publicacao', '2026-06-30')]
    expect(fasesDe(passos)[5].concluidaEm).toBe('2026-06-30')
  })

  it('deixa a fase sem data enquanto o processo voltou para dentro dela', () => {
    const passos = [...ATE_APROVACAO, passo('publicacao', '2026-06-20'), passo('revisao_setor', '2026-06-22')]
    const fases = fasesDe(passos)
    expect(fases[5]).toEqual({ fase: 'VI', situacao: 'Em andamento', concluidaEm: null })
    expect(fases[4].concluidaEm).toBe('2026-05-01')
  })

  it('conta o dia de Brasília, não o de Greenwich', () => {
    const passos = [passo('nao_iniciados', '2026-03-01'), passo('modelagem', '2026-03-02'), { etapa: 'relatorio_modelagem_tecnica', entrou: '2026-05-02T01:30:00Z' }]
    expect(fasesDe(passos)[3].concluidaEm).toBe('2026-05-01')
  })

  it('deixa a data vazia, sem erro, se o Concluído veio sem a data (dado incoerente)', () => {
    const passos = [...ATE_APROVACAO.slice(0, 5), { ...passo('aprovacao_setor', '2026-06-01'), etiqueta: 'concluido' as const }]
    expect(fasesDe(passos)[5]).toEqual({ fase: 'VI', situacao: 'Concluída', concluidaEm: null })
  })
})
