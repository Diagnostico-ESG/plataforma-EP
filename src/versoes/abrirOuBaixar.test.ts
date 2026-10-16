import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { abrirAba, entregarArquivo, fecharAba } from './abrirOuBaixar'

const ARQUIVO = new Blob(['x'], { type: 'image/png' })
let aberturas: unknown[][]
let cliques: { href: string; download: string }[]
let revogadas: string[]

beforeEach(() => {
  aberturas = []
  cliques = []
  revogadas = []
  URL.createObjectURL = vi.fn(() => 'blob:arquivo')
  URL.revokeObjectURL = vi.fn((endereco: string) => { revogadas.push(endereco) })
  vi.spyOn(window, 'open').mockImplementation((...argumentos: unknown[]) => {
    aberturas.push(argumentos)
    return { location: { href: '' }, close: vi.fn() } as unknown as Window
  })
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    cliques.push({ href: this.href, download: this.download })
  })
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

test.each(['png', 'pdf'])('o formato %s abre uma aba nova', (formato) => {
  expect(abrirAba(formato)).not.toBeNull()
  expect(aberturas).toHaveLength(1)
})

test.each(['bpmn', 'bpm', 'docx'])('o formato %s não abre aba', (formato) => {
  expect(abrirAba(formato)).toBeNull()
  expect(aberturas).toHaveLength(0)
})

test('com aba, ela vai ao arquivo e nada é baixado', () => {
  const aba = abrirAba('png') as Window
  entregarArquivo(aba, ARQUIVO, 'TSA_V1_Emitir Ofício.png')
  expect(aba.location.href).toBe('blob:arquivo')
  expect(cliques).toEqual([])
})

test('sem aba (formato que não abre, ou aba bloqueada), baixa com o nome padrão', () => {
  entregarArquivo(null, ARQUIVO, 'TSA_V1_Emitir Ofício.bpmn')
  expect(cliques).toEqual([{ href: 'blob:arquivo', download: 'TSA_V1_Emitir Ofício.bpmn' }])
  expect(document.querySelector('a[download]')).toBeNull()
})

test('o endereço do arquivo é revogado depois, para não ficar na memória', () => {
  entregarArquivo(null, ARQUIVO, 'a.bpmn')
  expect(revogadas).toEqual([])
  vi.advanceTimersByTime(60_000)
  expect(revogadas).toEqual(['blob:arquivo'])
})

test('fechar a aba fecha a aba aberta e aceita a ausência dela', () => {
  const aba = abrirAba('pdf') as Window
  fecharAba(aba)
  expect(aba.close).toHaveBeenCalledOnce()
  expect(() => fecharAba(null)).not.toThrow()
})
