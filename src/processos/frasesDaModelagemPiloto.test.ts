import { expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { fraseDaModelagemNoFuturo } from './frasesDaModelagemPiloto'
import { RECUSAS_DOS_PROCESSOS } from './processosSupabase'
import { falhaDoBanco } from './recusasDoBanco'

test('a frase traz a data recebida e o limite, em dd/mm/aaaa', () => {
  expect(fraseDaModelagemNoFuturo('2026-11-03', '2026-10-29')).toBe(
    'A data da modelagem piloto não pode ser depois de hoje: recebido 03/11/2026, limite 29/10/2026.')
})

test('a recusa do banco vira a mesma frase, com a data recebida e o limite da mensagem', () => {
  const erro = falhaDoBanco({ code: 'P0001', message: 'modelagem_no_futuro:2026-11-03:2026-10-29' }, RECUSAS_DOS_PROCESSOS)
  expect(erro).toBeInstanceOf(TravaDoBanco)
  expect(erro.message).toBe(fraseDaModelagemNoFuturo('2026-11-03', '2026-10-29'))
})
