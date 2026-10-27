import { expect, test } from 'vitest'
import { oQueFaltouNoHistorico, perguntaDeArquivos } from './frasesDaConfirmacaoDeArquivos'
import type { PecaQueFalta, TravaDeArquivos } from './travaDeArquivos'

const PILOTO: TravaDeArquivos = { codigo: 'modelagem', nome: 'Modelagem piloto', falta: ['versao_piloto'] }
const tecnica = (...falta: PecaQueFalta[]): TravaDeArquivos => ({ codigo: 'relatorio_modelagem_tecnica', nome: 'Relatório e modelagem técnica', falta })

test('a pergunta da Modelagem piloto diz que falta a versão piloto', () => {
  expect(perguntaDeArquivos([PILOTO])).toEqual({
    titulo: 'Faltam os arquivos da Modelagem piloto.',
    paragrafos: ['Este processo ainda não tem a versão piloto. Você pode avançar agora e enviá-la depois.'],
  })
})

test('a pergunta da técnica diz só o que falta', () => {
  const frase = (...falta: PecaQueFalta[]) => perguntaDeArquivos([tecnica(...falta)])
  expect(frase('versao', 'relatorio')).toEqual({
    titulo: 'Faltam os arquivos da Modelagem técnica.',
    paragrafos: ['Este processo ainda não tem o fluxograma nem o relatório desta etapa. Você pode avançar agora e enviá-los depois.'],
  })
  expect(frase('versao').paragrafos[0]).toBe('Este processo ainda não tem o fluxograma desta etapa. Você pode avançar agora e enviá-lo depois.')
  expect(frase('relatorio').paragrafos[0]).toBe('Este processo ainda não tem o relatório desta etapa. Você pode avançar agora e enviá-lo depois.')
})

test('a ida que atravessa as duas etapas faz uma pergunta só, com a lista etapa por etapa', () => {
  expect(perguntaDeArquivos([PILOTO, tecnica('relatorio')])).toEqual({
    titulo: 'Faltam os arquivos de duas etapas.',
    paragrafos: [
      'Modelagem piloto: ainda não tem a versão piloto.',
      'Modelagem técnica: ainda não tem o relatório desta etapa.',
      'Você pode avançar agora e enviá-los depois.',
    ],
  })
})

test('sem etapa faltando não há o que perguntar: erro com o valor recebido e o esperado', () => {
  expect(() => perguntaDeArquivos([])).toThrow('Nenhuma etapa com arquivos faltando; esperado ao menos uma para perguntar.')
})

test('o histórico diz o que faltou em cada etapa', () => {
  expect(oQueFaltouNoHistorico('modelagem', ['versao_piloto'])).toBe('a versão piloto')
  expect(oQueFaltouNoHistorico('relatorio_modelagem_tecnica', ['versao'])).toBe('a versão')
  expect(oQueFaltouNoHistorico('relatorio_modelagem_tecnica', ['relatorio'])).toBe('o relatório')
  expect(oQueFaltouNoHistorico('relatorio_modelagem_tecnica', ['versao', 'relatorio'])).toBe('a versão e o relatório')
})
