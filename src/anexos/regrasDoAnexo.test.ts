import { describe, expect, it } from 'vitest'
import { ordenarAnexos, recusaDoArquivoDoAnexo } from './regrasDoAnexo'
import type { Anexo } from './tipos'

const MB = 1024 * 1024
const arquivo = (name: string, size = 100) => ({ name, size })

describe('recusaDoArquivoDoAnexo', () => {
  it.each(['pdf', 'docx', 'xlsx', 'png', 'jpg', 'jpeg', 'eml'])('aceita .%s, também em maiúsculas', (extensao) => {
    expect(recusaDoArquivoDoAnexo(arquivo(`resposta.${extensao}`))).toBeNull()
    expect(recusaDoArquivoDoAnexo(arquivo(`RESPOSTA.${extensao.toUpperCase()}`))).toBeNull()
  })

  it('diz a lista e a extensão recebida quando o formato não vale', () => {
    expect(recusaDoArquivoDoAnexo(arquivo('programa.exe'))).toBe(
      'O anexo precisa ser .pdf, .docx, .xlsx, .png, .jpg, .jpeg ou .eml; recebido: .exe.',
    )
  })

  it('diz "nenhuma" quando o nome não tem extensão', () => {
    expect(recusaDoArquivoDoAnexo(arquivo('LEIAME'))).toBe(
      'O anexo precisa ser .pdf, .docx, .xlsx, .png, .jpg, .jpeg ou .eml; recebido: nenhuma.',
    )
  })

  it('aceita 20 MB e recusa mais que isso dizendo o tamanho recebido', () => {
    expect(recusaDoArquivoDoAnexo(arquivo('a.pdf', 20 * MB))).toBeNull()
    expect(recusaDoArquivoDoAnexo(arquivo('a.pdf', 25 * MB + 512 * 1024))).toBe('O anexo pode ter até 20 MB; recebido: 25,5 MB.')
  })

  it('recusa o arquivo vazio', () => {
    expect(recusaDoArquivoDoAnexo(arquivo('a.pdf', 0))).toBe('O anexo está vazio; recebido: 0 bytes.')
  })

  it('aceita o nome de 300 caracteres e recusa o de 301, dizendo quantos tem', () => {
    const base = 'a'.repeat(296)
    expect(recusaDoArquivoDoAnexo(arquivo(`${base}.pdf`))).toBeNull()
    expect(recusaDoArquivoDoAnexo(arquivo(`${base}b.pdf`))).toBe('O nome do anexo pode ter até 300 caracteres; recebido: 301.')
  })

  it('o formato vem antes do tamanho na frase', () => {
    expect(recusaDoArquivoDoAnexo(arquivo('grande.exe', 30 * MB))).toContain('recebido: .exe.')
  })
})

describe('ordenarAnexos', () => {
  const anexo = (id: string, enviadoEm: string): Anexo => ({
    id, papel: 'anexo', nome: `${id}.eml`, formato: 'eml', tamanho: 1, etapa: null, autor: null, enviadoEm,
  })

  it('põe o mais recente primeiro, sem mudar a lista de origem', () => {
    const lista = [anexo('a', '2026-10-01T10:00:00Z'), anexo('c', '2026-10-03T10:00:00Z'), anexo('b', '2026-10-02T10:00:00Z')]
    expect(ordenarAnexos(lista).map(({ id }) => id)).toEqual(['c', 'b', 'a'])
    expect(lista.map(({ id }) => id)).toEqual(['a', 'c', 'b'])
  })

  it('mantém a ordem dada quando o instante é o mesmo', () => {
    const lista = [anexo('x', '2026-10-01T10:00:00Z'), anexo('y', '2026-10-01T10:00:00Z')]
    expect(ordenarAnexos(lista).map(({ id }) => id)).toEqual(['x', 'y'])
  })
})
