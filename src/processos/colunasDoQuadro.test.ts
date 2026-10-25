import { describe, expect, test } from 'vitest'
import { CATALOGO_DE_TESTE, umProcesso } from '../testes/processoDaLista'
import { colunasDoQuadro, colunasPorResponsavel } from './colunasDoQuadro'
import type { EtapaDoCatalogo, ProcessoDaLista } from './tipos'

const colunas = (processos: ProcessoDaLista[], etapas: EtapaDoCatalogo[] = CATALOGO_DE_TESTE) => colunasDoQuadro({ etapas, processos })
const nomes = (chave: string, processos: ProcessoDaLista[], etapas?: EtapaDoCatalogo[]) =>
  colunas(processos, etapas).find((coluna) => coluna.chave === chave)?.processos.map((processo) => processo.nome)

test('uma coluna por etapa ativa, de Não iniciados a Concluídos, na ordem do catálogo e mesmo vazia', () => {
  const embaralhado = [...CATALOGO_DE_TESTE].reverse()
  expect(colunas([], embaralhado).map((coluna) => coluna.titulo)).toEqual(CATALOGO_DE_TESTE.map((etapa) => etapa.nome))
  expect(colunas([])[0].titulo).toBe('Não iniciados')
  expect(colunas([]).at(-1)?.titulo).toBe('Concluídos')
})

test('a etapa desativada não tem coluna', () => {
  const sem = CATALOGO_DE_TESTE.map((etapa) => (etapa.codigo === 'publicacao' ? { ...etapa, ativa: false } : etapa))
  expect(colunas([], sem).map((coluna) => coluna.chave)).not.toContain('publicacao')
})

test('o processo fica na coluna da etapa atual, inclusive em Não iniciados', () => {
  const processos = [umProcesso('Ana', {}, 'nao_iniciados'), umProcesso('Bia', {}, 'modelagem')]
  expect(nomes('nao_iniciados', processos)).toEqual(['Ana'])
  expect(nomes('modelagem', processos)).toEqual(['Bia'])
})

test('a coluna Concluídos traz os concluídos não arquivados; o arquivado e o cancelado ficam só na Lista', () => {
  const processos = [
    umProcesso('Zeta', { situacao: 'concluido' }, 'concluidos'), umProcesso('alfa', { situacao: 'concluido' }, 'concluidos'),
    umProcesso('Guardado', { situacao: 'concluido', arquivadoEm: '2026-10-22T15:00:00+00:00' }, 'concluidos'),
    umProcesso('Desistido', { situacao: 'cancelado' }),
  ]
  expect(nomes('concluidos', processos)).toEqual(['alfa', 'Zeta'])
  expect(colunas(processos).flatMap((coluna) => coluna.processos.map((processo) => processo.nome))).not.toContain('Desistido')
})

test('em cada coluna os processos saem em ordem de nome, sem diferenciar maiúsculas e acentos', () => {
  const processos = ['beta', 'Álamo', 'Zeta', 'Alfa'].map((nome) => umProcesso(nome))
  expect(nomes('revisao_interna', processos)).toEqual(['Álamo', 'Alfa', 'beta', 'Zeta'])
})

test('suspenso fica no Quadro, na coluna onde parou', () => {
  const processos = [umProcesso('Em curso'), umProcesso('Parado', { situacao: 'suspenso' })]
  expect(nomes('revisao_interna', processos)).toEqual(['Em curso', 'Parado'])
})

describe('agrupado por responsável', () => {
  const pessoa = (id: string, nome: string, ativo = true): Partial<ProcessoDaLista> => ({
    responsavel: { id, nome, fotoUrl: null }, cartao: { responsavelAtivo: ativo, ultimaVersao: null, subprocessos: 0 },
  })

  test('uma coluna por pessoa, em ordem de nome sem diferenciar maiúsculas e acentos', () => {
    const resultado = colunasPorResponsavel([
      umProcesso('a', pessoa('u1', 'Zélia')), umProcesso('b', pessoa('u2', 'ana')), umProcesso('c', pessoa('u3', 'Bruno')),
    ])
    expect(resultado.map((coluna) => coluna.titulo)).toEqual(['ana', 'Bruno', 'Zélia'])
  })

  test('inclui os processos de Não iniciados e de Concluídos, que agora têm responsável', () => {
    const resultado = colunasPorResponsavel([
      umProcesso('a', pessoa('u1', 'Ana'), 'nao_iniciados'),
      umProcesso('b', { ...pessoa('u1', 'Ana'), situacao: 'concluido' }, 'concluidos'),
      umProcesso('c', pessoa('u1', 'Ana')),
    ])
    expect(resultado).toHaveLength(1)
    expect(resultado[0].processos.map((processo) => processo.nome)).toEqual(['a', 'b', 'c'])
  })

  test('"Sem responsável" é a última coluna e só existe quando há cartão sem ninguém', () => {
    const sem = umProcesso('d', { responsavel: null })
    expect(colunasPorResponsavel([umProcesso('a', pessoa('u1', 'Ana'))])).toHaveLength(1)
    const resultado = colunasPorResponsavel([sem, umProcesso('a', pessoa('u1', 'Ana'))])
    expect(resultado.map((coluna) => coluna.titulo)).toEqual(['Ana', 'Sem responsável'])
  })

  test('a pessoa desativada tem a coluna marcada como inativa', () => {
    expect(colunasPorResponsavel([umProcesso('a', pessoa('u1', 'Ana', false))])[0].inativo).toBe(true)
  })

  test('o arquivado e o cancelado ficam de fora', () => {
    const resultado = colunasPorResponsavel([
      umProcesso('a', { ...pessoa('u1', 'Ana'), situacao: 'cancelado' }),
      umProcesso('b', { ...pessoa('u1', 'Ana'), situacao: 'concluido', arquivadoEm: '2026-10-22T15:00:00+00:00' }, 'concluidos'),
    ])
    expect(resultado).toEqual([])
  })
})
