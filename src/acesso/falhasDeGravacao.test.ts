import { describe, expect, test } from 'vitest'
import { motivoDaFalhaDeGravacao } from './falhasDeGravacao'

describe('motivoDaFalhaDeGravacao', () => {
  test.each([
    ['email_fora_do_dominio:p@gmail.com', 'o e-mail p@gmail.com não é institucional (formato esperado: nome@ccivil.pr.gov.br)'],
    ['email_ja_autorizado:x.teste@ccivil.pr.gov.br', 'o e-mail x.teste@ccivil.pr.gov.br já está autorizado'],
    ['email_ja_e_usuario:x.teste@ccivil.pr.gov.br', 'o e-mail x.teste@ccivil.pr.gov.br já pertence a um usuário'],
  ])('traduz a recusa "%s"', (mensagem, motivo) => {
    expect(motivoDaFalhaDeGravacao({ message: mensagem, code: 'P0001' })).toBe(motivo)
  })

  test('recusa da RLS vira falta de permissão', () => {
    expect(motivoDaFalhaDeGravacao({ message: 'new row violates row-level security policy', code: '42501' }))
      .toBe('seu perfil não permite esta alteração')
  })

  test('erro desconhecido mostra o texto recebido', () => {
    expect(motivoDaFalhaDeGravacao({ message: 'Failed to fetch' })).toBe('erro inesperado do banco (Failed to fetch)')
  })
})
