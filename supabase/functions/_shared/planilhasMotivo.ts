// Do erro do Google ao código curto de motivo que o banco guarda e a tela traduz (src/planilhas/frasesDasPlanilhas.ts)
// (exportacao-e-manutencao, ticket 03). Arquivo puro, testado no Vitest. O corpo da resposta do Google, o nome do
// processo e o identificador da planilha nunca entram em erro nem em motivo.
import { FalhaDoToken } from './tokenGoogle.ts'

export type OndeFalhou = 'token' | 'interna' | 'publica'
export type CodigoDoMotivo =
  | 'planilha_interna_recusada'
  | 'planilha_publica_recusada'
  | 'google_indisponivel'
  | 'pacote_invalido'
  | 'erro_interno'

export class ErroDoGoogle extends Error {
  onde: OndeFalhou
  /** Status HTTP do Google; nulo quando nem a resposta chegou (rede fora). */
  status: number | null

  constructor(onde: OndeFalhou, status: number | null) {
    super(`o Google falhou em ${onde} (status ${status ?? 'sem resposta'})`)
    this.name = 'ErroDoGoogle'
    this.onde = onde
    this.status = status
  }
}

// Limite de chamadas e erro do servidor passam sozinhos; os outros 4xx são o Google recusando a planilha.
function ePassageiro(status: number | null): boolean {
  return status === null || status === 429 || status >= 500
}

function motivoDoGoogle(erro: ErroDoGoogle): CodigoDoMotivo {
  if (erro.onde === 'token' || ePassageiro(erro.status)) return 'google_indisponivel'
  return erro.onde === 'interna' ? 'planilha_interna_recusada' : 'planilha_publica_recusada'
}

export function motivoDaFalha(erro: unknown): CodigoDoMotivo {
  if (erro instanceof ErroDoGoogle) return motivoDoGoogle(erro)
  if (erro instanceof FalhaDoToken) return 'google_indisponivel'
  return 'erro_interno'
}
