import { expect, test } from 'vitest'
import type { LinhaDaLista } from './linhasDaLista'
import { ordenarLinhas, type OrdenacaoDaLista } from './ordenacaoDaLista'

function linha(nome: string, mudancas: Partial<LinhaDaLista> = {}): LinhaDaLista {
  return {
    id: `p-${nome}`, nome, tipo: 'processo', setorId: 's1', setorSigla: 'TSA', macroprocessoId: 'm1',
    macroprocessoNome: 'Macro Um', processoPaiId: null, situacao: 'em_andamento', nomeDoPai: null,
    etapaAtual: { codigo: 'modelagem', nome: 'Modelagem piloto', ordem: 4, id: 'e', posicao: 1, total: 1 }, responsavel: null,
    ...mudancas,
  }
}

const nomes = (linhas: LinhaDaLista[], ordenacao: OrdenacaoDaLista) => ordenarLinhas(linhas, ordenacao).map((l) => l.nome)
const etapa = (nome: string, ordem: number) => ({ codigo: nome, nome, ordem, id: nome, posicao: 1, total: 1 })
const pessoa = (nome: string) => ({ id: nome, nome, fotoUrl: null })

test('Processo em ordem alfabética, sem diferenciar maiúsculas e acentos, nos dois sentidos', () => {
  const linhas = [linha('zeta'), linha('Ômega'), linha('alfa')]
  expect(nomes(linhas, { coluna: 'processo', sentido: 'crescente' })).toEqual(['alfa', 'Ômega', 'zeta'])
  expect(nomes(linhas, { coluna: 'processo', sentido: 'decrescente' })).toEqual(['zeta', 'Ômega', 'alfa'])
})

test('Tipo pelo rótulo: A classificar, Processo, Subprocesso', () => {
  const linhas = [linha('a', { tipo: 'subprocesso' }), linha('b', { tipo: 'processo' }), linha('c', { tipo: 'a_classificar' })]
  expect(nomes(linhas, { coluna: 'tipo', sentido: 'crescente' })).toEqual(['c', 'b', 'a'])
})

test('Setor pela sigla e Macroprocesso pelo nome', () => {
  const linhas = [linha('a', { setorSigla: 'TSB', macroprocessoNome: 'Alfa' }), linha('b', { setorSigla: 'TSA', macroprocessoNome: 'Beta' })]
  expect(nomes(linhas, { coluna: 'setor', sentido: 'crescente' })).toEqual(['b', 'a'])
  expect(nomes(linhas, { coluna: 'macroprocesso', sentido: 'crescente' })).toEqual(['a', 'b'])
})

test('Etapa atual pela ordem do catálogo, e sem etapa por último nos dois sentidos', () => {
  const linhas = [linha('a', { etapaAtual: etapa('Validação', 5) }), linha('b', { etapaAtual: null }), linha('c', { etapaAtual: etapa('Zona', 2) })]
  expect(nomes(linhas, { coluna: 'etapa', sentido: 'crescente' })).toEqual(['c', 'a', 'b'])
  expect(nomes(linhas, { coluna: 'etapa', sentido: 'decrescente' })).toEqual(['a', 'c', 'b'])
})

test('Responsável pelo nome, e sem responsável por último nos dois sentidos', () => {
  const linhas = [linha('a', { responsavel: null }), linha('b', { responsavel: pessoa('Zé') }), linha('c', { responsavel: pessoa('Ana') })]
  expect(nomes(linhas, { coluna: 'responsavel', sentido: 'crescente' })).toEqual(['c', 'b', 'a'])
  expect(nomes(linhas, { coluna: 'responsavel', sentido: 'decrescente' })).toEqual(['b', 'c', 'a'])
})

test('Situação: em andamento, suspenso, concluído; decrescente inverte', () => {
  const linhas = [linha('a', { situacao: 'concluido' }), linha('b', { situacao: 'em_andamento' }), linha('c', { situacao: 'suspenso' })]
  expect(nomes(linhas, { coluna: 'situacao', sentido: 'crescente' })).toEqual(['b', 'c', 'a'])
  expect(nomes(linhas, { coluna: 'situacao', sentido: 'decrescente' })).toEqual(['a', 'c', 'b'])
})

test('empate desempata pelo nome em ordem crescente', () => {
  const linhas = [linha('Zeta'), linha('Alfa')]
  expect(nomes(linhas, { coluna: 'setor', sentido: 'decrescente' })).toEqual(['Alfa', 'Zeta'])
})

test('o subprocesso vem logo depois do pai, em qualquer ordenação', () => {
  const linhas = [linha('Alfa', { processoPaiId: 'p-Zeta', tipo: 'subprocesso', setorSigla: 'TSZ' }), linha('Zeta'), linha('Beta')]
  expect(nomes(linhas, { coluna: 'processo', sentido: 'crescente' })).toEqual(['Beta', 'Zeta', 'Alfa'])
  expect(nomes(linhas, { coluna: 'setor', sentido: 'crescente' })).toEqual(['Beta', 'Zeta', 'Alfa'])
})

test('o subprocesso cujo pai não está nas linhas entra na ordem normal', () => {
  const linhas = [linha('Zeta'), linha('Alfa', { processoPaiId: 'p-sumiu', tipo: 'subprocesso' })]
  expect(nomes(linhas, { coluna: 'processo', sentido: 'crescente' })).toEqual(['Alfa', 'Zeta'])
})
