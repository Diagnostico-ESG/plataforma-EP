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

test('cada ação grava o status, e a nota quando há, no andamento escolhido', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['andamentos.update'] = { data: [{ id: 'a1' }], error: null }
  const modulo = criar(cliente)
  await modulo.iniciarEtapa('a1')
  await modulo.concluirEtapa('a1')
  await modulo.dispensarEtapa('a1', 'Setor já conhecido')
  await modulo.registrarRealizadaAnteriormente('a1', 'Feita em 2025')
  expect(cliente.pedidos.map(({ operacao, valores, filtro }) => [operacao, valores, filtro])).toEqual([
    ['update', { status: 'em_andamento' }, ['id', 'a1']],
    ['update', { status: 'concluida' }, ['id', 'a1']],
    ['update', { status: 'dispensada', nota: 'Setor já conhecido' }, ['id', 'a1']],
    ['update', { status: 'realizada_anteriormente', nota: 'Feita em 2025' }, ['id', 'a1']],
  ])
})

test('a recusa de sequência vira a frase com o nome da etapa anterior', async () => {
  const cliente = clienteQueRecusa({ message: 'anterior_nao_resolvida:Identificação dos responsáveis', code: 'P0001' })
  const falha = await criar(cliente).iniciarEtapa('a2').catch((erro: unknown) => erro)
  expect(falha).toBeInstanceOf(TravaDoBanco)
  expect((falha as Error).message).toBe('A etapa Identificação dos responsáveis ainda não foi resolvida.')
})

test('dispensar etapa obrigatória vira a frase da spec', async () => {
  const cliente = clienteQueRecusa({ message: 'etapa_obrigatoria:Identificação dos processos', code: 'P0001' })
  await expect(criar(cliente).dispensarEtapa('a3', 'Não se aplica')).rejects
    .toThrow('A etapa Identificação dos processos é obrigatória e não pode ser dispensada.')
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
  const falha = await criar(cliente).concluirEtapa('a1').catch((erro: unknown) => erro)
  expect(falha).toBeInstanceOf(TravaDoBanco)
  expect((falha as Error).message).toBe('Seu perfil não permite alterar os processos.')
})

test('nada mudou e a etapa sumiu (o setor foi excluído): aviso de cadastro inexistente', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['andamentos.update'] = { data: [], error: null }
  await expect(criar(cliente).concluirEtapa('a1')).rejects.toBeInstanceOf(CadastroInexistente)
})
