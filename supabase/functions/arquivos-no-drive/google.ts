// Conversa com o Google: token da conta de serviço (JWT assinado aqui, sem biblioteca do Google) e chamadas
// ao Drive. O corpo de erro do Google nunca vai para a resposta nem para o log.
import { eErroDeCota } from '../_shared/drive.ts'
import type { Configuracao } from './configuracao.ts'

const URL_DO_TOKEN = 'https://oauth2.googleapis.com/token'
// Conta de serviço não passa pela tela de consentimento; o escopo total é o que permite criar e mover pastas.
const ESCOPO = 'https://www.googleapis.com/auth/drive'

export type CodigoDoDrive = 'sem_espaco_no_drive' | 'nao_encontrado_no_drive' | 'drive_indisponivel'

const MENSAGENS_DO_DRIVE: Record<CodigoDoDrive, string> = {
  sem_espaco_no_drive: 'Não há espaço no Drive.',
  nao_encontrado_no_drive: 'Arquivo não encontrado no Drive.',
  drive_indisponivel: 'Não foi possível falar com o Drive.',
}

export class ErroDoDrive extends Error {
  codigo: CodigoDoDrive
  status: number

  constructor(codigo: CodigoDoDrive, status: number) {
    super(MENSAGENS_DO_DRIVE[codigo])
    this.name = 'ErroDoDrive'
    this.codigo = codigo
    this.status = status
  }
}

let tokenGuardado: { token: string; venceEm: number } | null = null

function base64Url(dados: ArrayBuffer | string): string {
  const bytes = typeof dados === 'string' ? new TextEncoder().encode(dados) : new Uint8Array(dados)
  let binario = ''
  for (const byte of bytes) binario += String.fromCharCode(byte)
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function importarChave(pem: string): Promise<CryptoKey> {
  const corpo = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '')
  const der = Uint8Array.from(atob(corpo), (letra) => letra.charCodeAt(0))
  return await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'])
}

async function assinarJwt(config: Configuracao, agora: number): Promise<string> {
  const cabecalho = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const carga = base64Url(
    JSON.stringify({ iss: config.contaEmail, scope: ESCOPO, aud: URL_DO_TOKEN, iat: agora, exp: agora + 3600 }),
  )
  const chave = await importarChave(config.contaChave)
  const assinatura = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', chave, new TextEncoder().encode(`${cabecalho}.${carga}`))
  return `${cabecalho}.${carga}.${base64Url(assinatura)}`
}

// Guardado em memória enquanto a instância da função vive, até 5 minutos antes de vencer.
export async function obterToken(config: Configuracao): Promise<string> {
  const agora = Math.floor(Date.now() / 1000)
  if (tokenGuardado && tokenGuardado.venceEm - 300 > agora) return tokenGuardado.token
  const assertion = await assinarJwt(config, agora)
  const resposta = await fetch(URL_DO_TOKEN, {
    method: 'POST',
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
  })
  if (!resposta.ok) throw new ErroDoDrive('drive_indisponivel', 502)
  const corpo = (await resposta.json()) as { access_token: string; expires_in: number }
  tokenGuardado = { token: corpo.access_token, venceEm: agora + corpo.expires_in }
  return corpo.access_token
}

async function erroDaResposta(resposta: Response): Promise<ErroDoDrive> {
  const corpo: unknown = await resposta.json().catch(() => null)
  if (eErroDeCota(corpo)) return new ErroDoDrive('sem_espaco_no_drive', 507)
  if (resposta.status === 404) return new ErroDoDrive('nao_encontrado_no_drive', 404)
  return new ErroDoDrive('drive_indisponivel', 502)
}

// Toda chamada leva supportsAllDrives=true: os arquivos ficam num Drive compartilhado.
export async function chamarDrive(token: string, endereco: string, opcoes: RequestInit = {}): Promise<Response> {
  const url = new URL(endereco)
  url.searchParams.set('supportsAllDrives', 'true')
  const headers = new Headers(opcoes.headers)
  headers.set('Authorization', `Bearer ${token}`)
  const resposta = await fetch(url, { ...opcoes, headers })
  if (!resposta.ok) throw await erroDaResposta(resposta)
  return resposta
}

export async function lerJsonDoDrive<T>(token: string, endereco: string, opcoes: RequestInit = {}): Promise<T> {
  const resposta = await chamarDrive(token, endereco, opcoes)
  return (await resposta.json()) as T
}
