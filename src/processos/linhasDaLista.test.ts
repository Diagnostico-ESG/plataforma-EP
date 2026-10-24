import { expect, test } from 'vitest'
import { linhasDaLista, textoDaEtapaAtual } from './linhasDaLista'
import type { ProcessoDaLista } from './tipos'

function processo(nome: string, mudancas: Partial<ProcessoDaLista> = {}): ProcessoDaLista {
  return {
    id: `p-${nome}`, nome, tipo: 'processo', setorId: 's1', setorSigla: 'TSA', macroprocessoId: 'm1',
    macroprocessoNome: 'Macro Um', processoPaiId: null, situacao: 'em_andamento',
    etapaAtual: { codigo: 'modelagem', nome: 'Reunião de modelagem', ordem: 4, id: 'e', posicao: 1, total: 1 }, responsavel: null,
    ...mudancas,
  }
}

test('ordem pela sigla do setor e depois pelo nome, sem diferenciar maiúsculas', () => {
  const linhas = linhasDaLista([
    processo('zeta'), processo('Beta', { setorSigla: 'TSB' }), processo('Alfa', { setorSigla: 'TSB' }), processo('Ômega'),
  ])
  expect(linhas.map((l) => `${l.setorSigla} ${l.nome}`)).toEqual(['TSA Ômega', 'TSA zeta', 'TSB Alfa', 'TSB Beta'])
})

test('o subprocesso traz o nome do pai que está na lista', () => {
  const linhas = linhasDaLista([
    processo('Pai'), processo('Filho', { tipo: 'subprocesso', processoPaiId: 'p-Pai' }),
    processo('Órfão', { tipo: 'subprocesso', processoPaiId: 'p-sumiu' }),
  ])
  expect(linhas.map((l) => [l.nome, l.nomeDoPai])).toEqual([['Filho', 'Pai'], ['Órfão', null], ['Pai', null]])
})

test('o pai filtrado fora da Lista continua com o nome ao lado do subprocesso', () => {
  const pai = processo('Pai')
  const filho = processo('Filho', { tipo: 'subprocesso', processoPaiId: 'p-Pai' })
  expect(linhasDaLista([filho], [pai, filho]).map((l) => l.nomeDoPai)).toEqual(['Pai'])
})

test('texto da etapa atual: o nome da etapa ou "—"', () => {
  expect(textoDaEtapaAtual(processo('B'))).toBe('Reunião de modelagem')
  expect(textoDaEtapaAtual(processo('C', { etapaAtual: null }))).toBe('—')
})
