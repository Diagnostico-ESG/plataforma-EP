import { expect, test } from 'vitest'
import { FRASE_SEM_VERSAO } from '../processos/frasesDaVersaoCompleta'
import type { UltimaVersao } from '../processos/tipos'
import { opcoesDaRevisao } from './opcoesDaRevisao'

const PAPEIS: UltimaVersao['papeis'] = ['bpmn', 'png', 'relatorio']
const versao = (numero: number, autorId: string, anterior?: UltimaVersao['anterior']): UltimaVersao =>
  ({ numero, autorId, autorNome: autorId, papeis: PAPEIS, anterior })

test('sem versão, nenhuma opção cabe e a frase manda enviar uma', () => {
  const opcoes = opcoesDaRevisao(null, 'eu')
  expect(opcoes.semAlteracao.disponivel).toBe(false)
  expect(opcoes.corrigida.disponivel).toBe(false)
  expect(opcoes.bloqueio).toBe(FRASE_SEM_VERSAO)
})

test('quem não enviou a versão revisa "sem alteração"; "corrigida" pede a versão corrigida do revisor', () => {
  const opcoes = opcoesDaRevisao(versao(7, 'ana', { numero: 6, autorId: 'ana' }), 'eu')
  expect(opcoes.semAlteracao).toEqual({ disponivel: true, previa: 'segue a V7', motivo: null })
  expect(opcoes.corrigida.disponivel).toBe(false)
  expect(opcoes.corrigida.motivo).toBe(
    'Para marcar como corrigida, a versão mais recente precisa ser sua: envie a versão corrigida em Arquivos.')
  expect(opcoes.bloqueio).toBeNull()
})

test('quem enviou a mais recente só corrige, e só a versão de outra pessoa', () => {
  const opcoes = opcoesDaRevisao(versao(8, 'eu', { numero: 7, autorId: 'ana' }), 'eu')
  expect(opcoes.semAlteracao).toMatchObject({ disponivel: false, motivo: 'Quem enviou a versão V8 não pode revisá-la.' })
  expect(opcoes.corrigida).toEqual({ disponivel: true, previa: 'a V8, enviada por você, corrige a V7', motivo: null })
  expect(opcoes.bloqueio).toBeNull()
})

test('autor das duas versões: nenhuma cabe, e a frase é a da mais recente', () => {
  const opcoes = opcoesDaRevisao(versao(8, 'eu', { numero: 7, autorId: 'eu' }), 'eu')
  expect(opcoes.corrigida).toMatchObject({ disponivel: false, motivo: 'Quem enviou a versão V7 não pode revisá-la.' })
  expect(opcoes.bloqueio).toBe('Quem enviou a versão V8 não pode revisá-la.')
})

test('autor da única versão: não há versão anterior para corrigir', () => {
  const opcoes = opcoesDaRevisao(versao(1, 'eu'), 'eu')
  expect(opcoes.corrigida).toMatchObject({ disponivel: false, motivo: 'Não há versão anterior para corrigir.' })
  expect(opcoes.bloqueio).toBe('Quem enviou a versão V1 não pode revisá-la.')
})
