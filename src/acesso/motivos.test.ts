import { describe, expect, test } from 'vitest'
import { lerRecusa, lerRecusaDaUrl, mensagemDaRecusa } from './motivos'

describe('lerRecusa', () => {
  test('lê o motivo e o e-mail que o banco devolve', () => {
    expect(lerRecusa('fora_do_dominio:pessoa@gmail.com')).toEqual({ motivo: 'fora_do_dominio', email: 'pessoa@gmail.com' })
  })

  test('acha o motivo mesmo com um prefixo do Auth no texto', () => {
    expect(lerRecusa('Error running hook: sem_autorizacao:x@ccivil.pr.gov.br')).toEqual({
      motivo: 'sem_autorizacao',
      email: 'x@ccivil.pr.gov.br',
    })
  })

  test('texto desconhecido ou ausente não é recusa', () => {
    expect(lerRecusa('Database error saving new user')).toBeNull()
    expect(lerRecusa(null)).toBeNull()
  })
})

describe('lerRecusaDaUrl', () => {
  test('lê a recusa da consulta do endereço de retorno', () => {
    const url = 'http://localhost:5173/?error=access_denied&error_description=sem_autorizacao%3Ax%40ccivil.pr.gov.br'
    expect(lerRecusaDaUrl(url)).toEqual({ motivo: 'sem_autorizacao', email: 'x@ccivil.pr.gov.br' })
  })

  test('lê a recusa do fragmento do endereço de retorno', () => {
    const url = 'http://localhost:5173/#error=access_denied&error_description=fora_do_dominio%3Apessoa%40gmail.com'
    expect(lerRecusaDaUrl(url)).toEqual({ motivo: 'fora_do_dominio', email: 'pessoa@gmail.com' })
  })

  test('endereço sem erro não traz recusa', () => {
    expect(lerRecusaDaUrl('http://localhost:5173/')).toBeNull()
  })
})

describe('mensagemDaRecusa', () => {
  test('conta fora do domínio', () => {
    expect(mensagemDaRecusa({ motivo: 'fora_do_dominio', email: 'pessoa@gmail.com' })).toBe(
      'Use sua conta @ccivil.pr.gov.br. A conta pessoa@gmail.com não é institucional.',
    )
  })

  test('conta sem autorização', () => {
    expect(mensagemDaRecusa({ motivo: 'sem_autorizacao', email: 'x@ccivil.pr.gov.br' })).toBe(
      'A conta x@ccivil.pr.gov.br ainda não foi autorizada. Peça a um administrador.',
    )
  })

  test('usuário inativo', () => {
    expect(mensagemDaRecusa({ motivo: 'inativo', email: 'x@ccivil.pr.gov.br' })).toBe(
      'Seu acesso está inativo. Fale com um administrador.',
    )
  })
})
