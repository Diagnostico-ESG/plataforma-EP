// Decisão da função arquivos-no-drive (quem pode, qual entrada vale). Arquivo puro, sem Deno nem npm:,
// testado no Vitest (regra "Edge Functions" de .claude/regras/banco.md). A entrada é dado de fora.
import type { PapelDoArquivo } from './nomePadrao.ts'

export type Perfil = 'administrador' | 'integrante_ep' | 'consulta'
export type Acao = 'iniciar_envio' | 'baixar' | 'registrar'
export interface Chamador {
  perfil: Perfil
  ativo: boolean
}
export type CodigoDeRecusa =
  | 'sem_login'
  | 'usuario_inativo'
  | 'sem_permissao'
  | 'entrada_invalida'
  | 'processo_fora_de_andamento'
  | 'extensao_nao_aceita'
  | 'arquivo_grande'
  | 'arquivo_nao_chegou'
  | 'arquivo_fora_da_pasta'
export interface Recusa {
  codigo: CodigoDeRecusa
  mensagem: string
}
export interface EntradaIniciarEnvio {
  processoId: string
  papel: PapelDoArquivo
  nomeOriginal: string
  tamanho: number
  numero: number
  historica: boolean
}
export interface EntradaBaixar {
  arquivoId: string
}
export type Falha = { ok: false; recusa: Recusa }
export type Validacao<T> = { ok: true; valor: T } | Falha
export type Corpo = Record<string, unknown>

export const LIMITE_DE_TAMANHO = 20 * 1024 * 1024

const PERFIS_POR_ACAO: Record<Acao, readonly Perfil[]> = {
  iniciar_envio: ['administrador', 'integrante_ep'],
  baixar: ['administrador', 'integrante_ep', 'consulta'],
  registrar: ['administrador', 'integrante_ep'],
}

export const EXTENSOES_POR_PAPEL: Record<PapelDoArquivo, readonly string[]> = {
  bpmn: ['bpmn'],
  png: ['png'],
  bpm: ['bpm'],
  relatorio: ['docx', 'pdf'],
}

const MENSAGENS: Record<CodigoDeRecusa, string> = {
  sem_login: 'É preciso entrar na plataforma.',
  usuario_inativo: 'Usuário desativado.',
  sem_permissao: 'Seu perfil não permite esta ação.',
  entrada_invalida: 'Pedido em formato inválido.',
  processo_fora_de_andamento: 'O processo não está em andamento.',
  extensao_nao_aceita: 'Tipo de arquivo não aceito para este papel.',
  arquivo_grande: 'O arquivo passa de 20 MB.',
  arquivo_nao_chegou: 'Um dos arquivos não chegou ao Drive. Envie de novo.',
  arquivo_fora_da_pasta: 'O arquivo não está na pasta do processo no Drive.',
}

export const FORMATO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const FORMATO_ID_DO_DRIVE = /^[A-Za-z0-9_-]{1,200}$/

const STATUS_POR_CODIGO: Partial<Record<CodigoDeRecusa, number>> = {
  sem_login: 401,
  usuario_inativo: 403,
  sem_permissao: 403,
}

export function recusar(codigo: CodigoDeRecusa, detalhe?: string): Recusa {
  return { codigo, mensagem: detalhe ? `${MENSAGENS[codigo]} (${detalhe})` : MENSAGENS[codigo] }
}

export function statusDaRecusa(recusa: Recusa): number {
  return STATUS_POR_CODIGO[recusa.codigo] ?? 400
}

export function lerAcao(corpo: unknown): Acao | null {
  const acao = eCorpo(corpo) ? corpo.acao : null
  return acao === 'iniciar_envio' || acao === 'baixar' || acao === 'registrar' ? acao : null
}

export function falhar(codigo: CodigoDeRecusa, detalhe?: string): Falha {
  return { ok: false, recusa: recusar(codigo, detalhe) }
}

export function conferirChamador(chamador: Chamador | null, acao: Acao): Recusa | null {
  if (!chamador) return recusar('sem_login')
  if (!chamador.ativo) return recusar('usuario_inativo')
  if (!PERFIS_POR_ACAO[acao].includes(chamador.perfil)) return recusar('sem_permissao')
  return null
}

export function conferirProcessoEmAndamento(situacao: string): Recusa | null {
  return situacao === 'em_andamento' ? null : recusar('processo_fora_de_andamento')
}

export function extensaoDoNome(nome: string): string {
  const ponto = nome.lastIndexOf('.')
  if (ponto < 0) return ''
  return nome.slice(ponto + 1).toLowerCase()
}

// Só o tipo recebido entra na mensagem: o valor pode trazer dado de fora (e pessoal).
export function tipoDe(valor: unknown): string {
  if (valor === null) return 'null'
  if (Array.isArray(valor)) return 'array'
  return typeof valor
}

export function eCorpo(valor: unknown): valor is Corpo {
  return tipoDe(valor) === 'object'
}

export function campoInvalido(corpo: Corpo, campo: string, esperado: string): Falha {
  return falhar('entrada_invalida', `campo ${campo}: esperado ${esperado}, recebido ${tipoDe(corpo[campo])}`)
}

export function lerTexto(corpo: Corpo, campo: string, formato: RegExp, esperado: string): Validacao<string> {
  const valor = corpo[campo]
  if (typeof valor !== 'string' || !formato.test(valor)) return campoInvalido(corpo, campo, esperado)
  return { ok: true, valor }
}

export function lerInteiroPositivo(corpo: Corpo, campo: string): Validacao<number> {
  const valor = corpo[campo]
  if (typeof valor !== 'number' || !Number.isInteger(valor) || valor <= 0) {
    return campoInvalido(corpo, campo, 'número inteiro maior que zero')
  }
  return { ok: true, valor }
}

export function lerBooleano(corpo: Corpo, campo: string): Validacao<boolean> {
  const valor = corpo[campo]
  if (typeof valor !== 'boolean') return campoInvalido(corpo, campo, 'booleano')
  return { ok: true, valor }
}

export function lerPapel(corpo: Corpo): Validacao<PapelDoArquivo> {
  const valor = corpo.papel
  if (typeof valor !== 'string' || !(valor in EXTENSOES_POR_PAPEL)) {
    return campoInvalido(corpo, 'papel', 'bpmn, png, bpm ou relatorio')
  }
  return { ok: true, valor: valor as PapelDoArquivo }
}

function lerCamposDoEnvio(corpo: Corpo): Validacao<EntradaIniciarEnvio> {
  const processoId = lerTexto(corpo, 'processo_id', FORMATO_UUID, 'uuid')
  if (!processoId.ok) return processoId
  const papel = lerPapel(corpo)
  if (!papel.ok) return papel
  const nomeOriginal = lerTexto(corpo, 'nome_original', /\S/, 'texto não vazio')
  if (!nomeOriginal.ok) return nomeOriginal
  const tamanho = lerInteiroPositivo(corpo, 'tamanho')
  if (!tamanho.ok) return tamanho
  const numero = lerInteiroPositivo(corpo, 'numero')
  if (!numero.ok) return numero
  const historica = lerBooleano(corpo, 'historica')
  if (!historica.ok) return historica
  const valor = { processoId: processoId.valor, papel: papel.valor, nomeOriginal: nomeOriginal.valor }
  return { ok: true, valor: { ...valor, tamanho: tamanho.valor, numero: numero.valor, historica: historica.valor } }
}

function conferirArquivo(entrada: EntradaIniciarEnvio): Validacao<EntradaIniciarEnvio> {
  const extensao = extensaoDoNome(entrada.nomeOriginal)
  const aceitas = EXTENSOES_POR_PAPEL[entrada.papel]
  if (!aceitas.includes(extensao)) {
    return falhar('extensao_nao_aceita', `recebido .${extensao}; esperado .${aceitas.join(' ou .')}`)
  }
  if (entrada.tamanho > LIMITE_DE_TAMANHO) {
    return falhar('arquivo_grande', `recebido ${entrada.tamanho} bytes; esperado até ${LIMITE_DE_TAMANHO}`)
  }
  return { ok: true, valor: entrada }
}

export function validarIniciarEnvio(entrada: unknown): Validacao<EntradaIniciarEnvio> {
  if (!eCorpo(entrada)) return falhar('entrada_invalida', `corpo: esperado objeto, recebido ${tipoDe(entrada)}`)
  const campos = lerCamposDoEnvio(entrada)
  if (!campos.ok) return campos
  return conferirArquivo(campos.valor)
}

export function validarBaixar(entrada: unknown): Validacao<EntradaBaixar> {
  if (!eCorpo(entrada)) return falhar('entrada_invalida', `corpo: esperado objeto, recebido ${tipoDe(entrada)}`)
  const arquivoId = lerTexto(entrada, 'arquivo_id', FORMATO_UUID, 'uuid')
  if (!arquivoId.ok) return arquivoId
  return { ok: true, valor: { arquivoId: arquivoId.valor } }
}
