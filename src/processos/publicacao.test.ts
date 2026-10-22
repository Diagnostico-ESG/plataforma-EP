import { describe, expect, test } from 'vitest'
import { avisoDaEscolhaNaVolta, linhaDaPublicacao, naoPublicado, perguntaDaPublicacao } from './publicacao'

const APROVACAO = { codigo: 'aprovacao_setor', ordem: 5 }
const PUBLICACAO = { codigo: 'publicacao', ordem: 6 }
const REVISAO = { codigo: 'revisao_setor', ordem: 4 }

describe('perguntaDaPublicacao', () => {
  test('concluir e registrar a Aprovação como realizada anteriormente perguntam quando a próxima é a Publicação', () => {
    expect(perguntaDaPublicacao('concluir', APROVACAO, PUBLICACAO)).toBe(true)
    expect(perguntaDaPublicacao('realizada', APROVACAO, PUBLICACAO)).toBe(true)
  })

  test('sem a Publicação depois (desativada ou já resolvida), não pergunta', () => {
    expect(perguntaDaPublicacao('concluir', APROVACAO, null)).toBe(false)
    expect(perguntaDaPublicacao('concluir', APROVACAO, { codigo: 'outra' })).toBe(false)
  })

  test('outra etapa ou a volta não perguntam', () => {
    expect(perguntaDaPublicacao('concluir', REVISAO, APROVACAO)).toBe(false)
    expect(perguntaDaPublicacao('voltar', APROVACAO, APROVACAO)).toBe(false)
  })
})

describe('linhaDaPublicacao e naoPublicado', () => {
  test('o concluído publicado diz a data; o com "não", "Não publicado"', () => {
    expect(linhaDaPublicacao({ situacao: 'concluido', vaiParaPublicacao: true, publicadoEm: '2026-10-20' })).toBe('Publicado em 20/10/2026')
    expect(linhaDaPublicacao({ situacao: 'concluido', vaiParaPublicacao: false, publicadoEm: null })).toBe('Não publicado')
    expect(naoPublicado({ situacao: 'concluido', vaiParaPublicacao: false })).toBe(true)
  })

  test('sem escolha (Publicação desativada) ou fora de concluído, nada a dizer', () => {
    expect(linhaDaPublicacao({ situacao: 'concluido', vaiParaPublicacao: null, publicadoEm: null })).toBeNull()
    expect(linhaDaPublicacao({ situacao: 'em_andamento', vaiParaPublicacao: true, publicadoEm: null })).toBeNull()
    expect(naoPublicado({ situacao: 'em_andamento', vaiParaPublicacao: false })).toBe(false)
    expect(naoPublicado({ situacao: 'concluido' })).toBe(false)
  })
})

describe('avisoDaEscolhaNaVolta', () => {
  const etapas = [REVISAO, APROVACAO, PUBLICACAO]

  test('voltar à Aprovação ou antes, com escolha, avisa que ela será apagada', () => {
    expect(avisoDaEscolhaNaVolta(etapas, 'aprovacao_setor', true)).toBe('A escolha de publicação será apagada.')
    expect(avisoDaEscolhaNaVolta(etapas, 'revisao_setor', false)).toBe('A escolha de publicação será apagada.')
  })

  test('voltar à Publicação, ou sem escolha, não avisa', () => {
    expect(avisoDaEscolhaNaVolta(etapas, 'publicacao', true)).toBeNull()
    expect(avisoDaEscolhaNaVolta(etapas, 'aprovacao_setor', null)).toBeNull()
    expect(avisoDaEscolhaNaVolta(etapas, 'aprovacao_setor', undefined)).toBeNull()
  })
})
