import { expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import {
  arquivosDoPedido, lerNumeroDigitado, nomeNaPrevia, textoDaFalhaDoAcrescimo, podeAcrescentarRelatorio, podeEnviar, podeRegistrarHistorica, podeSubmeter,
  podeTrocarArquivo, recusaDoTipoNaTroca, textoDaFalhaDaTroca, textoDaFalhaDoEnvio, textoDaFalhaDoRelatorio,
  textoDoProgresso,
} from './formularioDeVersao'

const bpmn = new File(['x'], 'fluxo.bpmn')
const png = new File(['y'], 'fluxo.PNG')
const relatorio = new File(['z'], 'relatorio.pdf')
const bpm = new File(['w'], 'fonte.bpm')

test('os arquivos do pedido vão na ordem do formulário (.bpm, .png, .bpmn, relatório), só os escolhidos', () => {
  expect(arquivosDoPedido({ relatorio, bpmn, png, bpm })).toEqual([
    { papel: 'bpm', arquivo: bpm }, { papel: 'png', arquivo: png }, { papel: 'bpmn', arquivo: bpmn },
    { papel: 'relatorio', arquivo: relatorio },
  ])
})

test('enviar só se habilita com o .bpm (o .png e o .bpmn são opcionais), sem recusa e sem conferência em andamento', () => {
  expect(podeEnviar({ bpm }, {}, false)).toBe(true)
  expect(podeEnviar({ png }, {}, false)).toBe(false)
  expect(podeEnviar({ bpmn, png }, {}, false)).toBe(false)
  expect(podeEnviar({ bpm, png }, {}, false)).toBe(true)
  expect(podeEnviar({ bpm, png, bpmn }, {}, false)).toBe(true)
  expect(podeEnviar({ bpm, png, relatorio }, { relatorio: 'Escolha um arquivo .docx ou .pdf.' }, false)).toBe(false)
  expect(podeEnviar({ bpm, png }, {}, true)).toBe(false)
})

test('o número digitado (da histórica e da piloto) é um inteiro maior que zero, só com dígitos', () => {
  expect(lerNumeroDigitado('5')).toBe(5)
  expect(lerNumeroDigitado('12')).toBe(12)
  for (const texto of ['', ' 5 ', '0', '-1', '5.5', '5,5', 'abc', '05x']) expect(lerNumeroDigitado(texto)).toBeNull()
})

test('registrar a histórica pede o número e o .bpm, ou o .bpmn com o .png', () => {
  expect(podeRegistrarHistorica({ bpm }, {}, false, 5)).toBe(true)
  expect(podeRegistrarHistorica({ bpmn, png }, {}, false, 5)).toBe(true)
  expect(podeRegistrarHistorica({ bpmn, png, bpm, relatorio }, {}, false, 5)).toBe(true)
  expect(podeRegistrarHistorica({ bpmn }, {}, false, 5)).toBe(false)
  expect(podeRegistrarHistorica({ png }, {}, false, 5)).toBe(false)
  expect(podeRegistrarHistorica({ relatorio }, {}, false, 5)).toBe(false)
  expect(podeRegistrarHistorica({}, {}, false, 5)).toBe(false)
})

test('registrar a histórica não habilita sem número, com recusa ou com conferência em andamento', () => {
  expect(podeRegistrarHistorica({ bpm }, {}, false, null)).toBe(false)
  expect(podeRegistrarHistorica({ bpm }, { bpm: 'Escolha um arquivo .bpm.' }, false, 5)).toBe(false)
  expect(podeRegistrarHistorica({ bpm }, {}, true, 5)).toBe(false)
})

test('o botão do formulário segue a regra do modo: em sequência pede o .bpm; piloto e histórica pedem também o número', () => {
  const sem = { recusas: {}, conferindo: false }
  expect(podeSubmeter({ tipo: 'sequencia', numero: 3 }, { ...sem, escolhidos: { bpm } }, 3)).toBe(true)
  expect(podeSubmeter({ tipo: 'sequencia', numero: 3 }, { ...sem, escolhidos: { bpmn, png } }, 3)).toBe(false)
  expect(podeSubmeter({ tipo: 'piloto', numeroSugerido: 6 }, { ...sem, escolhidos: { bpm } }, 6)).toBe(true)
  expect(podeSubmeter({ tipo: 'piloto', numeroSugerido: 6 }, { ...sem, escolhidos: { bpm } }, null)).toBe(false)
  expect(podeSubmeter({ tipo: 'piloto', numeroSugerido: 6 }, { ...sem, escolhidos: { png } }, 6)).toBe(false)
  expect(podeSubmeter({ tipo: 'historica' }, { ...sem, escolhidos: { bpm } }, 5)).toBe(true)
  expect(podeSubmeter({ tipo: 'historica' }, { ...sem, escolhidos: { bpm } }, null)).toBe(false)
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

test('a prévia do nome da histórica leva o F depois do número, e a da piloto, o P', () => {
  const processo = { setorSigla: 'TSA', nome: 'Emitir Ofício' }
  expect(nomeNaPrevia(processo, 5, 'bpm', bpm, 'historica')).toBe('TSA_V5F_Emitir Ofício.bpm')
  expect(nomeNaPrevia(processo, 5, 'relatorio', relatorio, 'historica')).toBe('TSA_V5F_Emitir Ofício_Relatório.pdf')
  expect(nomeNaPrevia(processo, 6, 'bpm', bpm, 'piloto')).toBe('TSA_V6P_Emitir Ofício.bpm')
})

test('a falha de acrescentar um arquivo: a frase pronta da recusa, ou o motivo com o aviso do formulário', () => {
  expect(textoDaFalhaDoAcrescimo(new TravaDoBanco('A versão já tem esse arquivo.'))).toBe('A versão já tem esse arquivo.')
  expect(textoDaFalhaDoAcrescimo(new Error('sem rede')))
    .toBe('O arquivo não foi registrado: sem rede. Tente de novo.')
})

test('a recusa aparece como veio; outra falha diz que a versão não foi registrada e que os arquivos continuam', () => {
  expect(textoDaFalhaDoEnvio(new TravaDoBanco('A versão precisa do .bpmn e do .png.'))).toBe('A versão precisa do .bpmn e do .png.')
  expect(textoDaFalhaDoEnvio(new Error('o arquivo fluxo.png não chegou ao Drive')))
    .toBe('A versão não foi registrada: o arquivo fluxo.png não chegou ao Drive. Os arquivos escolhidos continuam no formulário.')
})

test('acrescentar relatório só se habilita com o relatório escolhido, sem recusa e sem conferência em andamento', () => {
  expect(podeAcrescentarRelatorio({}, {}, false)).toBe(false)
  expect(podeAcrescentarRelatorio({ relatorio }, {}, false)).toBe(true)
  expect(podeAcrescentarRelatorio({ relatorio }, { relatorio: 'Escolha um arquivo .docx ou .pdf.' }, false)).toBe(false)
  expect(podeAcrescentarRelatorio({ relatorio }, {}, true)).toBe(false)
})

test('a falha do relatório depois: a frase pronta da recusa, ou o motivo com o aviso do formulário', () => {
  expect(textoDaFalhaDoRelatorio(new TravaDoBanco('Esta versão já tem relatório.'))).toBe('Esta versão já tem relatório.')
  expect(textoDaFalhaDoRelatorio(new Error('sem rede')))
    .toBe('O relatório não foi registrado: sem rede. O arquivo escolhido continua no formulário.')
})

test('na troca, o arquivo novo precisa ter a extensão do que sai (sem importar maiúsculas); senão, a frase com as duas', () => {
  expect(recusaDoTipoNaTroca('pdf', new File(['x'], 'novo.PDF'))).toBeNull()
  expect(recusaDoTipoNaTroca('pdf', new File(['x'], 'novo.docx')))
    .toBe('Escolha um arquivo .pdf, o mesmo tipo do arquivo que sai. Recebido: .docx.')
  expect(recusaDoTipoNaTroca('png', new File(['x'], 'sem-extensao')))
    .toBe('Escolha um arquivo .png, o mesmo tipo do arquivo que sai. Recebido: sem extensão.')
})

test('trocar o arquivo só se habilita com o arquivo escolhido, sem recusa e sem conferência em andamento', () => {
  expect(podeTrocarArquivo(undefined, null, false)).toBe(false)
  expect(podeTrocarArquivo(png, null, false)).toBe(true)
  expect(podeTrocarArquivo(png, 'O arquivo não é uma imagem PNG.', false)).toBe(false)
  expect(podeTrocarArquivo(png, null, true)).toBe(false)
})

test('a falha da troca: a frase pronta da recusa, ou o motivo com o aviso do formulário', () => {
  expect(textoDaFalhaDaTroca(new TravaDoBanco('A versão histórica é somente leitura: não recebe arquivos.')))
    .toBe('A versão histórica é somente leitura: não recebe arquivos.')
  expect(textoDaFalhaDaTroca(new Error('sem rede')))
    .toBe('A troca não foi registrada: sem rede. O arquivo escolhido continua no formulário.')
})
