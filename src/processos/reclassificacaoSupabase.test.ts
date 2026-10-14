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

function clienteQueRecusa(erro: { message: string; code?: string }) {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['rpc.reclassificar_processo'] = { data: null, error: erro }
  return cliente
}

async function falhaDe(promessa: Promise<void>): Promise<Error> {
  return (await promessa.catch((erro: unknown) => erro)) as Error
}

const PARA_SUBPROCESSO = { tipo: 'subprocesso', processoPaiId: 'p0' } as const

test('reclassificar chama a função do banco com o processo, o tipo novo, o pai e o motivo', async () => {
  const cliente = new ClienteSupabaseFalso()
  const modulo = criar(cliente)
  await modulo.reclassificarProcesso('p1', PARA_SUBPROCESSO, 'Faz parte do pai')
  await modulo.reclassificarProcesso('p2', { tipo: 'processo', processoPaiId: null }, 'Virou processo')
  expect(cliente.pedidos).toEqual([
    { tabela: 'rpc', operacao: 'reclassificar_processo',
      valores: { p_processo: 'p1', p_tipo: 'subprocesso', p_pai: 'p0', p_motivo: 'Faz parte do pai' } },
    { tabela: 'rpc', operacao: 'reclassificar_processo',
      valores: { p_processo: 'p2', p_tipo: 'processo', p_pai: null, p_motivo: 'Virou processo' } },
  ])
})

test.each([
  ['processo_com_subprocessos:2', 'Este processo tem 2 subprocessos; reclassifique-os ou exclua-os antes.'],
  ['pai_nao_e_processo', 'O processo pai precisa ser do tipo Processo.'],
  ['tipo_invalido:processo:a_classificar', 'Um item do tipo Processo não pode ser reclassificado como A classificar.'],
  ['motivo_obrigatorio', 'O motivo é obrigatório.'],
])('a recusa "%s" do banco vira a frase "%s"', async (mensagem, frase) => {
  const falha = await falhaDe(criar(clienteQueRecusa({ message: mensagem, code: 'P0001' }))
    .reclassificarProcesso('p1', PARA_SUBPROCESSO, 'Motivo'))
  expect(falha).toBeInstanceOf(TravaDoBanco)
  expect(falha.message).toBe(frase)
})

test('a reclassificação recusada pela permissão (42501) vira "Seu perfil não permite alterar os processos."', async () => {
  const cliente = clienteQueRecusa({ message: 'sem permissão para reclassificar o processo', code: '42501' })
  const falha = await falhaDe(criar(cliente).reclassificarProcesso('p1', PARA_SUBPROCESSO, 'Motivo'))
  expect(falha.message).toContain('Seu perfil não permite alterar os processos.')
})

test('processo que já não existe vira o aviso de cadastro inexistente', async () => {
  const cliente = clienteQueRecusa({ message: 'registro_inexistente', code: 'P0001' })
  expect(await falhaDe(criar(cliente).reclassificarProcesso('p1', PARA_SUBPROCESSO, 'Motivo')))
    .toBeInstanceOf(CadastroInexistente)
})
