// Decisão da ação conferir da função arquivos-no-drive (documentos-versoes, ticket 07). Arquivo puro, testado no Vitest.
// Quem pode está em decisao.ts; aqui: qual entrada vale e como o que o Drive informa vira a situação do arquivo.
import { FORMATO_UUID, eCorpo, falhar, lerTexto, tipoDe, type Validacao } from './decisao.ts'

export type SituacaoNoDrive = 'ok' | 'alterado' | 'nao_encontrado'

/** O que o Drive informa do arquivo (`fields=id,md5Checksum,trashed`). */
export interface LidoNoDrive {
  md5Checksum?: string
  trashed?: boolean
}

export interface EntradaConferir {
  processoId: string
}

export function validarConferir(corpo: unknown): Validacao<EntradaConferir> {
  if (!eCorpo(corpo)) return falhar('entrada_invalida', `corpo: esperado objeto, recebido ${tipoDe(corpo)}`)
  const processoId = lerTexto(corpo, 'processo_id', FORMATO_UUID, 'uuid')
  if (!processoId.ok) return processoId
  return { ok: true, valor: { processoId: processoId.valor } }
}

// Arquivo que o Drive não acha ou que está na lixeira não está mais na pasta para quem a abre. O MD5 ausente
// (o arquivo virou outra coisa, como um documento do Google) não confirma nada: conta como alterado.
export function situacaoDoArquivo(hashMd5: string, lido: LidoNoDrive | null): SituacaoNoDrive {
  if (!lido || lido.trashed === true) return 'nao_encontrado'
  return lido.md5Checksum === hashMd5 ? 'ok' : 'alterado'
}
