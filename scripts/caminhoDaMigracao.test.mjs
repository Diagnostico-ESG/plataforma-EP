import { expect, test } from 'vitest'
import { caminhoDaMigracao } from './caminhoDaMigracao.mjs'

test('aceita o formato AAAAMMDDHHMMSS_nome.sql e devolve o caminho dentro de supabase/migrations', () => {
  expect(caminhoDaMigracao('20261013140000_setores_envolvidos.sql'))
    .toBe('supabase/migrations/20261013140000_setores_envolvidos.sql')
})

test.each(['../.env', 'supabase/migrations/20261013140000_a.sql', '20261013140000_A b.sql', 'qualquer.sql', ''])(
  'recusa "%s" dizendo o valor recebido e o formato esperado', (nome) => {
    expect(() => caminhoDaMigracao(nome)).toThrow(`Recebido: "${nome}"`)
    expect(() => caminhoDaMigracao(nome)).toThrow('AAAAMMDDHHMMSS_nome.sql')
  })
