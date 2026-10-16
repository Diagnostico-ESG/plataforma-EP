// Decisão da ação sem_alteracao da função arquivos-no-drive (documentos-versoes, ticket 05). Arquivo puro, testado no
// Vitest: qual entrada vale. Quem pode (administrador e integrante) está em decisao.ts; o que o banco recusa
// (versão anterior sem relatório, histórica, relatório que já existe) chega como recusa do banco (registro.ts).
import { FORMATO_UUID, eCorpo, falhar, lerTexto, tipoDe, type Validacao } from './decisao.ts'

export interface EntradaSemAlteracao {
  processoId: string
  versaoId: string
}

export function validarSemAlteracao(corpo: unknown): Validacao<EntradaSemAlteracao> {
  if (!eCorpo(corpo)) return falhar('entrada_invalida', `corpo: esperado objeto, recebido ${tipoDe(corpo)}`)
  const processoId = lerTexto(corpo, 'processo_id', FORMATO_UUID, 'uuid')
  if (!processoId.ok) return processoId
  const versaoId = lerTexto(corpo, 'versao_id', FORMATO_UUID, 'uuid')
  if (!versaoId.ok) return versaoId
  return { ok: true, valor: { processoId: processoId.valor, versaoId: versaoId.valor } }
}
