import { describe, expect, test } from 'vitest'
import { descreverEstado, formatarMomento, textoDaAcao } from './historico'

describe('textoDaAcao', () => {
  test.each([
    ['autorizar', 'autorizacao', 'Autorizou o e-mail'],
    ['excluir_autorizacao', 'autorizacao', 'Excluiu a autorização'],
    ['mudar_perfil', 'autorizacao', 'Mudou o perfil da autorização'],
    ['primeiro_acesso', 'usuario', 'Primeiro acesso'],
    ['mudar_perfil', 'usuario', 'Mudou o perfil'],
    ['desativar', 'usuario', 'Desativou'],
    ['reativar', 'usuario', 'Reativou'],
    ['corrigir_nome', 'usuario', 'Corrigiu o nome'],
  ])('%s em %s vira "%s"', (acao, entidade, texto) => {
    expect(textoDaAcao(acao, entidade)).toBe(texto)
  })

  test('ação que a tela não conhece aparece pelo próprio código, sem sumir', () => {
    expect(textoDaAcao('arquivar', 'processo')).toBe('arquivar')
  })
})

describe('descreverEstado', () => {
  test('perfil e situação aparecem com os rótulos da tela', () => {
    expect(descreverEstado({ email: 'nova.teste@ccivil.pr.gov.br', perfil: 'integrante_ep', situacao: 'aguardando' }))
      .toBe('E-mail: nova.teste@ccivil.pr.gov.br; Perfil: Integrante do EP; Situação: Aguardando primeiro acesso')
  })

  test('ativo vira Ativo ou Inativo; nome passa como está', () => {
    expect(descreverEstado({ ativo: false })).toBe('Situação: Inativo')
    expect(descreverEstado({ nome: 'Ana Teste', ativo: true })).toBe('Nome: Ana Teste; Situação: Ativo')
  })

  test('campo que a tela não conhece aparece pelo próprio nome, e valor vazio vira travessão', () => {
    expect(descreverEstado({ setor: null })).toBe('setor: —')
  })

  test('sem estado (antes de autorizar, depois de excluir) vira travessão', () => {
    expect(descreverEstado(null)).toBe('—')
  })
})

test('formatarMomento mostra data e hora de Brasília', () => {
  expect(formatarMomento('2026-10-08T14:05:00Z')).toBe('08/10/2026, 11:05')
})
