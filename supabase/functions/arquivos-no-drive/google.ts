// Conversa com o Google: token da conta de serviço (assinado em _shared/tokenGoogle.ts) e chamadas
// ao Drive. O corpo de erro do Google nunca vai para a resposta nem para o log.
import { eErroDeCota } from '../_shared/drive.ts'
import { FalhaDoToken, pedirTokenDoGoogle, type TokenDoGoogle } from '../_shared/tokenGoogle.ts'
import type { Configuracao } from './configuracao.ts'

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

let tokenGuardado: TokenDoGoogle | null = null

// Guardado em memória enquanto a instância da função vive, até 5 minutos antes de vencer.
export async function obterToken(config: Configuracao): Promise<string> {
  const agora = Math.floor(Date.now() / 1000)
  if (tokenGuardado && tokenGuardado.venceEm - 300 > agora) return tokenGuardado.token
  try {
    tokenGuardado = await pedirTokenDoGoogle(config.contaEmail, config.contaChave, ESCOPO, agora)
  } catch (erro) {
    if (erro instanceof FalhaDoToken) throw new ErroDoDrive('drive_indisponivel', 502)
    throw erro
  }
  return tokenGuardado.token
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

// O arquivo que o Drive não acha (404) vira null; qualquer outra falha do Drive segue como erro do Drive.
export async function lerNoDriveOuNulo<T>(token: string, endereco: string): Promise<T | null> {
  try {
    return await lerJsonDoDrive<T>(token, endereco)
  } catch (erro) {
    if (erro instanceof ErroDoDrive && erro.codigo === 'nao_encontrado_no_drive') return null
    throw erro
  }
}
