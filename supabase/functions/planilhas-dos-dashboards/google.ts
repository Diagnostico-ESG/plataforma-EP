// Token da conta de serviço do Drive, com o escopo do Sheets (a mesma conta de arquivos-no-drive; ADR 0008). O JWT é
// assinado em _shared/tokenGoogle.ts. Falha vira ErroDoGoogle('token', status), sem corpo de resposta.
import { ErroDoGoogle } from '../_shared/planilhasMotivo.ts'
import { FalhaDoToken, pedirTokenDoGoogle, type TokenDoGoogle } from '../_shared/tokenGoogle.ts'
import type { Configuracao } from './configuracao.ts'

const ESCOPO_DO_SHEETS = 'https://www.googleapis.com/auth/spreadsheets'

let tokenGuardado: TokenDoGoogle | null = null

// Guardado em memória enquanto a instância da função vive, até 5 minutos antes de vencer.
export async function obterToken(config: Configuracao): Promise<string> {
  const agora = Math.floor(Date.now() / 1000)
  if (tokenGuardado && tokenGuardado.venceEm - 300 > agora) return tokenGuardado.token
  try {
    tokenGuardado = await pedirTokenDoGoogle(config.contaEmail, config.contaChave, ESCOPO_DO_SHEETS, agora)
  } catch (erro) {
    if (erro instanceof FalhaDoToken) throw new ErroDoGoogle('token', erro.status)
    throw erro
  }
  return tokenGuardado.token
}
