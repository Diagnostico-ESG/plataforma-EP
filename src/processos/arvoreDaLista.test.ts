import { describe, expect, test } from 'vitest'
import { montarArvore, montarArvorePorSetor } from './arvoreDaLista'
import type { LinhaDaLista } from './linhasDaLista'
import type { SetorDoQuadro } from './tipos'

const SETORES: SetorDoQuadro[] = [
  { id: 's1', sigla: 'TSA', nome: 'Setor A', ativo: true, cor: 3 },
  { id: 's2', sigla: 'TSB', nome: 'Setor B', ativo: true, cor: 5 },
]

function linha(id: string, mudancas: Partial<LinhaDaLista> = {}): LinhaDaLista {
  return {
    id, nome: id, tipo: 'processo', setorId: 's1', setorSigla: 'TSA', macroprocessoId: 'm1', macroprocessoNome: 'Macro Um',
    processoPaiId: null, situacao: 'em_andamento', etapaAtual: null, responsavel: null, nomeDoPai: null, ...mudancas,
  }
}

const ids = (itens: { linha: LinhaDaLista }[]) => itens.map((item) => item.linha.id)

describe('montarArvore', () => {
  test('macroprocessos por nome e setores por sigla; o setor aparece sob cada macro de que tem processo', () => {
    const linhas = [
      linha('a', { setorId: 's2', setorSigla: 'TSB' }), linha('b'),
      linha('c', { macroprocessoId: 'm0', macroprocessoNome: 'Alfa', setorId: 's2', setorSigla: 'TSB' }),
    ]
    const arvore = montarArvore(linhas, linhas, SETORES)
    expect(arvore.map((macro) => macro.nome)).toEqual(['Alfa', 'Macro Um'])
    expect(arvore[1].setores.map((setor) => setor.sigla)).toEqual(['TSA', 'TSB'])
    expect(arvore[0].setores.map((setor) => setor.sigla)).toEqual(['TSB'])
  })

  test('os processos do setor mantêm a ordem recebida', () => {
    const linhas = [linha('z'), linha('a'), linha('m')]
    expect(ids(montarArvore(linhas, linhas, SETORES)[0].setores[0].itens)).toEqual(['z', 'a', 'm'])
  })

  test('subprocesso de outro setor fica no grupo do pai, recuado, logo depois dele', () => {
    const linhas = [
      linha('pai'), linha('filho', { tipo: 'subprocesso', processoPaiId: 'pai', setorId: 's2', setorSigla: 'TSB', nomeDoPai: 'pai' }), linha('outro'),
    ]
    const [macro] = montarArvore(linhas, linhas, SETORES)
    expect(macro.setores).toHaveLength(1)
    const itens = macro.setores[0].itens
    expect(ids(itens)).toEqual(['pai', 'filho', 'outro'])
    expect(itens.map((item) => item.nivel)).toEqual([0, 1, 0])
    expect(itens[1].linha.setorSigla).toBe('TSB')
    expect(itens[1].subprocessoDe).toBeNull()
  })

  test('subprocesso cujo pai foi filtrado vai para o próprio setor, no macroprocesso do pai, com "subprocesso de"', () => {
    const pai = linha('pai', { nome: 'Pai', macroprocessoId: 'm2', macroprocessoNome: 'Macro Dois' })
    const filho = linha('filho', { tipo: 'subprocesso', processoPaiId: 'pai', setorId: 's2', setorSigla: 'TSB', nomeDoPai: 'Pai' })
    const [macro] = montarArvore([filho], [pai, filho], SETORES)
    expect(macro.nome).toBe('Macro Dois')
    expect(macro.setores[0].sigla).toBe('TSB')
    expect(macro.setores[0].itens[0]).toMatchObject({ nivel: 0, subprocessoDe: 'Pai' })
  })

  test('as contagens somam processos e subprocessos; sem linha, não há ramo', () => {
    const linhas = [linha('a'), linha('b', { tipo: 'subprocesso', processoPaiId: 'a', nomeDoPai: 'a' }), linha('c', { setorId: 's2', setorSigla: 'TSB' })]
    const [macro] = montarArvore(linhas, linhas, SETORES)
    expect(macro.total).toBe(3)
    expect(macro.setores.map((setor) => setor.itens.length)).toEqual([2, 1])
    expect(montarArvore([], [], SETORES)).toEqual([])
  })

  test('nome e cor do setor vêm da lista de setores; sem ele, a sigla e a cor 1', () => {
    const linhas = [linha('a'), linha('b', { setorId: 's9', setorSigla: 'XYZ' })]
    const { setores } = montarArvore(linhas, linhas, SETORES)[0]
    expect(setores[0]).toMatchObject({ nome: 'Setor A', cor: 3 })
    expect(setores[1]).toMatchObject({ nome: 'XYZ', cor: 1 })
  })
})

describe('montarArvorePorSetor', () => {
  test('setores por sigla e, dentro deles, macroprocessos por nome', () => {
    const linhas = [
      linha('a', { setorId: 's2', setorSigla: 'TSB' }), linha('b'),
      linha('c', { macroprocessoId: 'm0', macroprocessoNome: 'Alfa', setorId: 's2', setorSigla: 'TSB' }), linha('d', { macroprocessoId: 'm0', macroprocessoNome: 'Alfa' }),
    ]
    const arvore = montarArvorePorSetor(linhas, linhas, SETORES)
    expect(arvore.map((setor) => setor.sigla)).toEqual(['TSA', 'TSB'])
    expect(arvore[0].macros.map((macro) => macro.nome)).toEqual(['Alfa', 'Macro Um'])
    expect(arvore[1].macros.map((macro) => macro.nome)).toEqual(['Alfa', 'Macro Um'])
    expect(ids(arvore[1].macros[1].itens)).toEqual(['a'])
  })

  test('os processos do macroprocesso mantêm a ordem recebida', () => {
    const linhas = [linha('z'), linha('a'), linha('m')]
    expect(ids(montarArvorePorSetor(linhas, linhas, SETORES)[0].macros[0].itens)).toEqual(['z', 'a', 'm'])
  })

  test('subprocesso de outro setor fica sob o pai, recuado, no ramo do setor do pai', () => {
    const linhas = [
      linha('pai'), linha('filho', { tipo: 'subprocesso', processoPaiId: 'pai', setorId: 's2', setorSigla: 'TSB', nomeDoPai: 'pai' }), linha('outro'),
    ]
    const arvore = montarArvorePorSetor(linhas, linhas, SETORES)
    expect(arvore.map((setor) => setor.sigla)).toEqual(['TSA'])
    const itens = arvore[0].macros[0].itens
    expect(ids(itens)).toEqual(['pai', 'filho', 'outro'])
    expect(itens.map((item) => item.nivel)).toEqual([0, 1, 0])
    expect(itens[1].linha.setorSigla).toBe('TSB')
    expect(itens[1].subprocessoDe).toBeNull()
  })

  test('subprocesso cujo pai foi filtrado vai para o ramo do próprio setor, no macroprocesso do pai, com "subprocesso de"', () => {
    const pai = linha('pai', { nome: 'Pai', macroprocessoId: 'm2', macroprocessoNome: 'Macro Dois' })
    const filho = linha('filho', { tipo: 'subprocesso', processoPaiId: 'pai', setorId: 's2', setorSigla: 'TSB', nomeDoPai: 'Pai' })
    const [setor] = montarArvorePorSetor([filho], [pai, filho], SETORES)
    expect(setor.sigla).toBe('TSB')
    expect(setor.macros[0].nome).toBe('Macro Dois')
    expect(setor.macros[0].itens[0]).toMatchObject({ nivel: 0, subprocessoDe: 'Pai' })
  })

  test('as contagens somam processos e subprocessos; sem linha, não há ramo', () => {
    const linhas = [linha('a'), linha('b', { tipo: 'subprocesso', processoPaiId: 'a', nomeDoPai: 'a' }), linha('c', { macroprocessoId: 'm0', macroprocessoNome: 'Alfa' })]
    const [setor] = montarArvorePorSetor(linhas, linhas, SETORES)
    expect(setor.total).toBe(3)
    expect(setor.macros.map((macro) => macro.itens.length)).toEqual([1, 2])
    expect(montarArvorePorSetor([], [], SETORES)).toEqual([])
  })

  test('nome e cor do setor vêm da lista de setores; sem ele, a sigla e a cor 1', () => {
    const linhas = [linha('a'), linha('b', { setorId: 's9', setorSigla: 'XYZ' })]
    const arvore = montarArvorePorSetor(linhas, linhas, SETORES)
    expect(arvore[0]).toMatchObject({ nome: 'Setor A', cor: 3 })
    expect(arvore[1]).toMatchObject({ nome: 'XYZ', cor: 1 })
  })
})
