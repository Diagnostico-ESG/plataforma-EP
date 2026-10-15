// Respostas da função: recusa e erro saem só com código e mensagem genérica, sem dado pessoal.
import { statusDaRecusa, type Recusa } from '../_shared/decisao.ts'

export function responderJson(status: number, corpo: unknown): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}

export function responderRecusa(recusa: Recusa): Response {
  return responderJson(statusDaRecusa(recusa), recusa)
}

export function responderErroInterno(): Response {
  return responderJson(500, { codigo: 'erro_interno', mensagem: 'Não foi possível concluir o pedido.' })
}

export function comCabecalhos(resposta: Response, extras: Record<string, string>): Response {
  const headers = new Headers(resposta.headers)
  for (const [nome, valor] of Object.entries(extras)) headers.set(nome, valor)
  return new Response(resposta.body, { status: resposta.status, headers })
}
