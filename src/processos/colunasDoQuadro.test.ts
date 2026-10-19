import { expect, test } from 'vitest'
import { colunasDoQuadro, colunasPorResponsavel } from './colunasDoQuadro'
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

// ---- Agrupado por responsável

const pessoa = (id: string, nome: string, ativo = true): Partial<ProcessoDaLista> => ({
  responsavel: { id, nome, fotoUrl: null },
  cartao: { responsavelAtivo: ativo } as ProcessoDaLista['cartao'],
})
const porPessoa = (processos: ProcessoDaLista[]) => colunasPorResponsavel(processos)

test('por responsável: uma coluna por pessoa, em ordem de nome sem diferenciar maiúsculas e acentos', () => {
  const colunas = porPessoa([
    processo('a', pessoa('u1', 'Zélia')), processo('b', pessoa('u2', 'ana')), processo('c', pessoa('u3', 'Bruno')),
  ])
  expect(colunas.map((coluna) => coluna.titulo)).toEqual(['ana', 'Bruno', 'Zélia'])
  expect(colunas.map((coluna) => coluna.chave)).toEqual(['u2', 'u3', 'u1'])
})

test('por responsável: duas pessoas com o mesmo nome são duas colunas', () => {
  const colunas = porPessoa([processo('a', pessoa('u1', 'Ana')), processo('b', pessoa('u2', 'Ana'))])
  expect(colunas).toHaveLength(2)
})

test('por responsável: "Sem responsável" fica por último e só existe com cartão', () => {
  const com = porPessoa([processo('a'), processo('b', pessoa('u1', 'Ana'))])
  expect(com.map((coluna) => coluna.titulo)).toEqual(['Ana', 'Sem responsável'])
  expect(com[1].processos.map((p) => p.nome)).toEqual(['a'])
  expect(porPessoa([processo('b', pessoa('u1', 'Ana'))]).map((coluna) => coluna.titulo)).toEqual(['Ana'])
})

test('por responsável: a coluna da pessoa desativada leva inativo', () => {
  const colunas = porPessoa([processo('a', pessoa('u1', 'Ana', false)), processo('b', pessoa('u2', 'Bia'))])
  expect(colunas.map((coluna) => coluna.inativo)).toEqual([true, false])
})

test('por responsável: os cartões saem em ordem de nome; suspenso entra, concluído e cancelado saem', () => {
  const colunas = porPessoa([
    processo('beta', pessoa('u1', 'Ana')), processo('alfa', pessoa('u1', 'Ana')),
    processo('parado', { ...pessoa('u1', 'Ana'), situacao: 'suspenso' }),
    processo('feito', { ...pessoa('u1', 'Ana'), situacao: 'concluido' }),
    processo('cancelado', { ...pessoa('u1', 'Ana'), situacao: 'cancelado' }),
  ])
  expect(colunas[0].processos.map((p) => p.nome)).toEqual(['alfa', 'beta', 'parado'])
})

test('por responsável: cartão sem etapa atual fica de fora, e lista vazia dá nenhuma coluna', () => {
  expect(porPessoa([processo('a', { ...pessoa('u1', 'Ana'), etapaAtual: null })])).toEqual([])
  expect(porPessoa([])).toEqual([])
})
