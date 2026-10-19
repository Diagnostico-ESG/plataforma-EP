import type { SupabaseClient } from '@supabase/supabase-js'
import { expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { CadastroInexistente } from '../cadastros/cadastroInexistente'
import { RECUSAS_DOS_PROCESSOS } from '../processos/processosSupabase'
import { ClienteSupabaseFalso } from '../testes/ClienteSupabaseFalso'
import type { Database } from '../types/database'
import { criarRevisoesSupabase } from './revisoesSupabase'

function criar(cliente: ClienteSupabaseFalso) {
  return criarRevisoesSupabase(cliente as unknown as SupabaseClient<Database>, RECUSAS_DOS_PROCESSOS)
}

function clienteQueRecusa(erro: { message: string; code?: string }) {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['rpc.concluir_revisao_interna'] = { data: null, error: erro }
  return cliente
}

const DADOS = { resultado: 'corrigida', escopo: 'ambos', comentario: 'Ajustei' } as const

test('listar lê as revisões do processo, da mais recente para a mais antiga, com o revisor e as versões', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['revisoes_internas.select'] = {
    data: [
      { id: 'r2', resultado: 'corrigida', escopo: 'ambos', comentario: 'Ajustei', revisada_em: '2026-10-13',
        revisor: { nome: 'Bia Teste' }, revisada: { numero: 7 }, corrigida: { numero: 8 } },
      { id: 'r1', resultado: 'sem_alteracao', escopo: null, comentario: null, revisada_em: '2026-10-12',
        revisor: null, revisada: { numero: 6 }, corrigida: null },
    ],
    error: null,
  }
  const revisoes = await criar(cliente).listarRevisoes('p1')
  expect(revisoes).toEqual([
    { id: 'r2', versaoRevisada: 7, versaoCorrigida: 8, resultado: 'corrigida', escopo: 'ambos', comentario: 'Ajustei',
      revisor: 'Bia Teste', revisadaEm: '2026-10-13' },
    { id: 'r1', versaoRevisada: 6, versaoCorrigida: null, resultado: 'sem_alteracao', escopo: null, comentario: null,
      revisor: null, revisadaEm: '2026-10-12' },
  ])
  expect(cliente.pedidos[0]).toMatchObject({
    tabela: 'revisoes_internas', filtros: [['processo_id', 'p1']], ordem: [['registrada_em', false]],
  })
})

test('falha ao ler as revisões vira erro com o processo e o motivo do banco', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['revisoes_internas.select'] = { data: null, error: { message: 'sem conexão' } }
  await expect(criar(cliente).listarRevisoes('p1')).rejects.toThrow('Falha ao ler as revisões do processo p1: sem conexão')
})

test('concluir chama a função do banco com o andamento, o resultado e o responsável', async () => {
  const cliente = new ClienteSupabaseFalso()
  await criar(cliente).concluirRevisaoInterna('a3', DADOS, 'u2')
  expect(cliente.pedidos).toEqual([{
    tabela: 'rpc', operacao: 'concluir_revisao_interna',
    valores: { p_andamento: 'a3', p_resultado: 'corrigida', p_escopo: 'ambos', p_comentario: 'Ajustei', p_responsavel: 'u2' },
  }])
})

test('sem escopo, comentário e responsável, vão como null', async () => {
  const cliente = new ClienteSupabaseFalso()
  await criar(cliente).concluirRevisaoInterna('a3', { resultado: 'sem_alteracao', escopo: null, comentario: null }, null)
  expect(cliente.pedidos[0].valores).toEqual({
    p_andamento: 'a3', p_resultado: 'sem_alteracao', p_escopo: null, p_comentario: null, p_responsavel: null,
  })
})

test('o autor da versão recusado pelo banco vira a frase da tela', async () => {
  const cliente = clienteQueRecusa({ message: 'revisor_e_autor:7', code: 'P0001' })
  const falha = await criar(cliente).concluirRevisaoInterna('a3', DADOS, null).catch((erro: unknown) => erro)
  expect(falha).toBeInstanceOf(TravaDoBanco)
  expect((falha as Error).message).toBe('Quem enviou a versão V7 não pode revisá-la.')
})

test('falta de privilégio vira a frase do perfil', async () => {
  const cliente = clienteQueRecusa({ message: 'sem permissão para registrar a revisão', code: '42501' })
  const falha = await criar(cliente).concluirRevisaoInterna('a3', DADOS, null).catch((erro: unknown) => erro)
  expect(falha).toBeInstanceOf(TravaDoBanco)
  expect((falha as Error).message).toBe('Seu perfil não permite alterar os processos.')
})

test('etapa que já não existe vira o aviso de cadastro inexistente', async () => {
  const cliente = clienteQueRecusa({ message: 'registro_inexistente', code: 'P0001' })
  const falha = await criar(cliente).concluirRevisaoInterna('a3', DADOS, null).catch((erro: unknown) => erro)
  expect(falha).toBeInstanceOf(CadastroInexistente)
})
