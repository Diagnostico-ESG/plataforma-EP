import type { SupabaseClient } from '@supabase/supabase-js'
import { expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { CadastroInexistente } from '../cadastros/cadastroInexistente'
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

test('suspender, cancelar e retomar chamam a função do banco com o processo e o motivo', async () => {
  const cliente = new ClienteSupabaseFalso()
  const modulo = criar(cliente)
  await modulo.suspenderProcesso('p1', 'Aguardando decisão')
  await modulo.cancelarProcesso('p1', 'Não será mapeado')
  await modulo.retomarProcesso('p1', 'Decisão tomada')
  expect(cliente.pedidos).toEqual([
    { tabela: 'rpc', operacao: 'suspender_processo', valores: { p_processo: 'p1', p_motivo: 'Aguardando decisão' } },
    { tabela: 'rpc', operacao: 'cancelar_processo', valores: { p_processo: 'p1', p_motivo: 'Não será mapeado' } },
    { tabela: 'rpc', operacao: 'retomar_processo', valores: { p_processo: 'p1', p_motivo: 'Decisão tomada' } },
  ])
})

test('sem motivo, a recusa do banco vira "O motivo é obrigatório."', async () => {
  const cliente = clienteQueRecusa('suspender_processo', { message: 'motivo_obrigatorio', code: 'P0001' })
  const falha = await falhaDe(criar(cliente).suspenderProcesso('p1', ' '))
  expect(falha).toBeInstanceOf(TravaDoBanco)
  expect(falha.message).toBe('O motivo é obrigatório.')
})

test('a transição que o banco recusa vira a frase com a situação recebida', async () => {
  const mesma = clienteQueRecusa('suspender_processo', { message: 'situacao_invalida:suspenso:suspenso', code: 'P0001' })
  expect((await falhaDe(criar(mesma).suspenderProcesso('p1', 'Motivo'))).message).toBe('Este processo já está suspenso.')
  const cancelado = clienteQueRecusa('suspender_processo', { message: 'situacao_invalida:cancelado:suspenso', code: 'P0001' })
  expect((await falhaDe(criar(cancelado).suspenderProcesso('p1', 'Motivo'))).message)
    .toBe('Um processo cancelado não pode passar a suspenso.')
})

test('etapa de processo parado vira "Este processo está {situação}; retome-o para registrar o andamento."', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['andamentos.update'] = { data: null, error: { message: 'processo_parado:suspenso', code: 'P0001' } }
  const falha = await falhaDe(criar(cliente).iniciarEtapa('a4'))
  expect(falha).toBeInstanceOf(TravaDoBanco)
  expect(falha.message).toBe('Este processo está suspenso; retome-o para registrar o andamento.')
})

test('a situação recusada pela permissão (42501) vira "Seu perfil não permite alterar os processos."', async () => {
  const cliente = clienteQueRecusa('cancelar_processo', { message: 'sem permissão para mudar a situação do processo', code: '42501' })
  const falha = await falhaDe(criar(cliente).cancelarProcesso('p1', 'Motivo'))
  expect(falha.message).toContain('Seu perfil não permite alterar os processos.')
})

test('processo que já não existe vira o aviso de cadastro inexistente', async () => {
  const cliente = clienteQueRecusa('retomar_processo', { message: 'registro_inexistente', code: 'P0001' })
  expect(await falhaDe(criar(cliente).retomarProcesso('p1', 'Motivo'))).toBeInstanceOf(CadastroInexistente)
})
