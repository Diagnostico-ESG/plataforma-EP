import { describe, expect, test } from 'vitest'
import { arquivosDaVersaoMaisRecente } from './arquivosDaArvore'
import type { ArquivoDaVersao, PapelDoArquivo, Versao } from './tipos'

function arquivo(papel: PapelDoArquivo, formato: string, numeroDoRelatorio?: number): ArquivoDaVersao {
  return { id: `${papel}-${numeroDoRelatorio ?? 0}`, papel, nome: `arquivo.${formato}`, formato, tamanho: 10, numeroDoRelatorio }
}

function versao(numero: number, arquivos: ArquivoDaVersao[], mudancas: Partial<Versao> = {}): Versao {
  return { id: `v${numero}`, numero, historica: false, piloto: false, enviadaEm: '2026-10-02T12:00:00Z', autor: null, etapa: null, arquivos, ...mudancas }
}

const rotulos = (versoes: Versao[]) => arquivosDaVersaoMaisRecente(versoes)?.arquivos.map((item) => item.rotulo)

describe('arquivosDaVersaoMaisRecente', () => {
  test('sem versão não há o que mostrar', () => {
    expect(arquivosDaVersaoMaisRecente([])).toBeNull()
  })

  test('a mais recente, com o rótulo, na ordem .png, .bpm, relatório, .bpmn', () => {
    const versoes = [
      versao(6, [arquivo('bpm', 'bpm')]),
      versao(7, [arquivo('bpmn', 'bpmn'), arquivo('relatorio', 'docx', 2), arquivo('bpm', 'bpm'), arquivo('png', 'png')]),
    ]
    expect(arquivosDaVersaoMaisRecente(versoes)).toMatchObject({ rotulo: 'V7', aprovada: false })
    expect(rotulos(versoes)).toEqual(['Imagem .png', 'Fluxograma .bpm', 'Relatório V2', 'BPMN .bpmn'])
  })

  test('aprovada, piloto e histórica levam o selo e o sufixo certos', () => {
    expect(arquivosDaVersaoMaisRecente([versao(7, [arquivo('bpm', 'bpm')], { aprovada: true })])).toMatchObject({ rotulo: 'V7', aprovada: true })
    expect(arquivosDaVersaoMaisRecente([versao(6, [], { piloto: true })])?.rotulo).toBe('V6P')
    expect(arquivosDaVersaoMaisRecente([versao(5, [arquivo('bpm', 'bpm')], { historica: true })])?.rotulo).toBe('V5F')
  })

  test('sem relatório próprio, vale o último numerado das versões anteriores, "da V7"', () => {
    const versoes = [versao(7, [arquivo('relatorio', 'docx', 2)]), versao(8, [arquivo('bpm', 'bpm')])]
    expect(rotulos(versoes)).toEqual(['Fluxograma .bpm', 'Relatório V2 (da V7)'])
  })

  test('o .pdf antigo sem número aparece como relatório da própria versão; o .pdf da aprovação e os anexos ficam de fora', () => {
    const versoes = [versao(3, [arquivo('relatorio', 'pdf'), arquivo('pdf_da_aprovacao', 'pdf'), arquivo('anexo', 'eml')])]
    expect(rotulos(versoes)).toEqual(['Relatório .pdf'])
  })
})
