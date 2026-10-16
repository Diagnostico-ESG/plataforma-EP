import { expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import {
  arquivosDoPedido, nomeNaPrevia, podeEnviar, textoDaFalhaDoEnvio, textoDoProgresso,
} from './formularioDeVersao'

const bpmn = new File(['x'], 'fluxo.bpmn')
const png = new File(['y'], 'fluxo.PNG')
const relatorio = new File(['z'], 'relatorio.pdf')

test('os arquivos do pedido vão na ordem dos papéis, só os escolhidos', () => {
  expect(arquivosDoPedido({ relatorio, png, bpmn })).toEqual([
    { papel: 'bpmn', arquivo: bpmn }, { papel: 'png', arquivo: png }, { papel: 'relatorio', arquivo: relatorio },
  ])
})

test('enviar só se habilita com .bpmn e .png, sem recusa e sem conferência em andamento', () => {
  expect(podeEnviar({ bpmn }, {}, false)).toBe(false)
  expect(podeEnviar({ png }, {}, false)).toBe(false)
  expect(podeEnviar({ bpmn, png }, {}, false)).toBe(true)
  expect(podeEnviar({ bpmn, png, relatorio }, { relatorio: 'Escolha um arquivo .docx ou .pdf.' }, false)).toBe(false)
  expect(podeEnviar({ bpmn, png }, {}, true)).toBe(false)
})

test('o progresso diz qual arquivo está indo, sem passar do total', () => {
  expect(textoDoProgresso({ enviados: 0, total: 3 })).toBe('Enviando 1 de 3…')
  expect(textoDoProgresso({ enviados: 1, total: 3 })).toBe('Enviando 2 de 3…')
  expect(textoDoProgresso({ enviados: 3, total: 3 })).toBe('Enviando 3 de 3…')
})

test('a prévia do nome usa a sigla, o número, o nome do processo e a extensão escolhida', () => {
  const processo = { setorSigla: 'TSA', nome: 'Emitir Ofício' }
  expect(nomeNaPrevia(processo, 3, 'png', png)).toBe('TSA_V3_Emitir Ofício.png')
  expect(nomeNaPrevia(processo, 3, 'relatorio', relatorio)).toBe('TSA_V3_Emitir Ofício_Relatório.pdf')
})

test('a recusa aparece como veio; outra falha diz que a versão não foi registrada e que os arquivos continuam', () => {
  expect(textoDaFalhaDoEnvio(new TravaDoBanco('A versão precisa do .bpmn e do .png.'))).toBe('A versão precisa do .bpmn e do .png.')
  expect(textoDaFalhaDoEnvio(new Error('o arquivo fluxo.png não chegou ao Drive')))
    .toBe('A versão não foi registrada: o arquivo fluxo.png não chegou ao Drive. Os arquivos escolhidos continuam no formulário.')
})
