import { expect, test } from 'vitest'
import { proximoNumeroDoRelatorio, relatoriosDaVersao, textoDoRelatorio } from './relatorioQueVale'
import type { ArquivoDaVersao, Versao } from './tipos'

function relatorio(id: string, numeroDoRelatorio?: number, formato = 'docx'): ArquivoDaVersao {
  return { id, papel: 'relatorio', nome: `CEE_V1_Processo_${id}.${formato}`, formato, tamanho: 10, numeroDoRelatorio }
}

function versao(numero: number, arquivos: ArquivoDaVersao[] = [], tipo: 'historica' | 'piloto' | 'sequencia' = 'sequencia'): Versao {
  return {
    id: `v${numero}`, numero, historica: tipo === 'historica', piloto: tipo === 'piloto', enviadaEm: '2026-10-15T12:00:00Z',
    autor: 'Ana Teste', etapa: null, arquivos,
  }
}

function textos(alvo: Versao, todas: Versao[]): string[] {
  return relatoriosDaVersao(alvo, todas).map(textoDoRelatorio)
}

test('a versão mostra o relatório que recebeu', () => {
  const v7 = versao(7, [relatorio('r2', 2)])
  expect(textos(v7, [v7])).toEqual(['Relatório V2'])
})

test('dois relatórios enviados enquanto a versão era a mais recente aparecem em ordem de número', () => {
  const v8 = versao(8, [relatorio('r3', 3), relatorio('r2', 2)])
  expect(textos(v8, [v8])).toEqual(['Relatório V2', 'Relatório V3'])
})

test('a versão sem relatório próprio mostra o último das anteriores, dizendo de qual versão', () => {
  const v6 = versao(6, [relatorio('r1', 1)])
  const v7 = versao(7, [relatorio('r2', 2)])
  const v8 = versao(8)
  const v9 = versao(9)
  expect(textos(v9, [v6, v7, v8, v9])).toEqual(['Relatório V2 (da V7)'])
  expect(textos(v8, [v6, v7, v8, v9])).toEqual(['Relatório V2 (da V7)'])
})

test('o último é o de maior número entre os ligados às versões anteriores, e o ligado a uma versão posterior não vale para ela', () => {
  const v6 = versao(6, [relatorio('r1', 1), relatorio('r2', 2)])
  const v7 = versao(7)
  const v8 = versao(8, [relatorio('r3', 3)])
  expect(textos(v7, [v6, v7, v8])).toEqual(['Relatório V2 (da V6)'])
})

test('antes do primeiro relatório, nada', () => {
  const v6 = versao(6)
  const v7 = versao(7)
  expect(textos(v7, [v6, v7])).toEqual([])
})

test('o relatório da versão histórica aparece como "Relatório da V5F" e não vale para a versão seguinte', () => {
  const v5 = versao(5, [relatorio('rh', undefined)], 'historica')
  const v6 = versao(6, [], 'piloto')
  expect(textos(v5, [v5, v6])).toEqual(['Relatório da V5F'])
  expect(textos(v6, [v5, v6])).toEqual([])
})

test('a histórica sem relatório não mostra o de outra versão', () => {
  const v5 = versao(5, [], 'historica')
  expect(textos(v5, [v5])).toEqual([])
})

test('o relatório .pdf antigo, sem número, aparece como está e não vale para as versões seguintes', () => {
  const v6 = versao(6, [relatorio('antigo', undefined, 'pdf')])
  const v7 = versao(7)
  expect(textos(v6, [v6, v7])).toEqual(['Relatório .pdf'])
  expect(textos(v7, [v6, v7])).toEqual([])
})

test('o relatório ligado à versão piloto vale para a versão em sequência seguinte', () => {
  const v6 = versao(6, [relatorio('r1', 1)], 'piloto')
  const v7 = versao(7)
  expect(textos(v7, [v6, v7])).toEqual(['Relatório V1 (da V6P)'])
})

test('cada relatório devolvido leva o arquivo, para baixar', () => {
  const v6 = versao(6, [relatorio('r1', 1)])
  const v7 = versao(7)
  expect(relatoriosDaVersao(v7, [v6, v7])[0].arquivo.id).toBe('r1')
})

test('o próximo número do relatório é o maior do processo + 1; sem nenhum, é o 1', () => {
  expect(proximoNumeroDoRelatorio([])).toBe(1)
  expect(proximoNumeroDoRelatorio([versao(5, [relatorio('rh')], 'historica'), versao(6)])).toBe(1)
  expect(proximoNumeroDoRelatorio([versao(6, [relatorio('r1', 1)]), versao(7, [relatorio('r3', 3), relatorio('r2', 2)])])).toBe(4)
})
