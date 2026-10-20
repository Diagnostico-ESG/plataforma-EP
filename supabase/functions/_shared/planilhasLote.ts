// O lote do Sheets que reescreve uma planilha inteira (exportacao-e-manutencao, ticket 03; spec, "Escrita"). Uma única
// chamada `spreadsheets.batchUpdate` por planilha: o Google aplica o lote inteiro ou nada, então a planilha que falha
// fica como estava. Para cada aba, na ordem: cria se faltar, ajusta a grade ao tamanho dos dados (isso apaga as linhas
// que sobravam), limpa o conteúdo e grava as linhas. Texto vai como `stringValue`, que o Sheets não interpreta como
// fórmula. Arquivo puro, testado no Vitest; a chamada em si está em planilhas-dos-dashboards/sheets.ts.
import { eCorpo } from './decisao.ts'
import type { AbaDeValores } from './planilhasPacote.ts'

export interface AbaExistente {
  sheetId: number
  titulo: string
}

type Pedido = Record<string, unknown>
type Valor = string | number

export interface LoteDoSheets {
  requests: Pedido[]
}

// Vazio vira célula em branco: o dashboard não vê um texto vazio no lugar de "sem valor".
function celula(valor: Valor): Pedido {
  if (typeof valor === 'number') return { userEnteredValue: { numberValue: valor } }
  return valor === '' ? {} : { userEnteredValue: { stringValue: valor } }
}

function pedidosDaAba(aba: AbaDeValores, sheetId: number): Pedido[] {
  const colunas = aba.linhas.reduce((maior, linha) => Math.max(maior, linha.length), 1)
  const grade = { rowCount: Math.max(1, aba.linhas.length), columnCount: colunas }
  return [
    {
      updateSheetProperties: {
        properties: { sheetId, gridProperties: grade },
        fields: 'gridProperties.rowCount,gridProperties.columnCount',
      },
    },
    { updateCells: { range: { sheetId }, fields: 'userEnteredValue' } },
    {
      updateCells: {
        start: { sheetId, rowIndex: 0, columnIndex: 0 },
        rows: aba.linhas.map((linha) => ({ values: linha.map(celula) })),
        fields: 'userEnteredValue',
      },
    },
  ]
}

function acharAba(titulo: string, existentes: AbaExistente[]): AbaExistente | undefined {
  return existentes.find((aba) => aba.titulo.toLowerCase() === titulo.toLowerCase())
}

export function montarLote(abas: AbaDeValores[], existentes: AbaExistente[]): LoteDoSheets {
  let proximoId = existentes.reduce((maior, aba) => Math.max(maior, aba.sheetId), -1) + 1
  const requests: Pedido[] = []
  for (const aba of abas) {
    let sheetId = acharAba(aba.titulo, existentes)?.sheetId
    if (sheetId === undefined) {
      sheetId = proximoId++
      requests.push({ addSheet: { properties: { sheetId, title: aba.titulo } } })
    }
    requests.push(...pedidosDaAba(aba, sheetId))
  }
  return { requests }
}

function lerAba(item: unknown): AbaExistente | null {
  if (!eCorpo(item) || !eCorpo(item.properties)) return null
  const { sheetId, title } = item.properties
  if (typeof sheetId !== 'number' || !Number.isInteger(sheetId) || typeof title !== 'string') return null
  return { sheetId, titulo: title }
}

/** Lê `sheets.properties` da resposta do Google; devolve nulo se o formato não for o esperado. */
export function abasExistentes(resposta: unknown): AbaExistente[] | null {
  if (!eCorpo(resposta) || !Array.isArray(resposta.sheets)) return null
  const abas = resposta.sheets.map(lerAba)
  return abas.every((aba) => aba !== null) ? abas : null
}
