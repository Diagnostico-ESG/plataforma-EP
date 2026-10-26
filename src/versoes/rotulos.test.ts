import { expect, test } from 'vitest'
import {
  PAPEIS, ROTULO_DO_PAPEL, emOrdemDeExibicao, envioDaEtapa, formatarDiaEMes, haVersaoEmSequencia, haVersaoNova, ordenarVersoes,
  origemDoRelatorio, papeisQueSePodeAcrescentar, podeCopiarRelatorio, proximoNumero, relatorioPendente, rotuloCurtoDoArquivo,
  rotuloDaAnterior, rotuloDaVersao, versoesComRelatorioPendente,
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

function relatorioDe(numero: number, copiadoDe?: string) {
  return { id: `r${numero}`, papel: 'relatorio' as const, nome: `TSA_V${numero}_Relatório.pdf`, formato: 'pdf', tamanho: 10, copiadoDe }
}

function comRelatorio(numero: number, copiadoDe?: string): Versao {
  return { ...versao(numero), arquivos: [relatorioDe(numero, copiadoDe)] }
}

test('o relatório está pendente na versão nova sem relatório, nunca na histórica', () => {
  expect(relatorioPendente(versao(6))).toBe(true)
  expect(relatorioPendente(comRelatorio(6))).toBe(false)
  expect(relatorioPendente(versao(5, true))).toBe(false)
})

test('as versões com relatório pendente vêm da mais recente para a mais antiga', () => {
  const versoes = [comRelatorio(2), versao(1), versao(3), versao(4, true), versao(5)]
  expect(versoesComRelatorioPendente(versoes).map(rotuloDaVersao)).toEqual(['V5', 'V3', 'V1'])
})

test('"sem alteração" só cabe na versão pendente cuja anterior tem relatório', () => {
  const versoes = [versao(1), comRelatorio(2), versao(3), versao(4), versao(5, true)]
  expect(podeCopiarRelatorio(versoes[2], versoes)).toBe(true) // V3: a V2 tem relatório
  expect(podeCopiarRelatorio(versoes[3], versoes)).toBe(false) // V4: a V3 não tem
  expect(podeCopiarRelatorio(versoes[0], versoes)).toBe(false) // V1: não há anterior
  expect(podeCopiarRelatorio(comRelatorio(6), [...versoes, comRelatorio(6)])).toBe(false) // já tem relatório
  expect(podeCopiarRelatorio(versoes[4], versoes)).toBe(false) // histórica
})

test('a anterior é a de maior número menor, mesmo com números saltados', () => {
  const versoes = [comRelatorio(2), versao(7)]
  expect(podeCopiarRelatorio(versoes[1], versoes)).toBe(true)
})

test('a origem do relatório copiado é o rótulo da versão de onde veio', () => {
  const versoes = [comRelatorio(2), { ...versao(3), arquivos: [relatorioDe(3, 'r2')] }]
  expect(origemDoRelatorio(versoes[1].arquivos[0], versoes)).toBe('V2')
  expect(origemDoRelatorio(versoes[0].arquivos[0], versoes)).toBeNull()
  expect(origemDoRelatorio({ ...relatorioDe(4, 'r9') }, versoes)).toBeNull()
})

test('o rótulo da versão anterior é o da de maior número menor; sem anterior, null', () => {
  const versoes = [versao(2), versao(5, true), versao(7)]
  expect(rotuloDaAnterior(versoes[2], versoes)).toBe('V5F')
  expect(rotuloDaAnterior(versoes[0], versoes)).toBeNull()
})

function arquivoCom(papel: ArquivoDaVersao['papel'], formato: string): ArquivoDaVersao {
  return { id: `a-${papel}`, papel, nome: `TSA_V2_Emitir Ofício.${formato}`, formato, tamanho: 10 }
}

test('o formulário pede .bpm, .png, .bpmn e relatório, nessa ordem e com esses rótulos', () => {
  expect(PAPEIS).toEqual(['bpm', 'png', 'bpmn', 'relatorio'])
  expect(PAPEIS.map((papel) => ROTULO_DO_PAPEL[papel])).toEqual([
    'Fluxograma Bizagi (.bpm)', 'Imagem do fluxo (.png)', '.bpmn', 'Relatório (.docx ou .pdf)',
  ])
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
})

test('o dia e o mês da versão saem no horário de Brasília', () => {
  expect(formatarDiaEMes('2026-10-02T13:00:00Z')).toBe('02/10')
  expect(formatarDiaEMes('2026-10-03T01:00:00Z')).toBe('02/10')
})
