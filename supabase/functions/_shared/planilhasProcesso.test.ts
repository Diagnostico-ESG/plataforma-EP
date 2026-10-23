import { describe, expect, it } from 'vitest'
import { situacaoDasFases } from './planilhasFases.ts'
import {
  dataDaModelagemPiloto,
  dataDaPublicacao,
  rotuloDaVersao,
  rotuloDoProcesso,
  rotuloDoTipo,
} from './planilhasProcesso.ts'
import { andamentosDe, etapasDoCatalogo, processoDe, type Marca } from './planilhasExemplos.ts'
import type { ProcessoDoPacote, StatusDaEtapa } from './planilhasPacote.ts'

type Marcas = Record<string, StatusDaEtapa | Marca>

const etapas = etapasDoCatalogo()

function rotulo(marcas: Marcas, campos: Partial<ProcessoDoPacote> = {}): string {
  const processo = processoDe(1, campos)
  const fases = situacaoDasFases(etapas, andamentosDe(processo, marcas, etapas), processo.vai_para_publicacao)
  return rotuloDoProcesso(processo, fases)
}

const ATE_A_VI: Marcas = {
  modelagem: 'concluida',
  relatorio_modelagem_tecnica: 'concluida',
  revisao_interna: 'concluida',
  revisao_setor: 'concluida',
  aprovacao_setor: 'concluida',
}

describe('rotuloDoProcesso', () => {
  it('"Publicado" quando a fase VII está concluída', () => {
    expect(rotulo({ ...ATE_A_VI, publicacao: 'concluida' }, { concluido: true })).toBe('Publicado')
  })

  it('"Publicado" também com a Publicação realizada anteriormente', () => {
    expect(rotulo({ ...ATE_A_VI, publicacao: 'realizada_anteriormente' }, { concluido: true })).toBe('Publicado')
  })

  it('"Publicado" com a Publicação registrada depois da escolha "não" (que passa a "sim")', () => {
    const marcas = { ...ATE_A_VI, publicacao: { status: 'concluida', resolvida_em: '2026-08-01' } } as const
    expect(rotulo(marcas, { concluido: true, vai_para_publicacao: true })).toBe('Publicado')
  })

  it('"Concluído" quando o processo está concluído com a escolha "não" e a Publicação pendente', () => {
    expect(rotulo({ ...ATE_A_VI, publicacao: 'pendente' }, { concluido: true, vai_para_publicacao: false })).toBe('Concluído')
  })

  it('"Concluído" quando o processo está concluído e o catálogo não tem etapa na fase VII', () => {
    const semFaseVII = etapas.filter((e) => e.fase !== 'VII')
    const processo = processoDe(1, { concluido: true })
    const fases = situacaoDasFases(semFaseVII, andamentosDe(processo, ATE_A_VI, semFaseVII))
    expect(rotuloDoProcesso(processo, fases)).toBe('Concluído')
  })

  it('"Em andamento · fase" quando a fase atual tem etapa em andamento', () => {
    expect(rotulo({ modelagem: 'concluida', relatorio_modelagem_tecnica: 'em_andamento' })).toBe('Em andamento · V')
  })

  it('"Em andamento · IV" com a Modelagem piloto em andamento', () => {
    expect(rotulo({ modelagem: 'em_andamento' })).toBe('Em andamento · IV')
  })

  it('"Próxima · fase" quando a fase anterior terminou e a atual não começou', () => {
    expect(rotulo({ modelagem: 'concluida', relatorio_modelagem_tecnica: 'concluida' })).toBe('Próxima · VI')
  })

  it('"Próxima · IV" para o processo novo, sem nada iniciado', () => {
    expect(rotulo({})).toBe('Próxima · IV')
  })

  it('"Suspenso · fase" com a fase atual, antes de qualquer outro rótulo', () => {
    expect(rotulo({ modelagem: 'em_andamento' }, { situacao_guardada: 'suspenso' })).toBe('Suspenso · IV')
    expect(rotulo({ modelagem: 'concluida' }, { situacao_guardada: 'suspenso' })).toBe('Suspenso · V')
  })

  it('"Suspenso" sem fase quando o processo já terminou todas as fases', () => {
    const marcas = { ...ATE_A_VI, publicacao: 'concluida' } as const
    expect(rotulo(marcas, { situacao_guardada: 'suspenso' })).toBe('Suspenso')
  })

  it('sem fase atual e sem estar concluído, o rótulo é "Em andamento", sem fase', () => {
    const semEtapas = [] as typeof etapas
    const processo = processoDe(1)
    expect(rotuloDoProcesso(processo, situacaoDasFases(semEtapas, []))).toBe('Em andamento')
  })
})

describe('dataDaModelagemPiloto', () => {
  const processo = processoDe(1)

  it('é a data da reunião', () => {
    const andamentos = andamentosDe(processo, { modelagem: { status: 'concluida', resolvida_em: '2026-04-02' } })
    expect(dataDaModelagemPiloto({ ...processo, data_da_reuniao: '2026-03-10' }, etapas, andamentos)).toBe('2026-03-10')
  })

  it('sem reunião, é a conclusão da etapa Modelagem piloto', () => {
    const andamentos = andamentosDe(processo, { modelagem: { status: 'concluida', resolvida_em: '2026-04-02' } })
    expect(dataDaModelagemPiloto(processo, etapas, andamentos)).toBe('2026-04-02')
  })

  it('a etapa realizada anteriormente também dá a data', () => {
    const andamentos = andamentosDe(processo, { modelagem: { status: 'realizada_anteriormente', resolvida_em: '2026-01-15' } })
    expect(dataDaModelagemPiloto(processo, etapas, andamentos)).toBe('2026-01-15')
  })

  it('a etapa dispensada não dá data', () => {
    const andamentos = andamentosDe(processo, { modelagem: { status: 'dispensada', resolvida_em: '2026-04-02' } })
    expect(dataDaModelagemPiloto(processo, etapas, andamentos)).toBe('')
  })

  it('sem reunião e sem conclusão, fica vazia', () => {
    expect(dataDaModelagemPiloto(processo, etapas, andamentosDe(processo, { modelagem: 'em_andamento' }))).toBe('')
  })
})

describe('dataDaPublicacao', () => {
  const processo = processoDe(1)

  it('é a conclusão da etapa Publicação', () => {
    const andamentos = andamentosDe(processo, { publicacao: { status: 'concluida', resolvida_em: '2026-09-01' } })
    expect(dataDaPublicacao(etapas, andamentos)).toBe('2026-09-01')
  })

  it('Publicação dispensada não dá data', () => {
    const andamentos = andamentosDe(processo, { publicacao: { status: 'dispensada', resolvida_em: '2026-09-01' } })
    expect(dataDaPublicacao(etapas, andamentos)).toBe('')
  })

  it('só a etapa Publicação conta, não outra concluída', () => {
    const andamentos = andamentosDe(processo, { aprovacao_setor: { status: 'concluida', resolvida_em: '2026-08-01' } })
    expect(dataDaPublicacao(etapas, andamentos)).toBe('')
  })

  it('catálogo sem a etapa Publicação deixa a data vazia', () => {
    const semPublicacao = etapas.filter((e) => e.codigo !== 'publicacao')
    expect(dataDaPublicacao(semPublicacao, andamentosDe(processo, {}, semPublicacao))).toBe('')
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
