import { expect, test } from 'vitest'
import { linhasDaLista } from './linhasDaLista'
import type { ProcessoDaLista } from './tipos'

function processo(nome: string, mudancas: Partial<ProcessoDaLista> = {}): ProcessoDaLista {
  return {
    id: `p-${nome}`, nome, tipo: 'processo', setorId: 's1', setorSigla: 'TSA', macroprocessoId: 'm1',
    macroprocessoNome: 'Macro Um', processoPaiId: null, situacao: 'em_andamento',
    etapaAtual: { codigo: 'modelagem', nome: 'Reunião de modelagem', ordem: 4, id: 'e', posicao: 1, total: 1 }, responsavel: null,
    ...mudancas,
  }
}

test('sem ordenação escolhida, a ordem é pelo nome do processo, sem diferenciar maiúsculas', () => {
  const linhas = linhasDaLista([
    processo('zeta'), processo('Beta', { setorSigla: 'TSB' }), processo('Alfa', { setorSigla: 'TSB' }), processo('Ômega'),
  ])
  expect(linhas.map((l) => l.nome)).toEqual(['Alfa', 'Beta', 'Ômega', 'zeta'])
})

test('a ordenação escolhida vale', () => {
  const linhas = linhasDaLista([processo('Alfa'), processo('Beta')], undefined, { coluna: 'processo', sentido: 'decrescente' })
  expect(linhas.map((l) => l.nome)).toEqual(['Beta', 'Alfa'])
})

test('o subprocesso traz o nome do pai que está na lista', () => {
  const linhas = linhasDaLista([
    processo('Pai'), processo('Filho', { tipo: 'subprocesso', processoPaiId: 'p-Pai' }),
    processo('Órfão', { tipo: 'subprocesso', processoPaiId: 'p-sumiu' }),
  ])
  expect(linhas.map((l) => [l.nome, l.nomeDoPai])).toEqual([['Órfão', null], ['Pai', null], ['Filho', 'Pai']])
})

test('o pai filtrado fora da Lista continua com o nome ao lado do subprocesso', () => {
  const pai = processo('Pai')
  const filho = processo('Filho', { tipo: 'subprocesso', processoPaiId: 'p-Pai' })
  expect(linhasDaLista([filho], [pai, filho]).map((l) => l.nomeDoPai)).toEqual(['Pai'])
})
