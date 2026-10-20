// @vitest-environment node
// O ambiente padrão dos testes (jsdom) não traz crypto.subtle; a assinatura do token precisa dele.
import { describe, expect, it } from 'vitest'
import { FalhaDoToken, assinarJwt, pedirTokenDoGoogle } from './tokenGoogle.ts'

const ESCOPO = 'https://www.googleapis.com/auth/spreadsheets'
const ENDERECO_DO_TOKEN = 'https://oauth2.googleapis.com/token'

function emBase64(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
}

// Um par de chaves inventado na hora: nada de chave real em teste.
async function parDeChaves(): Promise<{ pem: string; publica: CryptoKey }> {
  const par = await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify'],
  )
  const corpo = emBase64(await crypto.subtle.exportKey('pkcs8', par.privateKey))
  return { pem: `-----BEGIN PRIVATE KEY-----\n${corpo}\n-----END PRIVATE KEY-----\n`, publica: par.publicKey }
}

function decodificar(parte: string): Record<string, unknown> {
  const normal = parte.replace(/-/g, '+').replace(/_/g, '/')
  return JSON.parse(atob(normal)) as Record<string, unknown>
}

describe('assinarJwt', () => {
  it('monta cabeçalho RS256, as claims do escopo pedido e uma assinatura que confere', async () => {
    const { pem, publica } = await parDeChaves()
    const jwt = await assinarJwt('robo@exemplo.test', pem, ESCOPO, 1000)
    const [cabecalho, carga, assinatura] = jwt.split('.')
    expect(decodificar(cabecalho)).toEqual({ alg: 'RS256', typ: 'JWT' })
    expect(decodificar(carga)).toEqual({ iss: 'robo@exemplo.test', scope: ESCOPO, aud: ENDERECO_DO_TOKEN, iat: 1000, exp: 4600 })
    const bytes = Uint8Array.from(atob(assinatura.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - (assinatura.length % 4)) % 4)), (c) => c.charCodeAt(0))
    const valida = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', publica, bytes, new TextEncoder().encode(`${cabecalho}.${carga}`))
    expect(valida).toBe(true)
  })

  it('recusa uma chave que não é PEM, sem repetir o conteúdo', async () => {
    await expect(assinarJwt('robo@exemplo.test', 'segredo-qualquer', ESCOPO, 1000)).rejects.toThrow()
  })
})

describe('pedirTokenDoGoogle', () => {
  it('troca o JWT pelo token e calcula quando ele vence', async () => {
    const { pem } = await parDeChaves()
    const buscar = async (): Promise<Response> => Response.json({ access_token: 'token-de-teste', expires_in: 3600 })
    const token = await pedirTokenDoGoogle('robo@exemplo.test', pem, ESCOPO, 1000, buscar)
    expect(token).toEqual({ token: 'token-de-teste', venceEm: 4600 })
  })

  it('falha com o status do Google, sem ler o corpo da resposta', async () => {
    const { pem } = await parDeChaves()
    const buscar = async (): Promise<Response> => new Response('corpo-que-nao-pode-vazar', { status: 400 })
    const erro = await pedirTokenDoGoogle('robo@exemplo.test', pem, ESCOPO, 1000, buscar).catch((e: unknown) => e)
    expect(erro).toBeInstanceOf(FalhaDoToken)
    expect((erro as FalhaDoToken).status).toBe(400)
    expect((erro as FalhaDoToken).message).not.toContain('corpo-que-nao-pode-vazar')
  })

  it('falha sem status quando a rede cai', async () => {
    const { pem } = await parDeChaves()
    const buscar = async (): Promise<Response> => { throw new TypeError('rede fora') }
    const erro = await pedirTokenDoGoogle('robo@exemplo.test', pem, ESCOPO, 1000, buscar).catch((e: unknown) => e)
    expect(erro).toBeInstanceOf(FalhaDoToken)
    expect((erro as FalhaDoToken).status).toBeNull()
  })
})
