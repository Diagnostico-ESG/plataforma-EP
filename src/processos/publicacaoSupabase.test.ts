import type { SupabaseClient } from '@supabase/supabase-js'
import { expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { ClienteSupabaseFalso } from '../testes/ClienteSupabaseFalso'
import type { Database } from '../types/database'
import { criarProcessosSupabase } from './processosSupabase'

function criar(cliente: ClienteSupabaseFalso) {
  return criarProcessosSupabase(cliente as unknown as SupabaseClient<Database>)
}

async function falhaDe(cliente: ClienteSupabaseFalso, motivo: string): Promise<Error> {
  cliente.respostas['rpc.registrar_publicacao'] = { data: null, error: { message: motivo, code: 'P0001' } }
  return (await criar(cliente).registrarPublicacao('p1', '2026-10-20', null).catch((erro: unknown) => erro)) as Error
}

test('registrar a publicação chama a função do banco com a data e o link', async () => {
  const cliente = new ClienteSupabaseFalso()
  await criar(cliente).registrarPublicacao('p1', '2026-10-20', 'https://diario.exemplo/1')
  expect(cliente.pedidos).toEqual([{
    tabela: 'rpc', operacao: 'registrar_publicacao',
    valores: { p_processo: 'p1', p_data: '2026-10-20', p_link: 'https://diario.exemplo/1' },
  }])
})

test('sem link, o parâmetro não vai', async () => {
  const cliente = new ClienteSupabaseFalso()
  await criar(cliente).registrarPublicacao('p1', '2026-10-20', null)
  expect(cliente.pedidos[0].valores).toEqual({ p_processo: 'p1', p_data: '2026-10-20' })
})

test('as recusas do banco chegam como TravaDoBanco com a frase pronta', async () => {
  const frases: [string, string][] = [
    ['publicacao_fora_da_etapa', 'Registre a publicação com o processo na Publicação ou em Concluídos.'],
    ['data_da_publicacao_obrigatoria', 'Informe a data da publicação.'],
    ['publicacao_antes_da_aprovacao:2026-10-01:2026-10-05', 'A data da publicação 01/10/2026 é anterior à aprovação, em 05/10/2026.'],
    ['link_invalido', 'O link do E-protocolo precisa começar com http:// ou https://.'],
    ['processo_parado:suspenso', 'Este processo está suspenso; retome-o para mudar a etapa, a etiqueta ou o responsável.'],
  ]
  for (const [motivo, frase] of frases) {
    const falha = await falhaDe(new ClienteSupabaseFalso(), motivo)
    expect(falha).toBeInstanceOf(TravaDoBanco)
    expect(falha.message).toBe(frase)
  }
})
