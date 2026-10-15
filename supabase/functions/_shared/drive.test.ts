import { describe, expect, it } from 'vitest'
import { cabecalhosDeOrigem, consultaDePastaPorNome, eErroDeCota, origemAceita } from './drive.ts'

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
