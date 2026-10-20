// Chamadas ao Google Sheets: ler as abas que a planilha tem e aplicar o lote que a reescreve. O corpo de erro do
// Google nunca é lido: vai só o status, em ErroDoGoogle. O identificador da planilha só aparece no endereço da
// chamada, nunca em mensagem nem em log.
import { abasExistentes, type AbaExistente, type LoteDoSheets } from '../_shared/planilhasLote.ts'
import { ErroDoGoogle } from '../_shared/planilhasMotivo.ts'
import type { PlanilhaAlvo } from '../_shared/planilhasPedido.ts'

const BASE_DO_SHEETS = 'https://sheets.googleapis.com/v4/spreadsheets'

async function chamar(onde: PlanilhaAlvo, token: string, endereco: URL, opcoes: RequestInit = {}): Promise<Response> {
  const headers = new Headers(opcoes.headers)
  headers.set('Authorization', `Bearer ${token}`)
  let resposta: Response
  try {
    resposta = await fetch(endereco, { ...opcoes, headers })
  } catch {
    throw new ErroDoGoogle(onde, null)
  }
  if (!resposta.ok) throw new ErroDoGoogle(onde, resposta.status)
  return resposta
}

export async function lerAbasDoSheets(token: string, id: string, onde: PlanilhaAlvo): Promise<AbaExistente[]> {
  const endereco = new URL(`${BASE_DO_SHEETS}/${encodeURIComponent(id)}`)
  endereco.searchParams.set('fields', 'sheets.properties(sheetId,title)')
  const resposta = await chamar(onde, token, endereco)
  const abas = abasExistentes(await resposta.json().catch(() => null))
  // Resposta fora do formato: tratada como o Google fora do ar (502), não como a planilha recusada.
  if (!abas) throw new ErroDoGoogle(onde, 502)
  return abas
}

export async function aplicarLoteNoSheets(token: string, id: string, lote: LoteDoSheets, onde: PlanilhaAlvo): Promise<void> {
  const endereco = new URL(`${BASE_DO_SHEETS}/${encodeURIComponent(id)}:batchUpdate`)
  await chamar(onde, token, endereco, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(lote),
  })
}
