import { describe, expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import {
  FRASE_DO_MOTIVO_DESCONHECIDO, frasePedidoRecusado, motivoDaFalha, rotuloDaOrigem, rotuloDoResultado,
} from './frasesDasPlanilhas'

describe('motivoDaFalha', () => {
  test.each([
    ['planilha_interna_recusada', 'O Google recusou a escrita na planilha interna.'],
    ['planilha_publica_recusada', 'O Google recusou a escrita na planilha pública.'],
    ['google_indisponivel', 'O Google não respondeu.'],
    ['pacote_invalido', 'O pedido enviado à atualização estava incompleto.'],
  ])('o código %s vira uma frase simples', (codigo, frase) => {
    expect(motivoDaFalha(codigo)).toBe(frase)
  })

  test.each([['codigo_novo'], [null], ['']])('o código %j vira a frase do motivo não identificado', (codigo) => {
    expect(motivoDaFalha(codigo)).toBe('A atualização falhou por um motivo não identificado.')
    expect(FRASE_DO_MOTIVO_DESCONHECIDO).toBe('A atualização falhou por um motivo não identificado.')
  })
})

describe('rótulos', () => {
  test('a origem automática não cita ninguém', () => {
    expect(rotuloDaOrigem('automatica', null)).toBe('Automática')
  })

  test('o botão cita quem pediu, ou só o botão se o nome não puder ser lido', () => {
    expect(rotuloDaOrigem('botao', 'Ana Teste')).toBe('Pelo botão · Ana Teste')
    expect(rotuloDaOrigem('botao', null)).toBe('Pelo botão')
  })

  test('cada resultado tem o seu texto', () => {
    expect(rotuloDoResultado('em_andamento')).toBe('Em andamento')
    expect(rotuloDoResultado('sem_resposta')).toBe('Sem resposta')
    expect(rotuloDoResultado('concluida')).toBe('Concluída')
    expect(rotuloDoResultado('falhou')).toBe('Falhou')
  })
})

describe('frasePedidoRecusado', () => {
  test('a recusa do banco já traz a frase pronta', () => {
    expect(frasePedidoRecusado(new TravaDoBanco('Já há uma atualização em andamento.')))
      .toBe('Já há uma atualização em andamento.')
  })

  test('outra falha cita o motivo e pede para tentar de novo', () => {
    expect(frasePedidoRecusado(new Error('sem rede')))
      .toBe('Não foi possível pedir a atualização (sem rede). Tente de novo.')
  })
})
