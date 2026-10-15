// Conferência dos arquivos no navegador, antes do envio (spec, "Conferência dos arquivos"). A função do servidor
// repete extensão e tamanho e confere o tamanho real no Drive: o navegador não é confiável.
import { EXTENSOES_POR_PAPEL, LIMITE_DE_TAMANHO, extensaoDoNome } from '../../supabase/functions/_shared/decisao.ts'
import type { PapelDoArquivo } from './tipos'

const ASSINATURA_PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const NAMESPACE_DO_BPMN = 'http://www.omg.org/spec/BPMN/20100524/MODEL'

const RECUSA_DO_PNG = 'O arquivo não é uma imagem PNG.'
const RECUSA_DO_BPMN = 'O arquivo não é um BPMN 2.0 (falta o elemento definitions do BPMN).'

function megabytes(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1).replace('.', ',')
}

function recusaDaExtensao(papel: PapelDoArquivo, nome: string): string | null {
  const extensao = extensaoDoNome(nome)
  const aceitas = EXTENSOES_POR_PAPEL[papel]
  if (aceitas.includes(extensao)) return null
  const recebida = extensao ? `.${extensao}` : 'sem extensão'
  return `Escolha um arquivo .${aceitas.join(' ou .')}. Recebido: ${recebida}.`
}

function recusaDoTamanho(tamanho: number): string | null {
  if (tamanho <= LIMITE_DE_TAMANHO) return null
  return `O arquivo passa de 20 MB. Recebido: ${megabytes(tamanho)} MB (${tamanho} bytes).`
}

async function eImagemPng(arquivo: File): Promise<boolean> {
  const inicio = new Uint8Array(await arquivo.slice(0, ASSINATURA_PNG.length).arrayBuffer())
  return ASSINATURA_PNG.every((byte, posicao) => inicio[posicao] === byte)
}

// A checagem completa do conteúdo do .bpmn é da v1.5; aqui basta ser XML com o definitions do BPMN 2.0.
async function eBpmn(arquivo: File): Promise<boolean> {
  const documento = new DOMParser().parseFromString(await arquivo.text(), 'application/xml')
  if (documento.getElementsByTagName('parsererror').length > 0) return false
  const raiz = documento.documentElement
  return raiz.localName === 'definitions' && raiz.namespaceURI === NAMESPACE_DO_BPMN
}

async function recusaDoConteudo(papel: PapelDoArquivo, arquivo: File): Promise<string | null> {
  if (papel === 'png') return (await eImagemPng(arquivo)) ? null : RECUSA_DO_PNG
  if (papel === 'bpmn') return (await eBpmn(arquivo)) ? null : RECUSA_DO_BPMN
  return null
}

/** null se o arquivo serve para o papel; senão, a frase que aparece ao lado do campo. */
export async function conferirArquivo(papel: PapelDoArquivo, arquivo: File): Promise<string | null> {
  return recusaDaExtensao(papel, arquivo.name) ?? recusaDoTamanho(arquivo.size) ?? (await recusaDoConteudo(papel, arquivo))
}
