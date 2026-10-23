import { describe, expect, it } from 'vitest'
import { montarPlanilhaInterna } from './planilhasInterna.ts'
import { pacoteDoCenario } from './planilhasCenario.ts'
import { uuid } from './planilhasExemplos.ts'

const abas = montarPlanilhaInterna(pacoteDoCenario())
const processos = abas[0]
const fases = abas[1]

function linhaDoProcesso(nome: string): (string | number)[] {
  const linha = processos.linhas.find((candidata) => candidata[3] === nome)
  if (!linha) throw new Error(`o processo ${nome} devia estar na aba Processos`)
  return linha
}

function fasesDoProcesso(nome: string): (string | number)[][] {
  const id = linhaDoProcesso(nome)[0]
  return fases.linhas.filter((linha) => linha[0] === id)
}

describe('montarPlanilhaInterna: aba Processos', () => {
  it('traz duas abas, Processos e Fases, nessa ordem', () => {
    expect(abas.map((aba) => aba.titulo)).toEqual(['Processos', 'Fases'])
  })

  it('o cabeçalho tem as colunas combinadas', () => {
    expect(processos.linhas[0]).toEqual([
      'Identificador', 'Área', 'Macroprocesso', 'Processo', 'Tipo', 'Situação',
      'Data da modelagem piloto', 'Data da publicação', 'Última versão', 'Observações',
    ])
  })

  it('o cancelado fica fora e o suspenso entra', () => {
    const nomes = processos.linhas.slice(1).map((linha) => linha[3])
    expect(nomes).not.toContain('Cancelado')
    expect(nomes).toContain('Suspenso')
    expect(nomes).toHaveLength(7)
  })

  it('subprocesso e "a classificar" entram, cada um com a sua linha e o tipo numa coluna', () => {
    expect(linhaDoProcesso('Sub')[4]).toBe('Subprocesso')
    expect(linhaDoProcesso('Classif')[4]).toBe('A classificar')
    expect(linhaDoProcesso('Comum')[4]).toBe('Processo')
  })

  it('cada linha traz o identificador, a área, o macroprocesso e o nome', () => {
    expect(linhaDoProcesso('Comum').slice(0, 4)).toEqual([uuid(1), 'SET', 'Macro Inventado', 'Comum'])
  })

  it('traz o rótulo da situação de cada processo', () => {
    expect(linhaDoProcesso('Comum')[5]).toBe('Em andamento · IV')
    expect(linhaDoProcesso('Sub')[5]).toBe('Próxima · IV')
    expect(linhaDoProcesso('Suspenso')[5]).toBe('Suspenso · V')
    expect(linhaDoProcesso('Publicado')[5]).toBe('Publicado')
    expect(linhaDoProcesso('Nao publicado')[5]).toBe('Concluído')
    expect(linhaDoProcesso('Arquivado')[5]).toBe('Publicado')
  })

  it('a data da modelagem piloto vem da reunião ou, sem ela, da conclusão da etapa', () => {
    expect(linhaDoProcesso('Comum')[6]).toBe('2026-02-20')
    expect(linhaDoProcesso('Publicado')[6]).toBe('2026-03-01')
    expect(linhaDoProcesso('Sub')[6]).toBe('')
  })

  it('a data da publicação vem da conclusão da Publicação; dispensada não dá data', () => {
    expect(linhaDoProcesso('Publicado')[7]).toBe('2026-07-01')
    expect(linhaDoProcesso('Nao publicado')[7]).toBe('')
    expect(linhaDoProcesso('Arquivado')[7]).toBe('2026-07-03')
  })

  it('a última versão vira "V7"; sem versão fica vazia', () => {
    expect(linhaDoProcesso('Publicado')[8]).toBe('V7')
    expect(linhaDoProcesso('Sub')[8]).toBe('')
  })

  it('as observações do processo vão só nesta aba; sem observação, vazio', () => {
    expect(linhaDoProcesso('Comum')[9]).toBe('Obs inventada')
    expect(linhaDoProcesso('Sub')[9]).toBe('')
    expect(fases.linhas.flat()).not.toContain('Obs inventada')
  })
})

describe('montarPlanilhaInterna: aba Fases', () => {
  it('o cabeçalho tem as colunas combinadas', () => {
    expect(fases.linhas[0]).toEqual(['Identificador', 'Área', 'Processo', 'Fase', 'Situação', 'Data de conclusão'])
  })

  it('tem uma linha por processo e fase, de I a VII, com o mesmo identificador da aba Processos', () => {
    const doComum = fasesDoProcesso('Comum')
    expect(doComum.map((linha) => linha[3])).toEqual(['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'])
    expect(fases.linhas).toHaveLength(1 + 7 * 7)
  })

  it('as fases I a III saem concluídas e sem data', () => {
    const iniciais = fasesDoProcesso('Comum').slice(0, 3)
    expect(iniciais.map((linha) => [linha[4], linha[5]])).toEqual([['Concluída', ''], ['Concluída', ''], ['Concluída', '']])
  })

  it('traz a situação de cada fase e a data de conclusão das concluídas', () => {
    const doPublicado = fasesDoProcesso('Publicado').map((linha) => [linha[3], linha[4], linha[5]])
    expect(doPublicado.slice(3)).toEqual([
      ['IV', 'Concluída', '2026-03-01'],
      ['V', 'Concluída', '2026-04-01'],
      ['VI', 'Concluída', '2026-06-01'],
      ['VII', 'Concluída', '2026-07-01'],
    ])
    expect(fasesDoProcesso('Comum').slice(3).map((linha) => linha[4])).toEqual([
      'Em andamento', 'Aguardando etapa anterior', 'Aguardando etapa anterior', 'Aguardando etapa anterior',
    ])
  })

  it('a fase VII com a escolha "não" aparece como "Não publicado", sem data', () => {
    expect(fasesDoProcesso('Nao publicado')[6].slice(4)).toEqual(['Não publicado', ''])
  })

  it('o arquivado aparece com a fase VII concluída, como o concluído publicado', () => {
    expect(fasesDoProcesso('Arquivado')[6].slice(4)).toEqual(['Concluída', '2026-07-03'])
  })

  it('"Dispensada" não aparece em nenhuma célula das fases', () => {
    expect(JSON.stringify(fases.linhas)).not.toContain('Dispensada')
  })

  it('traz a área e o nome do processo, sem identificar pessoa', () => {
    expect(fasesDoProcesso('Suspenso')[0].slice(1, 3)).toEqual(['SE3', 'Suspenso'])
  })
})

describe('montarPlanilhaInterna: sem pessoa', () => {
  it('nenhuma célula das duas abas traz o nome do responsável', () => {
    expect(JSON.stringify(abas)).not.toContain('Fulana Secreta')
  })

  it('uma fase sem etapa ativa no catálogo sai "Sem etapa"', () => {
    const pacote = pacoteDoCenario()
    pacote.etapas = pacote.etapas.filter((etapa) => etapa.fase !== 'V')
    const abaDeFases = montarPlanilhaInterna(pacote)[1]
    const linhaV = abaDeFases.linhas.find((linha) => linha[0] === uuid(1) && linha[3] === 'V')
    expect(linhaV?.[4]).toBe('Sem etapa')
  })
})
