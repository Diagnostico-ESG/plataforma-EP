import { describe, expect, it } from 'vitest'
import {
  cabecalhosDeOrigem,
  consultaDePastaPorNome,
  eErroDeCota,
  lerContaDeServico,
  origemAceita,
  tipoMimeDaExtensao,
} from './drive.ts'

describe('consultaDePastaPorNome', () => {
  it('procura a pasta pelo nome e pelo pai, fora da lixeira', () => {
    expect(consultaDePastaPorNome('CEE', 'pai1')).toBe(
      "name = 'CEE' and 'pai1' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
    )
  })

  it('escapa aspas simples e barras invertidas do nome', () => {
    expect(consultaDePastaPorNome("A'B\\C", 'pai1')).toContain("name = 'A\\'B\\\\C'")
  })
})

describe('eErroDeCota', () => {
  it.each(['storageQuotaExceeded', 'teamDriveFileLimitExceeded'])('reconhece o motivo %s', (reason) => {
    expect(eErroDeCota({ error: { errors: [{ reason }] } })).toBe(true)
  })

  it.each([
    ['outro motivo', { error: { errors: [{ reason: 'notFound' }] } }],
    ['nulo', null],
    ['texto', 'storageQuotaExceeded'],
    ['objeto sem error', { mensagem: 'x' }],
    ['errors que não é lista', { error: { errors: 'storageQuotaExceeded' } }],
  ])('não confunde %s com falta de espaço', (_nome, corpo) => {
    expect(eErroDeCota(corpo)).toBe(false)
  })
})

describe('origemAceita', () => {
  const aceitas = 'https://a.x, https://b.y'

  it('aceita uma origem da lista, com espaços em volta', () => {
    expect(origemAceita('https://b.y', aceitas)).toBe(true)
  })

  it.each([
    ['fora da lista', 'https://c.z', aceitas],
    ['nula', null, aceitas],
    ['com lista vazia', 'https://a.x', ''],
  ])('recusa a origem %s', (_nome, origem, lista) => {
    expect(origemAceita(origem, lista)).toBe(false)
  })
})

describe('cabecalhosDeOrigem', () => {
  const comuns = {
    Vary: 'Origin',
    'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  it('libera a origem aceita', () => {
    expect(cabecalhosDeOrigem('https://a.x', 'https://a.x')).toEqual({
      ...comuns,
      'Access-Control-Allow-Origin': 'https://a.x',
    })
  })

  it('não libera origem fora da lista', () => {
    expect(cabecalhosDeOrigem('https://c.z', 'https://a.x')).toEqual(comuns)
  })
})

describe('tipoMimeDaExtensao', () => {
  it.each([
    ['png', 'image/png'],
    ['pdf', 'application/pdf'],
    ['docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    ['bpmn', 'application/xml'],
    ['bpm', 'application/octet-stream'],
    ['xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    ['jpg', 'image/jpeg'],
    ['jpeg', 'image/jpeg'],
    ['eml', 'message/rfc822'],
  ])('%s → %s', (extensao, tipo) => {
    expect(tipoMimeDaExtensao(extensao)).toBe(tipo)
  })
})

// O JSON da conta vem do Google em UTF-8; o base64 é o que o usuário grava como segredo.
function paraBase64(texto: string): string {
  return btoa(String.fromCharCode(...new TextEncoder().encode(texto)))
}

describe('lerContaDeServico', () => {
  const chave = '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n'
  const json = JSON.stringify({ type: 'service_account', client_email: 'ep-drive@exemplo.iam.gserviceaccount.com', private_key: chave })
  const base64 = paraBase64(json)

  it('lê o e-mail e a chave do JSON da conta de serviço em base64', () => {
    expect(lerContaDeServico(base64)).toEqual({ email: 'ep-drive@exemplo.iam.gserviceaccount.com', chave })
  })

  it.each([
    ['texto que não é base64', '%%%'],
    ['base64 que não é JSON', paraBase64('não é json')],
    ['JSON sem a chave', paraBase64(JSON.stringify({ client_email: 'x@y' }))],
  ])('recusa %s, sem repetir o conteúdo', (_nome, valor) => {
    expect(() => lerContaDeServico(valor)).toThrow(/EP_DRIVE_CONTA_JSON_BASE64/)
    try {
      lerContaDeServico(valor)
    } catch (erro) {
      expect(String(erro)).not.toContain(valor)
    }
  })
})
