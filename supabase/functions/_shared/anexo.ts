// Decisão do anexo na função arquivos-no-drive (documentos-versoes, ticket 12; ADR 0027). Arquivo puro, sem Deno nem npm:,
// testado no Vitest. O anexo é o arquivo avulso do processo: não tem número, versão nem nome padrão, e fica com o nome
// original. Quem pode e a situação do processo são as regras de sempre (decisao.ts); aqui, qual entrada vale para ele.
import {
  FORMATO_UUID,
  LIMITE_DE_TAMANHO,
  eCorpo,
  extensaoDoNome,
  falhar,
  lerInteiroPositivo,
  lerTexto,
  tipoDe,
  validarIniciarEnvio,
  type EntradaIniciarEnvio,
  type Falha,
  type Validacao,
} from './decisao.ts'
import { EXTENSOES_DO_ANEXO, limparParaNomeDeArquivo } from './nomePadrao.ts'

/** Também o limite da coluna `anexos.nome`. */
export const LIMITE_DO_NOME = 300
/** A subpasta do anexo, dentro da pasta do processo no Drive. */
export const NOME_DA_SUBPASTA_DOS_ANEXOS = 'Anexos'

export interface EntradaIniciarEnvioDoAnexo {
  processoId: string
  nomeOriginal: string
  tamanho: number
}

/** O nome do anexo no Drive: o original, só com a troca dos caracteres que o Drive não aceita. */
export function nomeDoAnexoNoDrive(nomeOriginal: string): string {
  return limparParaNomeDeArquivo(nomeOriginal)
}

// Só o tipo, o tamanho e a extensão entram nas mensagens: o nome do anexo pode trazer nome de pessoa.
function conferirArquivoDoAnexo({ nomeOriginal, tamanho }: Pick<EntradaIniciarEnvioDoAnexo, 'nomeOriginal' | 'tamanho'>): Falha | null {
  if (nomeOriginal.length > LIMITE_DO_NOME) {
    return falhar('entrada_invalida', `campo nome_original: esperado até ${LIMITE_DO_NOME} caracteres, recebido ${nomeOriginal.length}`)
  }
  const extensao = extensaoDoNome(nomeOriginal)
  if (!EXTENSOES_DO_ANEXO.includes(extensao)) {
    return falhar('extensao_nao_aceita', `recebido .${extensao || 'nenhuma'}; esperado .${EXTENSOES_DO_ANEXO.join(', .')}`)
  }
  if (tamanho > LIMITE_DE_TAMANHO) return falhar('arquivo_grande', `recebido ${tamanho} bytes; esperado até ${LIMITE_DE_TAMANHO}`)
  return null
}

/** O pedido de envio do anexo: sem número, histórica nem piloto (se vierem, são ignorados). */
export function validarIniciarEnvioDoAnexo(corpo: unknown): Validacao<EntradaIniciarEnvioDoAnexo> {
  if (!eCorpo(corpo)) return falhar('entrada_invalida', `corpo: esperado objeto, recebido ${tipoDe(corpo)}`)
  const processoId = lerTexto(corpo, 'processo_id', FORMATO_UUID, 'uuid')
  if (!processoId.ok) return processoId
  const nomeOriginal = lerTexto(corpo, 'nome_original', /\S/, 'texto não vazio')
  if (!nomeOriginal.ok) return nomeOriginal
  const tamanho = lerInteiroPositivo(corpo, 'tamanho')
  if (!tamanho.ok) return tamanho
  const entrada = { processoId: processoId.valor, nomeOriginal: nomeOriginal.valor, tamanho: tamanho.valor }
  return conferirArquivoDoAnexo(entrada) ?? { ok: true, valor: entrada }
}

export type EnvioValidado =
  | { tipo: 'anexo'; entrada: EntradaIniciarEnvioDoAnexo }
  | { tipo: 'arquivo'; entrada: EntradaIniciarEnvio }

/** Quem lê o pedido de envio: o papel `anexo` segue a regra do anexo; os demais, a de sempre (pede número, histórica etc.). */
export function validarEnvio(corpo: unknown): Validacao<EnvioValidado> {
  if (eCorpo(corpo) && corpo.papel === 'anexo') {
    const anexo = validarIniciarEnvioDoAnexo(corpo)
    return anexo.ok ? { ok: true, valor: { tipo: 'anexo', entrada: anexo.valor } } : anexo
  }
  const arquivo = validarIniciarEnvio(corpo)
  return arquivo.ok ? { ok: true, valor: { tipo: 'arquivo', entrada: arquivo.valor } } : arquivo
}
