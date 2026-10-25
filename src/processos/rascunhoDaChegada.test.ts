import { expect, test } from 'vitest'
import { chegadaCompleta, dadosDaChegada, rascunhoDaChegadaVazio } from './rascunhoDaChegada'

test('o rascunho novo não tem opção marcada, traz hoje na data e não está completo', () => {
  const vazio = rascunhoDaChegadaVazio('2026-10-24')
  expect(vazio).toEqual({ opcao: null, data: '2026-10-24', link: '', explicacao: '' })
  expect(chegadaCompleta(vazio)).toBe(false)
})

test('"Publicado" está completo com a data; sem data, não', () => {
  const publicado = { ...rascunhoDaChegadaVazio('2026-10-24'), opcao: 'publicado' as const }
  expect(chegadaCompleta(publicado)).toBe(true)
  expect(chegadaCompleta({ ...publicado, data: '' })).toBe(false)
})

test('"Concluir sem publicação" só está completo com texto na explicação, e espaços não contam', () => {
  const sem = { ...rascunhoDaChegadaVazio(), opcao: 'sem_publicacao' as const }
  expect(chegadaCompleta(sem)).toBe(false)
  expect(chegadaCompleta({ ...sem, explicacao: '   ' })).toBe(false)
  expect(chegadaCompleta({ ...sem, explicacao: 'Não será divulgado' })).toBe(true)
})

test('os dados da chegada levam só os campos da opção escolhida, com o link vazio virando nulo', () => {
  const base = { data: '2026-10-20', link: ' https://diario.exemplo/1 ', explicacao: '  Motivo  ' }
  expect(dadosDaChegada({ ...base, opcao: 'publicado' }))
    .toEqual({ dataDaPublicacao: '2026-10-20', linkDaPublicacao: 'https://diario.exemplo/1', explicacao: null })
  expect(dadosDaChegada({ ...base, opcao: 'publicado', link: '  ' }).linkDaPublicacao).toBeNull()
  expect(dadosDaChegada({ ...base, opcao: 'sem_publicacao' }))
    .toEqual({ dataDaPublicacao: null, linkDaPublicacao: null, explicacao: 'Motivo' })
})
