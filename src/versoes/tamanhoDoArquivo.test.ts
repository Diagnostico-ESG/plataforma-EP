import { describe, expect, test } from 'vitest'
import { tamanhoDoArquivo } from './tamanhoDoArquivo'

describe('tamanhoDoArquivo', () => {
  test.each([
    [0, '0 B'], [512, '512 B'], [1024, '1 KB'], [49_152, '48 KB'], [1_258_291, '1,2 MB'], [20 * 1024 * 1024, '20,0 MB'],
  ])('%i bytes viram %s', (bytes, texto) => {
    expect(tamanhoDoArquivo(bytes)).toBe(texto)
  })
})
