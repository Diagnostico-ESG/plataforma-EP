import { expect, test } from 'vitest'
import { colunasDoQuadro } from './colunasDoQuadro'
import type { EtapaDoCatalogo, ProcessoDaLista } from './tipos'

const MODELAGEM: EtapaDoCatalogo = { id: 'e4', codigo: 'modelagem', nome: 'Reunião de modelagem', ordem: 4, ativa: true }
const RELATORIO: EtapaDoCatalogo = {
  id: 'e5', codigo: 'relatorio', nome: 'Relatório e modelagem técnica', ordem: 5, ativa: true,
}

function processo(nome: string, mudancas: Partial<ProcessoDaLista> = {}): ProcessoDaLista {
  return {
    processoPaiId: null,
    id: nome, nome, tipo: 'processo', setorId: 's1', setorSigla: 'TSA', macroprocessoId: 'm1', macroprocessoNome: 'Macro',
    situacao: 'em_andamento', etapaAtual: { codigo: 'modelagem', nome: MODELAGEM.nome, ordem: 4 },
    responsavel: null, ...mudancas,
  }
}

const titulos = (etapas: EtapaDoCatalogo[], processos: ProcessoDaLista[]) =>
  colunasDoQuadro({ etapas, processos }).map((coluna) => coluna.titulo)
const nomes = (chave: string, etapas: EtapaDoCatalogo[], processos: ProcessoDaLista[]) =>
  colunasDoQuadro({ etapas, processos }).find((coluna) => coluna.chave === chave)?.processos.map((p) => p.nome)

test('uma coluna por etapa ativa na ordem do catálogo (mesmo vazia), sem "Aguardando o setor"', () => {
  expect(titulos([RELATORIO, MODELAGEM], [])).toEqual([MODELAGEM.nome, RELATORIO.nome])
})

test('o processo fica na coluna da etapa atual', () => {
  const processos = [processo('Ana'), processo('Bia', { etapaAtual: { codigo: 'relatorio', nome: RELATORIO.nome, ordem: 5 } })]
  expect(nomes('modelagem', [MODELAGEM, RELATORIO], processos)).toEqual(['Ana'])
  expect(nomes('relatorio', [MODELAGEM, RELATORIO], processos)).toEqual(['Bia'])
})

test('em cada coluna os processos saem em ordem de nome, sem diferenciar maiúsculas e acentos', () => {
  const processos = [processo('beta'), processo('Álamo'), processo('Zeta'), processo('Alfa')]
  expect(nomes('modelagem', [MODELAGEM], processos)).toEqual(['Álamo', 'Alfa', 'beta', 'Zeta'])
})

test('suspenso fica no Quadro; concluído e cancelado saem', () => {
  const processos = [processo('Em curso'), processo('Parado', { situacao: 'suspenso' }),
    processo('Pronto', { situacao: 'concluido', etapaAtual: null }), processo('Desistido', { situacao: 'cancelado' })]
  expect(nomes('modelagem', [MODELAGEM], processos)).toEqual(['Em curso', 'Parado'])
})

test('a coluna de uma etapa desativada só aparece enquanto houver processo nela', () => {
  const desativada = { ...RELATORIO, ativa: false }
  const nela = processo('Preso', { etapaAtual: { codigo: 'relatorio', nome: RELATORIO.nome, ordem: 5 } })
  expect(titulos([MODELAGEM, desativada], [])).toEqual([MODELAGEM.nome])
  expect(titulos([MODELAGEM, desativada], [nela])).toEqual([MODELAGEM.nome, RELATORIO.nome])
})
