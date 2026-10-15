import { expect, test } from 'vitest'
import { conferirArquivo } from './conferenciaDosArquivos'

const ASSINATURA_PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const BPMN = '<?xml version="1.0"?><definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" id="d"><process id="p"/></definitions>'

function arquivo(nome: string, conteudo: BlobPart[] = ['x']): File {
  return new File(conteudo, nome)
}

const png = (nome = 'fluxo.png') => arquivo(nome, [new Uint8Array([...ASSINATURA_PNG, 0, 0])])

test('aceita o .bpmn com o elemento definitions do BPMN 2.0', async () => {
  expect(await conferirArquivo('bpmn', arquivo('fluxo.bpmn', [BPMN]))).toBeNull()
})

test('aceita o .png com a assinatura do formato, o .bpm e o relatório .docx ou .pdf', async () => {
  expect(await conferirArquivo('png', png())).toBeNull()
  expect(await conferirArquivo('bpm', arquivo('fluxo.bpm'))).toBeNull()
  expect(await conferirArquivo('relatorio', arquivo('relatorio.docx'))).toBeNull()
  expect(await conferirArquivo('relatorio', arquivo('Relatorio.PDF'))).toBeNull()
})

test('recusa a extensão errada, dizendo a esperada e a recebida', async () => {
  expect(await conferirArquivo('bpmn', arquivo('fluxo.xml', [BPMN]))).toBe('Escolha um arquivo .bpmn. Recebido: .xml.')
  expect(await conferirArquivo('relatorio', arquivo('relatorio.odt'))).toBe('Escolha um arquivo .docx ou .pdf. Recebido: .odt.')
  expect(await conferirArquivo('bpm', arquivo('sem-extensao'))).toBe('Escolha um arquivo .bpm. Recebido: sem extensão.')
})

test('aceita exatamente 20 MB e recusa um byte a mais', async () => {
  expect(await conferirArquivo('bpm', arquivo('grande.bpm', [new Uint8Array(20 * 1024 * 1024)]))).toBeNull()
  expect(await conferirArquivo('bpm', arquivo('grande.bpm', [new Uint8Array(20 * 1024 * 1024 + 1)])))
    .toBe('O arquivo passa de 20 MB. Recebido: 20,0 MB (20971521 bytes).')
})

test('recusa o .png que não começa com a assinatura do formato', async () => {
  expect(await conferirArquivo('png', arquivo('falso.png', ['não sou imagem']))).toBe('O arquivo não é uma imagem PNG.')
})

test('recusa o .bpmn que não é XML ou que não tem o definitions do BPMN 2.0', async () => {
  const recusa = 'O arquivo não é um BPMN 2.0 (falta o elemento definitions do BPMN).'
  expect(await conferirArquivo('bpmn', arquivo('fluxo.bpmn', ['isto não é xml <']))).toBe(recusa)
  expect(await conferirArquivo('bpmn', arquivo('fluxo.bpmn', ['<definitions id="d"/>']))).toBe(recusa)
  expect(await conferirArquivo('bpmn', arquivo('fluxo.bpmn', ['<outro xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"/>'])))
    .toBe(recusa)
})
