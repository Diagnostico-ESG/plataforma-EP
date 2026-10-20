// Token da conta de serviço do Google (JWT assinado aqui, sem biblioteca do Google), compartilhado pelas funções
// que falam com o Drive e com o Sheets. Só web crypto e fetch: roda no Deno e no Vitest. O corpo de erro do Google
// nunca entra na mensagem: pode trazer dado do pedido.
export const ENDERECO_DO_TOKEN = 'https://oauth2.googleapis.com/token'

export interface TokenDoGoogle {
  token: string
  /** Segundos desde 1970 em que o token vence. */
  venceEm: number
}

export class FalhaDoToken extends Error {
  /** Status HTTP do Google; nulo quando nem a resposta chegou. */
  status: number | null

  constructor(status: number | null) {
    super(`o Google não entregou o token (status ${status ?? 'sem resposta'}); esperado: 200`)
    this.name = 'FalhaDoToken'
    this.status = status
  }
}

type Buscar = (entrada: string, opcoes: RequestInit) => Promise<Response>

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

export async function assinarJwt(email: string, chavePem: string, escopo: string, agora: number): Promise<string> {
  const cabecalho = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const carga = base64Url(JSON.stringify({ iss: email, scope: escopo, aud: ENDERECO_DO_TOKEN, iat: agora, exp: agora + 3600 }))
  const chave = await importarChave(chavePem)
  const assinatura = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', chave, new TextEncoder().encode(`${cabecalho}.${carga}`))
  return `${cabecalho}.${carga}.${base64Url(assinatura)}`
}

async function trocarPeloToken(assertion: string, buscar: Buscar): Promise<Response> {
  try {
    return await buscar(ENDERECO_DO_TOKEN, {
      method: 'POST',
      body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
    })
  } catch {
    throw new FalhaDoToken(null)
  }
}

export async function pedirTokenDoGoogle(
  email: string,
  chavePem: string,
  escopo: string,
  agora: number,
  buscar: Buscar = fetch,
): Promise<TokenDoGoogle> {
  const resposta = await trocarPeloToken(await assinarJwt(email, chavePem, escopo, agora), buscar)
  if (!resposta.ok) throw new FalhaDoToken(resposta.status)
  const corpo = (await resposta.json()) as { access_token: string; expires_in: number }
  return { token: corpo.access_token, venceEm: agora + corpo.expires_in }
}
