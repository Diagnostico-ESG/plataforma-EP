import { describe, expect, test } from 'vitest'
import {
  TravaDoBanco, falhaDeGravacao, motivoDaFalhaDeGravacao, porQueNadaMudou, recusaPorPerfil, textoDaFalha,
  textoDaFalhaNoFormulario,
} from './falhasDeGravacao'

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

describe('falhaDeGravacao', () => {
  test.each([
    ['nao_desativa_a_si_mesmo:u1', 'Você não pode desativar a si mesmo.'],
    ['nao_muda_o_proprio_perfil:u1', 'Você não pode mudar o seu próprio perfil.'],
    ['ultimo_administrador:Ana Maria Teste', 'Não é possível: Ana Maria Teste é o último administrador ativo.'],
  ])('a trava "%s" vira TravaDoBanco com a frase da tela', (mensagem, frase) => {
    const falha = falhaDeGravacao({ message: mensagem, code: 'P0001' })
    expect(falha).toBeInstanceOf(TravaDoBanco)
    expect(falha.message).toBe(frase)
  })

  test('outras recusas viram Error comum com o motivo', () => {
    const falha = falhaDeGravacao({ message: 'email_ja_autorizado:x.teste@ccivil.pr.gov.br', code: 'P0001' })
    expect(falha).not.toBeInstanceOf(TravaDoBanco)
    expect(falha.message).toBe('o e-mail x.teste@ccivil.pr.gov.br já está autorizado')
  })
})

describe('texto da falha na tela', () => {
  test('a trava aparece como frase própria, na linha e no formulário', () => {
    const trava = new TravaDoBanco('Você não pode desativar a si mesmo.')
    expect(textoDaFalha(trava)).toBe('Você não pode desativar a si mesmo.')
    expect(textoDaFalhaNoFormulario(trava)).toBe('Você não pode desativar a si mesmo.')
  })

  test('a falha comum ganha o prefixo; no formulário, também o aviso de que os dados ficaram', () => {
    const falha = new Error('seu perfil não permite esta alteração')
    expect(textoDaFalha(falha)).toBe('A alteração não foi salva: seu perfil não permite esta alteração.')
    expect(textoDaFalhaNoFormulario(falha))
      .toBe('A alteração não foi salva: seu perfil não permite esta alteração. Seus dados continuam no formulário.')
  })
})

describe('recusaPorPerfil', () => {
  test('42501 vira TravaDoBanco com a frase do módulo', () => {
    const falha = recusaPorPerfil({ message: 'permission denied', code: '42501' }, 'Seu perfil não permite isto.')
    expect(falha).toBeInstanceOf(TravaDoBanco)
    expect(falha.message).toBe('Seu perfil não permite isto.')
  })

  test('outro código vira erro inesperado com o texto recebido', () => {
    const falha = recusaPorPerfil({ message: 'Failed to fetch' }, 'Seu perfil não permite isto.')
    expect(falha).not.toBeInstanceOf(TravaDoBanco)
    expect(falha.message).toBe('erro inesperado do banco (Failed to fetch)')
  })
})

describe('porQueNadaMudou', () => {
  class RegistroSumiu extends Error {}
  const recusas = { semPermissao: 'Seu perfil não permite isto.', registroInexistente: () => new RegistroSumiu('sumiu') }

  test('registro ainda legível: a recusa foi do perfil', () => {
    const falha = porQueNadaMudou(true, recusas)
    expect(falha).toBeInstanceOf(TravaDoBanco)
    expect(falha.message).toBe('Seu perfil não permite isto.')
  })

  test('registro ilegível: ele não existe mais', () => {
    expect(porQueNadaMudou(false, recusas)).toBeInstanceOf(RegistroSumiu)
  })
})
