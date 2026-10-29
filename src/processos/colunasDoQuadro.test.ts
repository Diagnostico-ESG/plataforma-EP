import { describe, expect, test } from 'vitest'
import { CATALOGO_DE_TESTE, umProcesso, umSetor } from '../testes/processoDaLista'
import { colunasDoQuadro, colunasPorResponsavel, colunasPorSetor, quantosForaDoQuadro } from './colunasDoQuadro'
import type { EtapaDoCatalogo, ProcessoDaLista, SetorDoQuadro } from './tipos'

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

test('a coluna Concluídos traz os concluídos no Quadro; o tirado ou antigo e o cancelado ficam só na Lista', () => {
  const processos = [
    umProcesso('Zeta', { situacao: 'concluido' }, 'concluidos'), umProcesso('alfa', { situacao: 'concluido' }, 'concluidos'),
    umProcesso('Guardado', { situacao: 'concluido', noQuadro: false }, 'concluidos'),
    umProcesso('SemInformacao', { situacao: 'concluido', noQuadro: undefined }, 'concluidos'),
    umProcesso('Desistido', { situacao: 'cancelado' }),
  ]
  expect(nomes('concluidos', processos)).toEqual(['alfa', 'SemInformacao', 'Zeta'])
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

  test('inclui os processos de Não iniciados, mas não os de Concluídos', () => {
    const resultado = colunasPorResponsavel([
      umProcesso('a', pessoa('u1', 'Ana'), 'nao_iniciados'),
      umProcesso('b', { ...pessoa('u1', 'Ana'), situacao: 'concluido' }, 'concluidos'),
      umProcesso('c', pessoa('u1', 'Ana')),
    ])
    expect(resultado).toHaveLength(1)
    expect(resultado[0].processos.map((processo) => processo.nome)).toEqual(['a', 'c'])
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

  test('o concluído (esteja ou não no Quadro) e o cancelado ficam de fora, e a pessoa só com eles não tem coluna', () => {
    const resultado = colunasPorResponsavel([
      umProcesso('a', { ...pessoa('u1', 'Ana'), situacao: 'cancelado' }),
      umProcesso('b', { ...pessoa('u1', 'Ana'), situacao: 'concluido', noQuadro: false }, 'concluidos'),
      umProcesso('c', { ...pessoa('u2', 'Bia'), situacao: 'concluido', noQuadro: true }, 'concluidos'),
    ])
    expect(resultado).toEqual([])
  })

  test('o concluído sem responsável também não vai para "Sem responsável"', () => {
    const resultado = colunasPorResponsavel([umProcesso('d', { situacao: 'concluido', responsavel: null }, 'concluidos'), umProcesso('e', { responsavel: null })])
    expect(resultado.map((coluna) => [coluna.titulo, coluna.processos.map((processo) => processo.nome)])).toEqual([['Sem responsável', ['e']]])
  })
})

describe('agrupado por setor', () => {
  const TSA = umSetor('s1', 'TSA', 'Setor de Testes A')
  const ABC = umSetor('s2', 'abc', 'Assessoria Fictícia')
  const VELHO = umSetor('s3', 'MNO', 'Setor Antigo', false)
  const OUTRO_VELHO = umSetor('s4', 'XYZ', 'Setor Esquecido', false)
  const doSetor = (nome: string, { id, sigla }: SetorDoQuadro, mudancas: Partial<ProcessoDaLista> = {}) =>
    umProcesso(nome, { setorId: id, setorSigla: sigla, ...mudancas })

  test('uma coluna por setor ativo, em ordem de sigla, mesmo vazia, com a sigla no título e o nome abaixo', () => {
    const resultado = colunasPorSetor([TSA, ABC], [], null)
    expect(resultado.map((coluna) => [coluna.titulo, coluna.subtitulo])).toEqual([['abc', 'Assessoria Fictícia'], ['TSA', 'Setor de Testes A']])
    expect(resultado.every((coluna) => coluna.processos.length === 0)).toBe(true)
  })

  test('cada processo na coluna do setor dono, em ordem de nome', () => {
    const resultado = colunasPorSetor([TSA, ABC], [doSetor('Zeta', TSA), doSetor('alfa', TSA), doSetor('Beta', ABC)], null)
    expect(resultado.map((coluna) => coluna.processos.map((processo) => processo.nome))).toEqual([['Beta'], ['alfa', 'Zeta']])
  })

  test('o setor inativo só tem coluna com processo, marcada inativa, e entra na ordem dos que têm processo', () => {
    const resultado = colunasPorSetor([TSA, VELHO, OUTRO_VELHO, ABC], [doSetor('Antigo', VELHO)], null)
    expect(resultado.map((coluna) => coluna.titulo)).toEqual(['MNO', 'abc', 'TSA'])
    expect(resultado.map((coluna) => coluna.inativo)).toEqual([true, false, false])
  })

  test('os setores com processo vêm antes dos vazios, cada grupo em ordem de sigla', () => {
    const XPT = umSetor('s5', 'XPT', 'Setor de Testes C')
    const resultado = colunasPorSetor([XPT, TSA, ABC, VELHO], [doSetor('Um', XPT), doSetor('Dois', VELHO)], null)
    expect(resultado.map((coluna) => coluna.titulo)).toEqual(['MNO', 'XPT', 'abc', 'TSA'])
  })

  test('o cancelado fica de fora, e o setor inativo só com ele não tem coluna', () => {
    const resultado = colunasPorSetor([TSA, VELHO], [doSetor('Desistido', VELHO, { situacao: 'cancelado' })], null)
    expect(resultado.map((coluna) => [coluna.titulo, coluna.processos.length])).toEqual([['TSA', 0]])
  })

  test('o portfólio mostra o concluído sempre, mesmo o que saiu do Quadro', () => {
    const guardado = doSetor('Guardado', TSA, { situacao: 'concluido', noQuadro: false })
    expect(colunasPorSetor([TSA], [guardado], null)[0].processos.map((processo) => processo.nome)).toEqual(['Guardado'])
  })

  test('Concluídos tira o que não está concluído; as colunas dos setores continuam', () => {
    const resultado = colunasPorSetor([TSA, ABC], [
      doSetor('Pronto', TSA, { situacao: 'concluido' }), doSetor('Andando', TSA), doSetor('Parado', ABC, { situacao: 'suspenso' }),
    ], null, 'concluidos')
    expect(resultado.map((coluna) => [coluna.titulo, coluna.processos.map((processo) => processo.nome)])).toEqual([['TSA', ['Pronto']], ['abc', []]])
  })

  test('com o filtro de setor, só a coluna desse setor', () => {
    expect(colunasPorSetor([TSA, ABC], [doSetor('Beta', ABC)], 's1').map((coluna) => coluna.titulo)).toEqual(['TSA'])
    expect(colunasPorSetor([TSA, VELHO], [doSetor('Antigo', VELHO)], 's3').map((coluna) => coluna.titulo)).toEqual(['MNO'])
  })
})

test('a coluna por setor leva a cor do setor; as de etapa e de responsável não têm cor', () => {
  expect(colunasPorSetor([umSetor('s1', 'TSA', 'Setor A', true, 13)], [], null)[0].cor).toBe(13)
  expect(colunas([umProcesso()]).every((coluna) => coluna.cor === undefined)).toBe(true)
  expect(colunasPorResponsavel([umProcesso()]).every((coluna) => coluna.cor === undefined)).toBe(true)
})

describe('quantosForaDoQuadro', () => {
  test('conta os concluídos fora do Quadro; o ausente conta como no Quadro e o resto não conta', () => {
    const processos = [
      umProcesso('Fora', { situacao: 'concluido', noQuadro: false }, 'concluidos'),
      umProcesso('Fora Dois', { situacao: 'concluido', noQuadro: false }, 'concluidos'),
      umProcesso('Dentro', { situacao: 'concluido', noQuadro: true }, 'concluidos'),
      umProcesso('Sem informação', { situacao: 'concluido' }, 'concluidos'),
      umProcesso('Andando', {}, 'modelagem'),
    ]
    expect(quantosForaDoQuadro(processos)).toBe(2)
    expect(quantosForaDoQuadro([])).toBe(0)
  })
})
