import { expect, test } from 'vitest'
import { RASCUNHO_DA_APROVACAO_VAZIO, dadosDaAprovacao } from './rascunhoDaAprovacao'

test('sem nada preenchido, os três campos vão como null', () => {
  expect(dadosDaAprovacao(RASCUNHO_DA_APROVACAO_VAZIO)).toEqual({ numeroEprotocolo: null, link: null, aprovadaEm: null })
})

test('número e link vão aparados e a data como veio; só espaços vira null', () => {
  expect(dadosDaAprovacao({ numero: '  PROT-2026-0001 ', link: ' https://eprotocolo.example/a ', data: '2026-10-13' })).toEqual({
    numeroEprotocolo: 'PROT-2026-0001', link: 'https://eprotocolo.example/a', aprovadaEm: '2026-10-13',
  })
  expect(dadosDaAprovacao({ numero: '   ', link: '  ', data: '' })).toEqual({ numeroEprotocolo: null, link: null, aprovadaEm: null })
})
