import { describe, expect, it } from 'vitest'
import { abasExistentes, montarLote, type AbaExistente } from './planilhasLote.ts'
import type { AbaDeValores } from './planilhasPacote.ts'

const PROCESSOS: AbaDeValores = { titulo: 'Processos', linhas: [['Nome', 'Total'], ['Um', 3], ['', 5]] }
const FASES: AbaDeValores = { titulo: 'Fases', linhas: [['Fase']] }

type Pedido = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

function pedidos(abas: AbaDeValores[], existentes: AbaExistente[]): Pedido[] {
  return montarLote(abas, existentes).requests as Pedido[]
}

function tipos(lista: Pedido[]): string[] {
  return lista.map((pedido) => Object.keys(pedido)[0])
}

describe('montarLote', () => {
  it('aba que falta é criada com um identificador maior que todos os existentes', () => {
    const lista = pedidos([PROCESSOS], [{ sheetId: 0, titulo: 'Planilha1' }, { sheetId: 41, titulo: 'Outra' }])
    expect(lista[0]).toEqual({ addSheet: { properties: { sheetId: 42, title: 'Processos' } } })
  })

  it('duas abas novas ganham identificadores diferentes', () => {
    const lista = pedidos([PROCESSOS, FASES], [{ sheetId: 7, titulo: 'Planilha1' }])
    const criadas = lista.filter((pedido) => 'addSheet' in pedido).map((pedido) => pedido.addSheet.properties.sheetId)
    expect(criadas).toEqual([8, 9])
  })

  it('aba que existe é reaproveitada, sem criar outra, mesmo com a caixa diferente', () => {
    const lista = pedidos([PROCESSOS], [{ sheetId: 5, titulo: 'processos' }])
    expect(tipos(lista)).not.toContain('addSheet')
    expect(lista.every((pedido) => JSON.stringify(pedido).includes('"sheetId":5'))).toBe(true)
  })

  it('para cada aba: ajusta a grade, limpa o conteúdo e grava, nessa ordem', () => {
    const lista = pedidos([PROCESSOS], [{ sheetId: 5, titulo: 'Processos' }])
    expect(tipos(lista)).toEqual(['updateSheetProperties', 'updateCells', 'updateCells'])
    expect(lista[1].updateCells.rows).toBeUndefined()
    expect(lista[2].updateCells.rows).toBeDefined()
  })

  it('a grade fica do tamanho dos dados, o que apaga as linhas que sobravam', () => {
    const lista = pedidos([PROCESSOS], [{ sheetId: 5, titulo: 'Processos' }])
    expect(lista[0].updateSheetProperties).toEqual({
      properties: { sheetId: 5, gridProperties: { rowCount: 3, columnCount: 2 } },
      fields: 'gridProperties.rowCount,gridProperties.columnCount',
    })
  })

  it('a aba só com o cabeçalho continua com uma linha', () => {
    const lista = pedidos([FASES], [{ sheetId: 5, titulo: 'Fases' }])
    expect(lista[0].updateSheetProperties.properties.gridProperties).toEqual({ rowCount: 1, columnCount: 1 })
  })

  it('a limpeza mira a aba inteira e só o valor digitado', () => {
    const lista = pedidos([PROCESSOS], [{ sheetId: 5, titulo: 'Processos' }])
    expect(lista[1].updateCells).toEqual({ range: { sheetId: 5 }, fields: 'userEnteredValue' })
  })

  it('texto vai como texto, número como número e vazio como célula em branco, a partir da célula A1', () => {
    const lista = pedidos([PROCESSOS], [{ sheetId: 5, titulo: 'Processos' }])
    const gravacao = lista[2].updateCells
    expect(gravacao.start).toEqual({ sheetId: 5, rowIndex: 0, columnIndex: 0 })
    expect(gravacao.fields).toBe('userEnteredValue')
    expect(gravacao.rows[1].values).toEqual([{ userEnteredValue: { stringValue: 'Um' } }, { userEnteredValue: { numberValue: 3 } }])
    expect(gravacao.rows[2].values[0]).toEqual({})
  })

  it('texto que parece fórmula é gravado como texto, não como fórmula', () => {
    const abas: AbaDeValores[] = [{ titulo: 'Processos', linhas: [['=HYPERLINK("http://exemplo.test")']] }]
    const gravacao = pedidos(abas, [{ sheetId: 5, titulo: 'Processos' }])[2].updateCells
    expect(gravacao.rows[0].values[0]).toEqual({ userEnteredValue: { stringValue: '=HYPERLINK("http://exemplo.test")' } })
  })
})

describe('abasExistentes', () => {
  it('lê o identificador e o título de cada aba', () => {
    const resposta = { sheets: [{ properties: { sheetId: 0, title: 'Planilha1', index: 0 } }, { properties: { sheetId: 9, title: 'Fases' } }] }
    expect(abasExistentes(resposta)).toEqual([{ sheetId: 0, titulo: 'Planilha1' }, { sheetId: 9, titulo: 'Fases' }])
  })

  it.each([['nulo', null], ['sem a lista', {}], ['aba sem título', { sheets: [{ properties: { sheetId: 1 } }] }], ['texto', 'x']])(
    'devolve nulo quando a resposta é %s',
    (_nome, resposta) => {
      expect(abasExistentes(resposta)).toBeNull()
    },
  )
})
