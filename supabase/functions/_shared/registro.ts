// Decisão da ação registrar da função arquivos-no-drive (documentos-versoes, ticket 02). Arquivo puro, testado no
// Vitest: qual entrada vale, o que o Drive informou de cada arquivo (chegou, tamanho, formato, pasta) e como a recusa
// do banco volta para a tela. Nada é gravado se algum arquivo não passar: a função não apaga o que subiu.
import {
  EXTENSOES_POR_PAPEL,
  FORMATO_ID_DO_DRIVE,
  FORMATO_UUID,
  LIMITE_DE_TAMANHO,
  campoInvalido,
  eCorpo,
  extensaoDoNome,
  falhar,
  lerBooleano,
  lerInteiroPositivo,
  lerPapel,
  lerTexto,
  recusar,
  tipoDe,
  type Corpo,
  type Validacao,
} from './decisao.ts'
import type { PapelDoArquivo } from './nomePadrao.ts'

export interface ArquivoPedido {
  papel: PapelDoArquivo
  driveId: string
}
export interface EntradaRegistrar {
  processoId: string
  numero: number
  observacao: string | null
  /** Versão da primeira etapa do trabalho (V5F): o número é o digitado, não o que o banco daria. */
  historica: boolean
  arquivos: ArquivoPedido[]
}
/** O que o Drive devolve de um arquivo (`fields=id,name,size,md5Checksum,parents`). */
export interface ArquivoNoDrive {
  id: string
  name: string
  size?: string
  md5Checksum?: string
  parents?: string[]
}
/** Um item de `p_arquivos` da função do banco registrar_versao. */
export interface ArquivoParaGravar {
  papel: PapelDoArquivo
  nome: string
  formato: string
  tamanho: number
  hash_md5: string
  drive_id: string
}
/** Recusa do banco: o código é o motivo de "motivo:valor"; a mensagem, o valor. */
export interface RecusaDoBanco {
  codigo: string
  mensagem: string
}

const LIMITE_DA_OBSERVACAO = 2000
const MAXIMO_DE_ARQUIVOS = 4

function lerObservacao(corpo: Corpo): Validacao<string | null> {
  const valor = corpo.observacao
  if (valor === undefined || valor === null) return { ok: true, valor: null }
  if (typeof valor !== 'string' || valor.length > LIMITE_DA_OBSERVACAO) {
    return campoInvalido(corpo, 'observacao', `texto de até ${LIMITE_DA_OBSERVACAO} caracteres`)
  }
  return { ok: true, valor }
}

// Quem não manda `historica` registra uma versão nova (o pedido do ticket 02).
function lerHistorica(corpo: Corpo): Validacao<boolean> {
  return corpo.historica === undefined ? { ok: true, valor: false } : lerBooleano(corpo, 'historica')
}

function lerArquivoPedido(item: unknown): Validacao<ArquivoPedido> {
  if (!eCorpo(item)) return falhar('entrada_invalida', `item de arquivos: esperado objeto, recebido ${tipoDe(item)}`)
  const papel = lerPapel(item)
  if (!papel.ok) return papel
  const driveId = lerTexto(item, 'drive_id', FORMATO_ID_DO_DRIVE, 'identificador do Drive')
  if (!driveId.ok) return driveId
  return { ok: true, valor: { papel: papel.valor, driveId: driveId.valor } }
}

function lerArquivosPedidos(corpo: Corpo): Validacao<ArquivoPedido[]> {
  const lista = corpo.arquivos
  if (!Array.isArray(lista) || lista.length === 0 || lista.length > MAXIMO_DE_ARQUIVOS) {
    return campoInvalido(corpo, 'arquivos', `lista de 1 a ${MAXIMO_DE_ARQUIVOS} arquivos`)
  }
  const arquivos: ArquivoPedido[] = []
  for (const item of lista) {
    const arquivo = lerArquivoPedido(item)
    if (!arquivo.ok) return arquivo
    arquivos.push(arquivo.valor)
  }
  const papeis = new Set(arquivos.map((arquivo) => arquivo.papel))
  if (papeis.size < arquivos.length) return falhar('entrada_invalida', 'campo arquivos: esperado um arquivo por papel')
  return { ok: true, valor: arquivos }
}

export function validarRegistrar(corpo: unknown): Validacao<EntradaRegistrar> {
  if (!eCorpo(corpo)) return falhar('entrada_invalida', `corpo: esperado objeto, recebido ${tipoDe(corpo)}`)
  const processoId = lerTexto(corpo, 'processo_id', FORMATO_UUID, 'uuid')
  if (!processoId.ok) return processoId
  const numero = lerInteiroPositivo(corpo, 'numero')
  if (!numero.ok) return numero
  const observacao = lerObservacao(corpo)
  if (!observacao.ok) return observacao
  const historica = lerHistorica(corpo)
  if (!historica.ok) return historica
  const arquivos = lerArquivosPedidos(corpo)
  if (!arquivos.ok) return arquivos
  const valor = { processoId: processoId.valor, numero: numero.valor, observacao: observacao.valor }
  return { ok: true, valor: { ...valor, historica: historica.valor, arquivos: arquivos.valor } }
}

/** A função do banco que grava a versão: a histórica tem as regras próprias dela (migração versoes_historicas). */
export function funcaoDoBancoPara({ historica }: Pick<EntradaRegistrar, 'historica'>): 'registrar_versao' | 'registrar_versao_historica' {
  return historica ? 'registrar_versao_historica' : 'registrar_versao'
}

// O formato vem do nome que a função deu ao arquivo no Drive; o tamanho e o MD5, do próprio Drive.
function conferirUmArquivo(pedido: ArquivoPedido, lido: ArquivoNoDrive | null, pastaId: string): Validacao<ArquivoParaGravar> {
  if (!lido || lido.id !== pedido.driveId || !lido.md5Checksum) return falhar('arquivo_nao_chegou')
  if (!(lido.parents ?? []).includes(pastaId)) return falhar('arquivo_fora_da_pasta')
  const formato = extensaoDoNome(lido.name)
  if (!EXTENSOES_POR_PAPEL[pedido.papel].includes(formato)) return falhar('extensao_nao_aceita', `recebido .${formato}`)
  const tamanho = Number(lido.size)
  if (!(tamanho <= LIMITE_DE_TAMANHO)) return falhar('arquivo_grande', `recebido ${lido.size} bytes; esperado até ${LIMITE_DE_TAMANHO}`)
  const valor = { papel: pedido.papel, nome: lido.name, formato, tamanho }
  return { ok: true, valor: { ...valor, hash_md5: lido.md5Checksum, drive_id: lido.id } }
}

/** `lidos[i]` é o que o Drive informou de `pedidos[i]` (null: o Drive não achou o arquivo). */
export function conferirArquivosNoDrive(
  pedidos: ArquivoPedido[],
  lidos: (ArquivoNoDrive | null)[],
  pastaId: string,
): Validacao<ArquivoParaGravar[]> {
  const arquivos: ArquivoParaGravar[] = []
  for (const [indice, pedido] of pedidos.entries()) {
    const arquivo = conferirUmArquivo(pedido, lidos[indice] ?? null, pastaId)
    if (!arquivo.ok) return arquivo
    arquivos.push(arquivo.valor)
  }
  return { ok: true, valor: arquivos }
}

// As regras do banco recusam com P0001 "motivo:valor" (migração versoes); 42501 é a RLS ou o privilégio.
const PADRAO_DA_RECUSA = /^([a-z_]+)(?::(.*))?$/

/** A recusa do banco como a tela a lê; null quando o erro não é uma recusa (vira erro interno). */
export function recusaDoBanco(erro: { message: string; code?: string }): RecusaDoBanco | null {
  if (erro.code === '42501') return recusar('sem_permissao')
  const achado = erro.code === 'P0001' ? erro.message.match(PADRAO_DA_RECUSA) : null
  if (!achado) return null
  return { codigo: achado[1], mensagem: achado[2] ?? '' }
}

/** A falta de permissão é 403, como nas outras ações; as regras do banco, 409 (conflito com o estado). */
export function statusDaRecusaDoBanco(recusa: RecusaDoBanco): number {
  return recusa.codigo === 'sem_permissao' ? 403 : 409
}
