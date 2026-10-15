import { expect, test } from 'vitest'
import { responsaveisDaEscolha, usuariosDaEscolha } from './participantesDaEscolha'
import type { ResponsavelDaReuniao, UsuarioDaReuniao } from './tipos'

const ATIVOS: UsuarioDaReuniao[] = [
  { id: 'u1', nome: 'Ana Teste', ativo: true },
  { id: 'u3', nome: 'Dani Teste', ativo: true },
]

test('sem usuários marcados na reunião, só os ativos', () => {
  expect(usuariosDaEscolha(ATIVOS, [])).toEqual(ATIVOS)
})

test('o usuário já marcado que ficou inativo entra na lista, marcado como inativo, na ordem do nome', () => {
  const inativo: UsuarioDaReuniao = { id: 'u2', nome: 'Caio Teste', ativo: false }
  expect(usuariosDaEscolha(ATIVOS, [inativo])).toEqual([ATIVOS[0], inativo, ATIVOS[1]])
})

test('o usuário já marcado que continua ativo não se repete', () => {
  expect(usuariosDaEscolha(ATIVOS, [ATIVOS[0]])).toEqual(ATIVOS)
})

const DO_SETOR: ResponsavelDaReuniao[] = [{ id: 'x1', nome: 'Bia Teste' }, { id: 'x3', nome: 'Edu Teste' }]

test('o responsável já marcado que saiu da lista do setor continua na escolha, na ordem do nome', () => {
  const saiu: ResponsavelDaReuniao = { id: 'x2', nome: 'Dani Teste' }
  expect(responsaveisDaEscolha(DO_SETOR, [saiu])).toEqual([DO_SETOR[0], saiu, DO_SETOR[1]])
})

test('o responsável já marcado que ainda está na lista do setor não se repete', () => {
  expect(responsaveisDaEscolha(DO_SETOR, [DO_SETOR[1]])).toEqual(DO_SETOR)
})
