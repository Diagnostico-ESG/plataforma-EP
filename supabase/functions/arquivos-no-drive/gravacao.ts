// A resposta da função a uma gravação no banco (registrar, relatório depois e sem alteração): o resultado da gravação,
// a recusa de uma regra do banco (P0001 "motivo:valor", 409; 42501, 403) ou, se o erro não for recusa, erro interno.
import { recusaDoBanco, statusDaRecusaDoBanco } from '../_shared/registro.ts'
import { responderJson } from './respostas.ts'

export interface ResultadoDoBanco {
  data: unknown
  error: { message: string; code?: string } | null
}

export function responderResultadoDoBanco(funcao: string, resultado: ResultadoDoBanco, campo: string): Response {
  const { data, error } = resultado
  if (!error) return responderJson(200, { [campo]: data })
  const recusa = recusaDoBanco(error)
  if (!recusa) throw new Error(`${funcao} falhou (código ${error.code}); esperado: gravação ou recusa do banco`)
  return responderJson(statusDaRecusaDoBanco(recusa), recusa)
}
