import { describe, expect, test } from 'vitest'
import { ColunasFaltando, lerPlanilha } from './lerPlanilha'

const HOJE = new Date(2026, 10, 5)
const CABECALHO = [
  'Área', 'Macros', 'Processos', '', 'I - Ident. Respons.', 'II - Reun. Sensib.', 'III - Ident. Macrop.',
  'Modelagem Piloto', 'Data da Modelagem Piloto', 'Modelagem Técnica', 'Revisão Interna', 'V - Relatório Piloto',
  'VI - Revisão e validação', 'VII - Publicação', 'Data da Publicação', 'VIII - Avaliação', 'IX - Remodelagem',
  'Observações', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8',
]

type Parte = {
  area?: string; macro?: string; nome?: string; mp?: string; dmp?: string; mt?: string; ri?: string; rp?: string
  vi?: string; vii?: string; dp?: string; obs?: string
}

// Colunas fora das usadas ficam vazias; cada argumento é a coluna da planilha com o mesmo nome.
const PADRAO: Required<Parte> = {
  area: 'XYZ', macro: 'I - Gestão de exemplos', nome: 'Exemplo Alfa', mp: '', dmp: '', mt: '', ri: '', rp: '', vi: '', vii: '',
  dp: '', obs: '',
}

function linha(parte: Parte): string[] {
  const p = { ...PADRAO, ...parte }
  return [
    p.area, p.macro, p.nome, '', '', '', '', p.mp, p.dmp, p.mt, p.ri, p.rp, p.vi, p.vii, p.dp, '', '', p.obs,
    'x', '', '', '', '', '', '', '',
  ]
}

function csv(linhas: string[][], separador = ';'): string {
  const titulo = ['ETAPAS DO MAPEAMENTO', ...Array(25).fill('')]
  const subtitulo = ['', '', '', '', '', '', '', 'IV - Modelagem', ...Array(18).fill('')]
  const todas = [titulo, subtitulo, CABECALHO, ...linhas]
  return todas.map((l) => l.join(separador)).join('\r\n')
}

function ler(p: Parte) {
  return lerPlanilha(csv([linha(p)]), HOJE)
}

describe('etapa pela última coluna Concluído', () => {
  test.each([
    [{ mp: 'Concluído' }, 'modelagem'],
    [{ mp: 'Concluído', mt: 'Concluído' }, 'relatorio_modelagem_tecnica'],
    [{ mp: 'Concluído', mt: 'Não realizada', ri: 'Concluído' }, 'revisao_interna'],
    [{ mp: 'Concluído', mt: 'Concluído', ri: 'Concluído', rp: 'Concluído' }, 'relatorio_modelagem_tecnica'],
    [{ mp: 'Concluído', mt: 'Concluído', ri: 'Concluído', rp: 'Concluído', vi: 'Concluído' }, 'aprovacao_setor'],
    [{ mp: 'Concluído', mt: 'Concluído', ri: 'Concluído', rp: 'Concluído', vi: 'Concluído', vii: 'Concluído', dp: '16 10 2026' },
      'concluidos'],
  ] as [Parte, string][])('%j vai para %s', (p, etapa) => {
    expect(ler(p).processos[0].etapaCodigo).toBe(etapa)
  })

  test('sem nenhum Concluído entre as colunas de etapa, o processo fica em Não iniciados', () => {
    expect(ler({ mp: 'A fazer' }).processos[0].etapaCodigo).toBe('nao_iniciados')
    expect(ler({}).processos[0].etapaCodigo).toBe('nao_iniciados')
  })

  test('Não realizada conta como Concluído', () => {
    expect(ler({ mp: 'Não realizada' }).processos[0].etapaCodigo).toBe('modelagem')
  })

  test('um Concluído depois de coluna vazia vale como a última e gera aviso', () => {
    const lida = ler({ mp: 'Concluído', ri: 'Concluído' })
    expect(lida.processos[0].etapaCodigo).toBe('revisao_interna')
    expect(lida.avisos).toHaveLength(1)
    expect(lida.avisos[0]).toMatchObject({ linha: 4, nome: 'Exemplo Alfa' })
  })
})

describe('Concluídos e datas', () => {
  const ATE_VI = { mp: 'Concluído', mt: 'Concluído', ri: 'Concluído', rp: 'Concluído', vi: 'Concluído', vii: 'Concluído' }

  test('a Data da Publicação em dia mês ano com espaços e com barras vale', () => {
    expect(ler({ ...ATE_VI, dp: '16 10 2026' }).processos[0].dataDaPublicacao).toBe('2026-10-16')
    expect(ler({ ...ATE_VI, dp: '01/09/2026' }).processos[0].dataDaPublicacao).toBe('2026-09-01')
  })

  test('VII concluída sem data entra em Publicação, com aviso', () => {
    const lida = ler(ATE_VI)
    expect(lida.processos[0]).toMatchObject({ etapaCodigo: 'publicacao', dataDaPublicacao: null })
    expect(lida.avisos).toHaveLength(1)
  })

  test('data ilegível da publicação conta como sem data e avisa', () => {
    const lida = ler({ ...ATE_VI, dp: 'outubro' })
    expect(lida.processos[0].etapaCodigo).toBe('publicacao')
    expect(lida.avisos).toHaveLength(1)
  })

  test('a data do piloto vale quando o piloto foi feito; ilegível, futura ou em Não iniciados é ignorada com aviso', () => {
    expect(ler({ mp: 'Concluído', dmp: '01/09/2026' }).processos[0].dataDaModelagemPiloto).toBe('2026-09-01')
    for (const p of [{ mp: 'Concluído', dmp: '31/02/2026' }, { mp: 'Concluído', dmp: '01/01/2030' }, { dmp: '01/09/2026' }]) {
      const lida = ler(p)
      expect(lida.processos[0].dataDaModelagemPiloto).toBeNull()
      expect(lida.avisos).toHaveLength(1)
    }
  })

  test('data da publicação sem VII concluída é ignorada com aviso', () => {
    const lida = ler({ mp: 'Concluído', dp: '16 10 2026' })
    expect(lida.processos[0].dataDaPublicacao).toBeNull()
    expect(lida.avisos).toHaveLength(1)
  })
})

describe('setor, macroprocesso e nome', () => {
  test('o setor é a sigla em maiúsculas', () => {
    expect(ler({ area: ' xyz ' }).processos[0].setor).toBe('XYZ')
  })

  test('o macroprocesso perde o numeral romano e o hífen', () => {
    expect(ler({ macro: 'II - Orçamentário' }).processos[0].macroprocesso).toBe('Orçamentário')
    expect(ler({ macro: 'X - Gestão de exemplos' }).processos[0].macroprocesso).toBe('Gestão de exemplos')
  })

  test.each(['Subprocesso Geral', 'Subprocesso de eventos', 'DL - DIRETOR LEGISLATIVO', '', 'III - Subprocesso Geral'])(
    'o macroprocesso "%s" vai para A definir', (macro) => {
      expect(ler({ macro }).processos[0].macroprocesso).toBe('A definir')
    })

  test('nome com " - " segue como processo e a coluna D não conta', () => {
    const lida = ler({ nome: 'Execução de Exemplo - Análise de Exemplo' })
    expect(lida.processos[0].nome).toBe('Execução de Exemplo - Análise de Exemplo')
    expect(lida.avisos).toHaveLength(0)
  })

  test('as Observações viram anotações; acima de 8000 caracteres são cortadas com aviso', () => {
    expect(ler({ obs: 'Falta o fluxo' }).processos[0].anotacoes).toBe('Falta o fluxo')
    expect(ler({}).processos[0].anotacoes).toBeNull()
    const longa = ler({ obs: 'a'.repeat(8001) })
    expect(longa.processos[0].anotacoes).toHaveLength(8000)
    expect(longa.avisos).toHaveLength(1)
  })
})

describe('linhas', () => {
  test('a linha repetida vale a primeira e a segunda é listada', () => {
    const lida = lerPlanilha(csv([
      linha({ nome: 'Exemplo Alfa', mp: 'Concluído' }), linha({ nome: ' exemplo alfa ' }), linha({ nome: 'Exemplo Beta' }),
    ]), HOJE)
    expect(lida.processos.map((p) => p.nome)).toEqual(['Exemplo Alfa', 'Exemplo Beta'])
    expect(lida.repetidos).toEqual([{ linha: 5, setor: 'XYZ', nome: 'exemplo alfa' }])
  })

  test('o mesmo nome em outro setor não é repetição', () => {
    const lida = lerPlanilha(csv([linha({}), linha({ area: 'ABC' })]), HOJE)
    expect(lida.processos).toHaveLength(2)
  })

  test('linha vazia some em silêncio; sem Área ou sem nome é ignorada com aviso', () => {
    const lida = lerPlanilha(csv([Array(26).fill(''), linha({ area: '' }), linha({ nome: '' })]), HOJE)
    expect(lida.processos).toHaveLength(0)
    expect(lida.avisos).toHaveLength(2)
  })
})

describe('formato do arquivo', () => {
  test('vírgula como separador, BOM e campo entre aspas com quebra de linha', () => {
    const texto = '﻿' + csv([linha({ obs: 'linha um\nlinha, dois' }).map((c) => (c.includes(',') ? `"${c}"` : c))], ',')
    const lida = lerPlanilha(texto.replace('"linha um\nlinha, dois"', '"linha um\nlinha, dois"'), HOJE)
    expect(lida.processos[0].anotacoes).toBe('linha um\nlinha, dois')
  })

  test('colunas faltando são recusadas com os nomes que faltam', () => {
    const semData = csv([linha({})]).replace('Data da Publicação', 'Outra coisa')
    const erro = (() => { try { lerPlanilha(semData, HOJE) } catch (e) { return e } })()
    expect(erro).toBeInstanceOf(ColunasFaltando)
    expect((erro as ColunasFaltando).faltam).toEqual(['Data da Publicação'])
  })

  test('um arquivo que não é a planilha é recusado com todas as colunas', () => {
    const erro = (() => { try { lerPlanilha('a;b\n1;2', HOJE) } catch (e) { return e } })()
    expect(erro).toBeInstanceOf(ColunasFaltando)
    expect((erro as ColunasFaltando).faltam).toContain('Processos')
  })
})
