import { describe, expect, it } from 'vitest'
import type { FaseDoProcesso } from './planilhasFases.ts'
import {
  analisarProcessos,
  dataDaModelagemPiloto,
  dataDaPublicacao,
  rotuloDaVersao,
  rotuloDoProcesso,
  rotuloDoTipo,
} from './planilhasProcesso.ts'
import { etapasDoCatalogo, pacoteDe, processoDe, processoNaTrilha, uuid, type PassoDaTrilha } from './planilhasExemplos.ts'
import type { ProcessoDoPacote } from './planilhasPacote.ts'

const etapas = etapasDoCatalogo()
const passo = (etapa: string, dia: string): PassoDaTrilha => ({ etapa, entrou: `${dia}T12:00:00Z` })

function rotulo(codigoDaEtapaAtual: string, campos: Partial<ProcessoDoPacote> = {}): string {
  return rotuloDoProcesso(processoNaTrilha(1, [passo(codigoDaEtapaAtual, '2026-03-01')], campos).processo, etapas)
}

describe('rotuloDoProcesso', () => {
  it('"Publicado" em Concluídos com a data da publicação', () => {
    expect(rotulo('concluidos', { publicado_em: '2026-07-10' })).toBe('Publicado')
  })

  it('"Concluído" em Concluídos sem a data da publicação', () => {
    expect(rotulo('concluidos')).toBe('Concluído')
  })

  it('"Não iniciado" em Não iniciados', () => {
    expect(rotulo('nao_iniciados')).toBe('Não iniciado')
  })

  it.each([
    ['modelagem', 'IV'],
    ['relatorio_modelagem_tecnica', 'V'],
    ['revisao_setor', 'VI'],
    ['publicacao', 'VII'],
  ])('"Em andamento · fase" numa etapa de trabalho: %s é a fase %s', (etapa, fase) => {
    expect(rotulo(etapa)).toBe(`Em andamento · ${fase}`)
  })

  it('"Em andamento · fase" também com a etiqueta Concluído ou A fazer (a fase é a da etapa atual)', () => {
    const concluido = { ...processoNaTrilha(1, [passo('revisao_interna', '2026-03-01')]).processo, etiqueta: 'concluido' as const }
    expect(rotuloDoProcesso(concluido, etapas)).toBe('Em andamento · VI')
  })

  it('com a etapa atual fora do catálogo, o rótulo é "Em andamento", sem fase', () => {
    expect(rotulo('modelagem', { etapa_atual_id: uuid(999) })).toBe('Em andamento')
  })
})

// As sete fases, com a conclusão da IV na posição certa (a quarta).
function completas(concluidaEmDaIV: string | null): FaseDoProcesso[] {
  const sete: FaseDoProcesso[] = (['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'] as const).map((fase) => ({
    fase,
    situacao: 'Não iniciada',
    concluidaEm: null,
  }))
  sete[3] = { fase: 'IV', situacao: 'Concluída', concluidaEm: concluidaEmDaIV }
  return sete
}

describe('dataDaModelagemPiloto', () => {
  it('é a data da reunião, mesmo com a fase IV concluída em outro dia', () => {
    expect(dataDaModelagemPiloto(processoDe(1, { data_da_reuniao: '2026-02-20' }), completas('2026-03-01'))).toBe('2026-02-20')
  })

  it('sem reunião, é a data de conclusão da fase IV', () => {
    expect(dataDaModelagemPiloto(processoDe(1), completas('2026-03-01'))).toBe('2026-03-01')
  })

  it('sem reunião e sem conclusão da fase IV, fica vazia', () => {
    expect(dataDaModelagemPiloto(processoDe(1), completas(null))).toBe('')
  })
})

describe('dataDaPublicacao', () => {
  it('é a data da publicação do processo', () => {
    expect(dataDaPublicacao(processoDe(1, { publicado_em: '2026-07-10' }))).toBe('2026-07-10')
  })

  it('sem publicação, fica vazia', () => {
    expect(dataDaPublicacao(processoDe(1))).toBe('')
  })
})

describe('analisarProcessos: quem entra nas planilhas', () => {
  const novo = (n: number, campos: Partial<ProcessoDoPacote> = {}) =>
    processoNaTrilha(n, [passo('modelagem', '2026-03-01')], campos)

  it('deixa de fora os suspensos e os cancelados, e mantém a ordem do pacote', () => {
    const pacote = pacoteDe([
      novo(1),
      novo(2, { situacao_guardada: 'suspenso' }),
      novo(3, { situacao_guardada: 'cancelado' }),
      novo(4),
    ])
    expect(analisarProcessos(pacote).map(({ processo }) => processo.id)).toEqual([uuid(1), uuid(4)])
  })

  it('mantém o concluído e o arquivado (que chega em Concluídos)', () => {
    const concluido = processoNaTrilha(5, [passo('modelagem', '2026-03-01'), passo('concluidos', '2026-04-01')])
    expect(analisarProcessos(pacoteDe([concluido]))).toHaveLength(1)
  })

  it('calcula as sete fases de cada processo pelas passagens dele', () => {
    const analisados = analisarProcessos(pacoteDe([novo(1), processoNaTrilha(2, [passo('nao_iniciados', '2026-03-01')])]))
    expect(analisados[0].fases[3].situacao).toBe('Em andamento')
    expect(analisados[1].fases[3].situacao).toBe('Não iniciada')
    expect(analisados[0].fases).toHaveLength(7)
  })
})

describe('rotuloDoTipo e rotuloDaVersao', () => {
  it.each([
    ['processo', 'Processo'],
    ['subprocesso', 'Subprocesso'],
    ['a_classificar', 'A classificar'],
  ] as const)('o tipo %s vira "%s"', (tipo, rotuloEsperado) => {
    expect(rotuloDoTipo(tipo)).toBe(rotuloEsperado)
  })

  it('a última versão 7 vira "V7" e sem versão fica vazia', () => {
    expect(rotuloDaVersao(7)).toBe('V7')
    expect(rotuloDaVersao(null)).toBe('')
  })
})
