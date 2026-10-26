import { expect, test } from 'vitest'
import {
  PAPEIS, ROTULO_DO_PAPEL, acceptDoCampo, emOrdemDeExibicao, envioDaEtapa, formatarDiaEMes, haVersaoEmSequencia, haVersaoNova,
  ordenarVersoes, papeisQueSePodeAcrescentar, podeEnviarRelatorioNaEtapa, proximoNumero, rotuloCurtoDoArquivo, rotuloDaVersao, rotuloDoCampo,
} from './rotulos'
import type { ArquivoDaVersao, Versao } from './tipos'

function versao(numero: number, historica = false, piloto = false): Versao {
  return {
    id: `v${numero}`, numero, historica, piloto, enviadaEm: '2026-10-15T12:00:00Z', autor: 'Ana Teste', etapa: null,
    arquivos: [],
  }
}

test('o rótulo é V e o número, com F na versão histórica e P na piloto', () => {
  expect(rotuloDaVersao(versao(7))).toBe('V7')
  expect(rotuloDaVersao(versao(5, true))).toBe('V5F')
  expect(rotuloDaVersao(versao(6, false, true))).toBe('V6P')
})

test('há versão em sequência quando alguma não é histórica nem piloto', () => {
  expect(haVersaoEmSequencia([])).toBe(false)
  expect(haVersaoEmSequencia([versao(5, true), versao(6, false, true)])).toBe(false)
  expect(haVersaoEmSequencia([versao(6, false, true), versao(7)])).toBe(true)
})

test('o número mínimo da piloto é o mesmo da próxima versão: a maior + 1, de qualquer tipo', () => {
  expect(proximoNumero([versao(5, true), versao(6, false, true)])).toBe(7)
})

test.each([
  ['nao_iniciados', [], 'historica'],
  ['nao_iniciados', [versao(5, true)], 'historica'],
  ['nao_iniciados', [versao(6, false, true)], null],
  ['nao_iniciados', [versao(7)], null],
  ['modelagem', [], 'piloto'],
  ['modelagem', [versao(6, false, true)], 'piloto'],
  ['modelagem', [versao(7)], null],
  ['relatorio_modelagem_tecnica', [], 'sequencia'],
  ['revisao_interna', [versao(7)], 'sequencia'],
  ['revisao_setor', [], null],
  ['aprovacao_setor', [], null],
  ['publicacao', [], null],
  ['concluidos', [], null],
  ['etapa_nova_do_catalogo', [], null],
])('o envio da etapa %s com as versões %j é %s', (etapa, versoes, esperado) => {
  expect(envioDaEtapa(etapa, versoes as Versao[])).toBe(esperado)
})

test.each([
  ['relatorio_modelagem_tecnica', [versao(7)], true],
  ['relatorio_modelagem_tecnica', [versao(6, false, true)], true],
  ['revisao_interna', [versao(5, true), versao(7)], true],
  ['relatorio_modelagem_tecnica', [versao(5, true)], false],
  ['relatorio_modelagem_tecnica', [], false],
  ['modelagem', [versao(6, false, true)], false],
  ['nao_iniciados', [versao(7)], false],
  ['revisao_setor', [versao(7)], false],
  ['publicacao', [versao(7)], false],
  ['concluidos', [versao(7)], false],
  ['etapa_nova_do_catalogo', [versao(7)], false],
])('o [Enviar relatório] na etapa %s com as versões %j: %s', (etapa, versoes, esperado) => {
  expect(podeEnviarRelatorioNaEtapa(etapa, versoes as Versao[])).toBe(esperado)
})

test('acrescentar .png e .bpmn só cabe na versão piloto ou em sequência, fora da aprovada, e só o que falta', () => {
  const arquivo = (papel: 'bpm' | 'png' | 'bpmn') => ({ id: `a-${papel}`, papel, nome: papel, formato: papel, tamanho: 1 })
  const comBpm = { ...versao(7), arquivos: [arquivo('bpm')] }
  expect(papeisQueSePodeAcrescentar(comBpm)).toEqual(['png', 'bpmn'])
  expect(papeisQueSePodeAcrescentar({ ...comBpm, arquivos: [arquivo('bpm'), arquivo('png')] })).toEqual(['bpmn'])
  expect(papeisQueSePodeAcrescentar({ ...comBpm, arquivos: [arquivo('bpm'), arquivo('png'), arquivo('bpmn')] })).toEqual([])
  expect(papeisQueSePodeAcrescentar({ ...versao(6, false, true), arquivos: [arquivo('bpm')] })).toEqual(['png', 'bpmn'])
  expect(papeisQueSePodeAcrescentar({ ...comBpm, aprovada: true })).toEqual([])
  expect(papeisQueSePodeAcrescentar({ ...versao(5, true), arquivos: [arquivo('bpm')] })).toEqual([])
})

test('a próxima versão é a maior + 1, contando as históricas; sem versão, é a V1', () => {
  expect(proximoNumero([])).toBe(1)
  expect(proximoNumero([versao(3, true), versao(5, true)])).toBe(6)
  expect(proximoNumero([versao(6), versao(7), versao(5, true)])).toBe(8)
})

test('há versão nova quando alguma versão do processo não é histórica', () => {
  expect(haVersaoNova([])).toBe(false)
  expect(haVersaoNova([versao(3, true), versao(5, true)])).toBe(false)
  expect(haVersaoNova([versao(5, true), versao(6)])).toBe(true)
})

test('as versões vão da mais recente (maior número) para a mais antiga', () => {
  expect(ordenarVersoes([versao(5, true), versao(7), versao(6)]).map(rotuloDaVersao)).toEqual(['V7', 'V6', 'V5F'])
})

function arquivoCom(papel: ArquivoDaVersao['papel'], formato: string): ArquivoDaVersao {
  return { id: `a-${papel}`, papel, nome: `TSA_V2_Emitir Ofício.${formato}`, formato, tamanho: 10 }
}

test('o formulário pede .bpm, .png, .bpmn e relatório, nessa ordem e com esses rótulos', () => {
  expect(PAPEIS).toEqual(['bpm', 'png', 'bpmn', 'relatorio'])
  expect(PAPEIS.map((papel) => ROTULO_DO_PAPEL[papel])).toEqual([
    'Fluxograma Bizagi (.bpm)', 'Imagem do fluxo (.png)', '.bpmn', 'Relatório (.docx)',
  ])
})

test('o relatório novo só aceita .docx; o da histórica, que não é numerado, ainda aceita .pdf', () => {
  expect(acceptDoCampo('relatorio', false)).toBe('.docx')
  expect(acceptDoCampo('relatorio', true)).toBe('.docx,.pdf')
  expect(acceptDoCampo('png', true)).toBe('.png,image/png')
  expect(rotuloDoCampo('relatorio', true)).toBe('Relatório (.docx ou .pdf)')
  expect(rotuloDoCampo('relatorio', false)).toBe('Relatório (.docx)')
})

test('os arquivos da versão aparecem na ordem .png, .bpm, relatório e .bpmn', () => {
  const arquivos = [arquivoCom('bpmn', 'bpmn'), arquivoCom('relatorio', 'pdf'), arquivoCom('bpm', 'bpm'), arquivoCom('png', 'png')]
  expect(emOrdemDeExibicao(arquivos).map(({ papel }) => papel)).toEqual(['png', 'bpm', 'relatorio', 'bpmn'])
})

test('o rótulo curto do arquivo diz o que ele é e a extensão', () => {
  expect(rotuloCurtoDoArquivo(arquivoCom('bpm', 'bpm'))).toBe('Fluxograma .bpm')
  expect(rotuloCurtoDoArquivo(arquivoCom('png', 'png'))).toBe('Imagem .png')
  expect(rotuloCurtoDoArquivo(arquivoCom('bpmn', 'bpmn'))).toBe('BPMN .bpmn')
  expect(rotuloCurtoDoArquivo(arquivoCom('relatorio', 'docx'))).toBe('Relatório .docx')
  expect(rotuloCurtoDoArquivo(arquivoCom('relatorio', 'PDF'))).toBe('Relatório .pdf')
  expect(rotuloCurtoDoArquivo({ ...arquivoCom('relatorio', 'docx'), numeroDoRelatorio: 2 })).toBe('Relatório V2')
})

test('o dia e o mês da versão saem no horário de Brasília', () => {
  expect(formatarDiaEMes('2026-10-02T13:00:00Z')).toBe('02/10')
  expect(formatarDiaEMes('2026-10-03T01:00:00Z')).toBe('02/10')
})

test('o .pdf protocolado da aprovação tem rótulo, accept e nome curto próprios', () => {
  expect(ROTULO_DO_PAPEL.pdf_da_aprovacao).toBe('.pdf protocolado')
  expect(acceptDoCampo('pdf_da_aprovacao', false)).toBe('.pdf,application/pdf')
  expect(rotuloCurtoDoArquivo(arquivoCom('pdf_da_aprovacao', 'pdf'))).toBe('Aprovação .pdf')
})
