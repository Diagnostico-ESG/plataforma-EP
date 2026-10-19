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
  cliente.respostas['andamentos.update'] = { data: null, error: erro }
  return cliente
}

test('iniciar grava o status no andamento escolhido', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['andamentos.update'] = { data: [{ id: 'a1' }], error: null }
  await criar(cliente).iniciarEtapa('a1')
  expect(cliente.pedidos.map(({ operacao, valores, filtro }) => [operacao, valores, filtro])).toEqual([
    ['update', { status: 'em_andamento' }, ['id', 'a1']],
  ])
})

test('concluir, dispensar e registrar como realizada anteriormente chamam a função de avanço, com o responsável da próxima', async () => {
  const cliente = new ClienteSupabaseFalso()
  const modulo = criar(cliente)
  await modulo.concluirEtapa('a1', 'u1')
  await modulo.dispensarEtapa('a1', 'Setor já conhecido', null)
  await modulo.registrarRealizadaAnteriormente('a1', 'Feita em 2025', 'u2')
  expect(cliente.pedidos.map(({ tabela, operacao, valores }) => [tabela, operacao, valores])).toEqual([
    ['rpc', 'avancar_etapa', { p_andamento: 'a1', p_acao: 'concluir', p_nota: null, p_responsavel: 'u1' }],
    ['rpc', 'avancar_etapa', { p_andamento: 'a1', p_acao: 'dispensar', p_nota: 'Setor já conhecido', p_responsavel: null }],
    ['rpc', 'avancar_etapa',
      { p_andamento: 'a1', p_acao: 'realizada_anteriormente', p_nota: 'Feita em 2025', p_responsavel: 'u2' }],
  ])
})

test.each([
  ['etapa_obrigatoria:Publicação', 'A etapa Publicação é obrigatória e não pode ser dispensada.'],
  ['responsavel_invalido:Maria Teste',
    'Maria Teste não pode ser responsável: só usuários ativos de perfil Administrador ou Integrante do EP.'],
  ['anterior_nao_resolvida:Reunião de modelagem', 'A etapa Reunião de modelagem ainda não foi resolvida.'],
  ['processo_parado:suspenso', 'Este processo está suspenso; retome-o para registrar o andamento.'],
  ['nota_obrigatoria', 'A nota é obrigatória.'],
])('o avanço recusado pelo banco (%s) vira a frase da spec', async (mensagem, frase) => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['rpc.avancar_etapa'] = { data: null, error: { message: mensagem, code: 'P0001' } }
  const falha = await criar(cliente).concluirEtapa('a1', null).catch((erro: unknown) => erro)
  expect(falha).toBeInstanceOf(TravaDoBanco)
  expect((falha as Error).message).toBe(frase)
})

test('o avanço recusado pela permissão (42501) vira "Seu perfil não permite alterar os processos."', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['rpc.avancar_etapa'] = { data: null, error: { message: 'sem permissão para resolver a etapa', code: '42501' } }
  await expect(criar(cliente).concluirEtapa('a1', null)).rejects.toThrow('Seu perfil não permite alterar os processos.')
})

test('o avanço de uma etapa que já não existe avisa como cadastro inexistente', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['rpc.avancar_etapa'] = { data: null, error: { message: 'registro_inexistente', code: 'P0001' } }
  await expect(criar(cliente).concluirEtapa('a1', null)).rejects.toBeInstanceOf(CadastroInexistente)
})

test('a recusa de sequência vira a frase com o nome da etapa anterior', async () => {
  const cliente = clienteQueRecusa({ message: 'anterior_nao_resolvida:Identificação dos responsáveis', code: 'P0001' })
  const falha = await criar(cliente).iniciarEtapa('a2').catch((erro: unknown) => erro)
  expect(falha).toBeInstanceOf(TravaDoBanco)
  expect((falha as Error).message).toBe('A etapa Identificação dos responsáveis ainda não foi resolvida.')
})

test('segunda etapa em andamento vira a frase com o nome da que está em andamento', async () => {
  const cliente = clienteQueRecusa({ message: 'ja_ha_etapa_em_andamento:Reunião de modelagem', code: 'P0001' })
  await expect(criar(cliente).iniciarEtapa('a5')).rejects
    .toThrow('Já há uma etapa em andamento neste processo: Reunião de modelagem.')
})

test('recusa por perfil (42501) vira "Seu perfil não permite alterar os processos."', async () => {
  const cliente = clienteQueRecusa({ message: 'permission denied for table andamentos', code: '42501' })
  await expect(criar(cliente).iniciarEtapa('a1')).rejects.toThrow('Seu perfil não permite alterar os processos.')
})

test('nada mudou com a etapa ainda legível: a RLS recusou pelo perfil', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['andamentos.update'] = { data: [], error: null }
  cliente.respostas['andamentos.select'] = { data: [{ id: 'a1' }], error: null }
  const falha = await criar(cliente).iniciarEtapa('a1').catch((erro: unknown) => erro)
  expect(falha).toBeInstanceOf(TravaDoBanco)
  expect((falha as Error).message).toBe('Seu perfil não permite alterar os processos.')
})

test('nada mudou e a etapa sumiu (o setor foi excluído): aviso de cadastro inexistente', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['andamentos.update'] = { data: [], error: null }
  await expect(criar(cliente).iniciarEtapa('a1')).rejects.toBeInstanceOf(CadastroInexistente)
})
