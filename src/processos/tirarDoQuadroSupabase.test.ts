import type { SupabaseClient } from '@supabase/supabase-js'
import { expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { ClienteSupabaseFalso } from '../testes/ClienteSupabaseFalso'
import type { Database } from '../types/database'
import { criarProcessosSupabase } from './processosSupabase'

const criar = (cliente: ClienteSupabaseFalso) => criarProcessosSupabase(cliente as unknown as SupabaseClient<Database>)

test('tirar do Quadro chama tirar_do_quadro com o id; o Desfazer chama voltar_ao_quadro', async () => {
  const cliente = new ClienteSupabaseFalso()
  await criar(cliente).tirarDoQuadro('p1')
  await criar(cliente).voltarAoQuadro('p1')
  expect(cliente.pedidos).toEqual([
    { tabela: 'rpc', operacao: 'tirar_do_quadro', valores: { p_processo: 'p1' } },
    { tabela: 'rpc', operacao: 'voltar_ao_quadro', valores: { p_processo: 'p1' } },
  ])
})

const RECUSAS: [string, string, string, string | undefined][] = [
  ['tirar_do_quadro', 'tirar_do_quadro_so_concluido', 'Só se tira do Quadro o processo concluído.', 'P0001'],
  ['tirar_do_quadro', 'ja_fora_do_quadro', 'Este processo já está fora do Quadro.', 'P0001'],
  ['voltar_ao_quadro', 'voltar_ao_quadro_so_concluido', 'Só se volta ao Quadro o processo concluído.', 'P0001'],
  ['tirar_do_quadro', 'sem permissão para tirar do Quadro', 'Seu perfil não permite alterar os processos.', '42501'],
]

test.each(RECUSAS)('%s: a recusa %s chega como TravaDoBanco com a frase pronta', async (funcao, motivo, frase, codigo) => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas[`rpc.${funcao}`] = { data: null, error: { message: motivo, code: codigo } }
  const modulo = criar(cliente)
  const pedido = funcao === 'tirar_do_quadro' ? modulo.tirarDoQuadro('p1') : modulo.voltarAoQuadro('p1')
  const falha = (await pedido.catch((erro: unknown) => erro)) as Error
  expect(falha).toBeInstanceOf(TravaDoBanco)
  expect(falha.message).toBe(frase)
})
