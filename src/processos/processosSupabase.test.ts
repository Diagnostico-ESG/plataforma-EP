import type { SupabaseClient } from '@supabase/supabase-js'
import { expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { CadastroInexistente } from '../cadastros/cadastroInexistente'
import { ClienteSupabaseFalso } from '../testes/ClienteSupabaseFalso'
import type { Database } from '../types/database'
import { criarProcessosSupabase } from './processosSupabase'

const RESPONSAVEIS = {
  id: 'a1', status: 'dispensada', nota: 'Nota inventada', iniciada_em: null, resolvida_em: '2026-10-13',
  etapas: { codigo: 'identificacao_responsaveis', nome: 'Identificação dos responsáveis', ordem: 1, obrigatoria: false },
}
const IDENTIFICACAO = {
  id: 'a3', status: 'pendente', nota: null, iniciada_em: null, resolvida_em: null,
  etapas: { codigo: 'identificacao_processos', nome: 'Identificação dos processos', ordem: 3, obrigatoria: true },
}

function criar(cliente: ClienteSupabaseFalso) {
  return criarProcessosSupabase(cliente as unknown as SupabaseClient<Database>)
}

function clienteQueRecusa(erro: { message: string; code?: string }) {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['andamentos.update'] = { data: null, error: erro }
  return cliente
}

test('lê as etapas do setor na ordem do catálogo, com status, nota e datas', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['andamentos.select'] = { data: [IDENTIFICACAO, RESPONSAVEIS], error: null }
  expect(await criar(cliente).lerEtapasDoSetor('s1')).toEqual([
    { id: 'a1', codigo: 'identificacao_responsaveis', nome: 'Identificação dos responsáveis', ordem: 1,
      obrigatoria: false, status: 'dispensada', nota: 'Nota inventada', iniciadaEm: null, resolvidaEm: '2026-10-13' },
    { id: 'a3', codigo: 'identificacao_processos', nome: 'Identificação dos processos', ordem: 3,
      obrigatoria: true, status: 'pendente', nota: null, iniciadaEm: null, resolvidaEm: null },
  ])
  expect(cliente.pedidos[0]).toMatchObject({ tabela: 'andamentos', filtro: ['setor_id', 's1'] })
})

test('falha ao ler vira erro com o motivo do banco', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['andamentos.select'] = { data: null, error: { message: 'sem conexão' } }
  await expect(criar(cliente).lerEtapasDoSetor('s1')).rejects.toThrow('Falha ao ler as etapas do setor: sem conexão')
})

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
