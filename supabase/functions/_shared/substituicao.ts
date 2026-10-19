// Decisão da substituição de arquivo na função arquivos-no-drive (documentos-versoes, ticket 06). Arquivo puro, testado no
// Vitest: o arquivo a substituir (lido pela RLS, com o login de quem chamou) precisa ser do processo do pedido, de versão
// nova e do mesmo tipo do que entra; no registro, o arquivo que chegou ao Drive precisa ser o próprio arquivo a trocar.
// O que o banco também impõe (formato, andamento do processo, perfil) chega como recusa do banco (registro.ts).
import { extensaoDoNome, falhar, type Validacao } from './decisao.ts'
import type { PapelDoArquivo } from './nomePadrao.ts'

/** O arquivo a substituir como o banco o guarda, com o processo e a situação da versão dele. */
export interface AlvoDaSubstituicao {
  papel: PapelDoArquivo
  formato: string
  nome: string
  driveId: string
  processoId: string
  historica: boolean
  /** O número da versão do arquivo e se ela já foi aprovada (ADR 0011: versão aprovada não tem arquivo substituído). */
  numero: number
  aprovada: boolean
}

export interface PedidoDeEnvioDaSubstituicao {
  processoId: string
  papel: PapelDoArquivo
  nomeOriginal: string
}

export interface PedidoDeRegistroDaSubstituicao {
  processoId: string
  driveId: string
}

// Arquivo inexistente e arquivo de outro processo têm a mesma recusa, para não revelar o que quem chama não enxerga.
function conferirAlvo(alvo: AlvoDaSubstituicao | null, processoId: string): Validacao<AlvoDaSubstituicao> {
  if (!alvo || alvo.processoId !== processoId) return falhar('entrada_invalida', 'arquivo não encontrado neste processo')
  if (alvo.historica) return falhar('versao_historica_somente_leitura')
  if (alvo.aprovada) return falhar('versao_aprovada', String(alvo.numero))
  return { ok: true, valor: alvo }
}

/** Relatório depois: a versão do pedido precisa ser do processo do pedido (a pasta e a situação conferidas são as dele). */
export function conferirVersaoDoProcesso(processoDaVersao: string | null, processoId: string): Validacao<string> {
  if (processoDaVersao !== processoId) return falhar('entrada_invalida', 'versão não encontrada neste processo')
  return { ok: true, valor: processoId }
}

/** Antes de abrir a sessão de atualização no Drive: o alvo, se pode, ou a recusa. */
export function conferirAlvoDoEnvio(alvo: AlvoDaSubstituicao | null, pedido: PedidoDeEnvioDaSubstituicao): Validacao<AlvoDaSubstituicao> {
  const conferido = conferirAlvo(alvo, pedido.processoId)
  if (!conferido.ok) return conferido
  if (pedido.papel !== conferido.valor.papel) {
    return falhar('tipo_de_arquivo_diferente', `papel recebido ${pedido.papel}; esperado ${conferido.valor.papel}`)
  }
  const extensao = extensaoDoNome(pedido.nomeOriginal)
  if (extensao !== conferido.valor.formato) {
    return falhar('tipo_de_arquivo_diferente', `recebido .${extensao}; esperado .${conferido.valor.formato}`)
  }
  return conferido
}

/** Antes de gravar: o arquivo que o Drive trouxe é o do alvo (senão o hash de outro arquivo da pasta entraria nele). */
export function conferirAlvoDoRegistro(
  alvo: AlvoDaSubstituicao | null, pedido: PedidoDeRegistroDaSubstituicao,
): Validacao<AlvoDaSubstituicao> {
  const conferido = conferirAlvo(alvo, pedido.processoId)
  if (!conferido.ok) return conferido
  if (pedido.driveId !== conferido.valor.driveId) return falhar('entrada_invalida', 'drive_id: não é o do arquivo a substituir')
  return conferido
}
