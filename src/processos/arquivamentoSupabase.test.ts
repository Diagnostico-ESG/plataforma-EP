import type { SupabaseClient } from '@supabase/supabase-js'
import { expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { ClienteSupabaseFalso } from '../testes/ClienteSupabaseFalso'
import type { Database } from '../types/database'
import { criarProcessosSupabase } from './processosSupabase'

function criar(cliente: ClienteSupabaseFalso) {
  return criarProcessosSupabase(cliente as unknown as SupabaseClient<Database>)
}

function clienteQueRecusa(funcao: string, erro: { message: string; code?: string }) {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas[`rpc.${funcao}`] = { data: null, error: erro }
  return cliente
}

async function falhaDe(promessa: Promise<void>): Promise<Error> {
  return (await promessa.catch((erro: unknown) => erro)) as Error
}

test('arquivar e desarquivar chamam a função do banco só com o processo', async () => {
  const cliente = new ClienteSupabaseFalso()
  const modulo = criar(cliente)
  await modulo.arquivar('p1')
  await modulo.desarquivar('p1')
  expect(cliente.pedidos).toEqual([
    { tabela: 'rpc', operacao: 'arquivar_processo', valores: { p_processo: 'p1' } },
    { tabela: 'rpc', operacao: 'desarquivar_processo', valores: { p_processo: 'p1' } },
  ])
})

test('arquivar o que não está concluído, suspenso nem cancelado vira a frase do banco', async () => {
  const cliente = clienteQueRecusa('arquivar_processo', { message: 'arquivar_so_concluido:em_andamento', code: 'P0001' })
  const falha = await falhaDe(criar(cliente).arquivar('p1'))
  expect(falha).toBeInstanceOf(TravaDoBanco)
  expect(falha.message).toBe('Só se arquiva processo concluído, suspenso ou cancelado.')
})

test('arquivar o que já está arquivado e desarquivar o que não está viram as frases do banco', async () => {
  const jaArquivado = clienteQueRecusa('arquivar_processo', { message: 'ja_arquivado', code: 'P0001' })
  expect((await falhaDe(criar(jaArquivado).arquivar('p1'))).message).toBe('Este processo já está arquivado.')
  const naoArquivado = clienteQueRecusa('desarquivar_processo', { message: 'nao_arquivado', code: 'P0001' })
  expect((await falhaDe(criar(naoArquivado).desarquivar('p1'))).message).toBe('Este processo não está arquivado.')
})
