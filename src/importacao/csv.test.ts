import { expect, test } from 'vitest'
import { decodificarArquivo, lerCsv } from './csv'

test('lê com ponto e vírgula, tirando a marca BOM e as quebras CRLF', () => {
  expect(lerCsv('﻿Área;Macros;Processos\r\nXYZ;I - Um;Exemplo\r\n')).toEqual([
    ['Área', 'Macros', 'Processos'], ['XYZ', 'I - Um', 'Exemplo'],
  ])
})

test('escolhe a vírgula quando a linha do cabeçalho a usa', () => {
  expect(lerCsv('Área,Macros,Processos\nXYZ,I - Um,Exemplo')).toEqual([
    ['Área', 'Macros', 'Processos'], ['XYZ', 'I - Um', 'Exemplo'],
  ])
})

test('campo entre aspas guarda separador, quebra de linha e aspas duplas', () => {
  expect(lerCsv('Área;Macros;Processos\nXYZ;"a;b\nc ""d""";Exemplo')[1]).toEqual(['XYZ', 'a;b\nc "d"', 'Exemplo'])
})

test('decodifica UTF-8 e, quando o arquivo é do Excel em ANSI, windows-1252', () => {
  const utf8 = new TextEncoder().encode('Revisão Técnica').buffer
  expect(decodificarArquivo(utf8)).toBe('Revisão Técnica')
  const ansi = Uint8Array.from([0x52, 0x65, 0x76, 0x69, 0x73, 0xe3, 0x6f]).buffer
  expect(decodificarArquivo(ansi)).toBe('Revisão')
})
