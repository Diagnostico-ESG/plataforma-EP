import { expect, test } from 'vitest'
import { dadosDaPublicacao, rascunhoDaPublicacao } from './rascunhoDaPublicacao'

test('sem publicação registrada, a janela vem com hoje e sem link', () => {
  expect(rascunhoDaPublicacao({ publicadoEm: null, linkDaPublicacao: null }, '2026-10-24')).toEqual({ data: '2026-10-24', link: '' })
})

test('com a publicação registrada, a janela vem preenchida com a data e o link', () => {
  expect(rascunhoDaPublicacao({ publicadoEm: '2026-10-05', linkDaPublicacao: 'https://diario.exemplo/1' }, '2026-10-24'))
    .toEqual({ data: '2026-10-05', link: 'https://diario.exemplo/1' })
})

test('os dados que vão ao banco: o link aparado, e o vazio vira nulo', () => {
  expect(dadosDaPublicacao({ data: '2026-10-05', link: ' https://x.exemplo ' })).toEqual({ data: '2026-10-05', link: 'https://x.exemplo' })
  expect(dadosDaPublicacao({ data: '2026-10-05', link: '   ' })).toEqual({ data: '2026-10-05', link: null })
})
