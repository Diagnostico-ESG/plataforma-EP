import { expect, test } from 'vitest'
import { FRASE_DO_PDF_INVALIDO } from './frasesDaValidacao'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import {
  LIMITE_DO_PDF, nomeDoPdf, recusaDoPdf, textoDaFalhaDoEnvioDoPdf, textoDaFalhaDoPdf, textoDaFalhaDoPdfDepoisDaAprovacao,
} from './pdfDaAprovacao'
import { textoDaValidacao } from './textoDaValidacao'

test('a gaveta diz o dia em que o setor validou, ou que a data não foi registrada', () => {
  expect(textoDaValidacao('2026-11-12')).toBe('Validado pelo setor em 12/11/2026')
  expect(textoDaValidacao(null)).toBe('Data da validação não registrada.')
  expect(textoDaValidacao(undefined)).toBe('Data da validação não registrada.')
})

test('o .pdf aceito é .pdf (em qualquer caixa) de até 20 MB, e sem arquivo não há o que recusar', () => {
  expect(recusaDoPdf(null)).toBeNull()
  expect(recusaDoPdf(new File(['x'], 'protocolo.pdf'))).toBeNull()
  expect(recusaDoPdf(new File(['x'], 'PROTOCOLO.PDF'))).toBeNull()
  const exato = new File(['x'], 'cheio.pdf')
  Object.defineProperty(exato, 'size', { value: LIMITE_DO_PDF })
  expect(recusaDoPdf(exato)).toBeNull()
})

test('recusa outra extensão, nome sem extensão e arquivo acima de 20 MB, com a frase do formato e do tamanho', () => {
  expect(recusaDoPdf(new File(['x'], 'protocolo.docx'))).toBe(FRASE_DO_PDF_INVALIDO)
  expect(recusaDoPdf(new File(['x'], 'protocolo'))).toBe(FRASE_DO_PDF_INVALIDO)
  const grande = new File(['x'], 'grande.pdf')
  Object.defineProperty(grande, 'size', { value: LIMITE_DO_PDF + 1 })
  expect(recusaDoPdf(grande)).toBe(FRASE_DO_PDF_INVALIDO)
  expect(FRASE_DO_PDF_INVALIDO).toBe('O .pdf da aprovação precisa ser .pdf, até 20 MB.')
})

test('o nome previsto do .pdf leva a sigla do setor, a versão aprovada e o nome do processo', () => {
  expect(nomeDoPdf({ setorSigla: 'CEE', nome: 'Nome do processo' }, 8)).toBe('CEE_V8_Nome do processo_Aprovação.pdf')
})

test('as frases da falha do .pdf: a recusa pronta do banco vale como veio, e o resto diz o que ficou feito', () => {
  const recusa = new TravaDoBanco('A aprovação já tem um .pdf; use Substituir.')
  expect(textoDaFalhaDoPdf(recusa)).toBe(recusa.message)
  expect(textoDaFalhaDoEnvioDoPdf(recusa)).toBe(recusa.message)
  expect(textoDaFalhaDoPdf(new Error('sem conexão'))).toBe('O .pdf não foi registrado: sem conexão. O arquivo escolhido continua no formulário.')
  expect(textoDaFalhaDoEnvioDoPdf(new Error('sem conexão'))).toBe('O .pdf não foi enviado: sem conexão. Nada foi registrado.')
  expect(textoDaFalhaDoPdfDepoisDaAprovacao(new Error('sem conexão'))).toBe(
    'A aprovação foi registrada, mas o .pdf não foi guardado: sem conexão. Envie o .pdf pela gaveta da Aprovação pelo setor.',
  )
  expect(textoDaFalhaDoPdfDepoisDaAprovacao(new TravaDoBanco('O processo está parado.'))).toBe(
    'A aprovação foi registrada, mas o .pdf não foi guardado: O processo está parado. Envie o .pdf pela gaveta da Aprovação pelo setor.',
  )
})
