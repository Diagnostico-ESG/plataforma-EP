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

const GRAVADA = { texto: 'depois', alterado_em: '2026-10-13T17:30:00Z', alterado_por_nome: 'Ana Teste' }

function clienteQueRecusa(erro: { message: string; code?: string }) {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['rpc.gravar_anotacoes_do_processo'] = { data: null, error: erro }
  return cliente
}

test('lerAnotacoes pede o texto, a hora e o nome do autor à tabela de processos, pelo id', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['processos.select'] = {
    data: [{ anotacoes: 'Texto', anotacoes_alteradas_em: '2026-10-13T17:30:00Z', autor: { nome: 'Ana Teste' } }], error: null,
  }
  const lidas = await criar(cliente).lerAnotacoes('p1')
  expect(lidas).toEqual({ texto: 'Texto', alteradoPor: 'Ana Teste', alteradoEm: '2026-10-13T17:30:00Z' })
  expect(cliente.pedidos).toEqual([{
    tabela: 'processos', operacao: 'select', colunas: 'anotacoes, anotacoes_alteradas_em, autor:usuarios(nome)',
    filtro: ['id', 'p1'], filtros: [['id', 'p1']],
  }])
})

test('processo que nunca teve anotação volta com tudo nulo; processo inexistente volta null', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['processos.select'] = {
    data: [{ anotacoes: null, anotacoes_alteradas_em: null, autor: null }], error: null,
  }
  expect(await criar(cliente).lerAnotacoes('p1')).toEqual({ texto: null, alteradoPor: null, alteradoEm: null })
  cliente.respostas['processos.select'] = { data: [], error: null }
  expect(await criar(cliente).lerAnotacoes('p1')).toBeNull()
})

test('a falha de leitura vira erro com a mensagem do banco', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['processos.select'] = { data: null, error: { message: 'sem rede' } }
  await expect(criar(cliente).lerAnotacoes('p1')).rejects.toThrow('Falha ao ler as anotações do processo: sem rede')
})

test('gravarAnotacoes chama a função do banco e devolve o texto gravado com o autor', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['rpc.gravar_anotacoes_do_processo'] = { data: [GRAVADA], error: null }
  const resultado = await criar(cliente).gravarAnotacoes('p1', 'antes', 'depois')
  expect(resultado).toEqual({
    tipo: 'gravado', anotacoes: { texto: 'depois', alteradoPor: 'Ana Teste', alteradoEm: '2026-10-13T17:30:00Z' },
  })
  expect(cliente.pedidos).toEqual([
    { tabela: 'rpc', operacao: 'gravar_anotacoes_do_processo', valores: { p_processo: 'p1', p_esperado: 'antes', p_novo: 'depois' } },
  ])
})

test('sem texto esperado e sem texto novo, os parâmetros vão como null', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['rpc.gravar_anotacoes_do_processo'] = { data: [{ ...GRAVADA, texto: null }], error: null }
  await criar(cliente).gravarAnotacoes('p1', null, null)
  expect(cliente.pedidos[0].valores).toEqual({ p_processo: 'p1', p_esperado: null, p_novo: null })
})

test('resposta sem linha vira erro que diz o recebido e o esperado', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['rpc.gravar_anotacoes_do_processo'] = { data: [], error: null }
  await expect(criar(cliente).gravarAnotacoes('p1', null, 'a')).rejects.toThrow(
    'O banco não devolveu a linha das anotações gravadas: recebido [], esperado uma linha com texto, alterado_em e alterado_por_nome.',
  )
})

test('o conflito não é erro: volta como resultado próprio', async () => {
  const modulo = criar(clienteQueRecusa({ message: 'anotacoes_em_conflito', code: 'P0001' }))
  expect(await modulo.gravarAnotacoes('p1', 'antes', 'depois')).toEqual({ tipo: 'conflito' })
})

const RECUSAS: [string, string, string | undefined, string][] = [
  ['processo arquivado', 'processo_arquivado', 'P0001', 'Este processo está arquivado; desarquive-o para alterar.'],
  ['texto longo demais', 'anotacoes_longas:2001', 'P0001', 'As anotações têm 2.001 caracteres; o limite é 2.000.'],
  ['perfil sem permissão', 'sem permissão para gravar as anotações', '42501', 'Seu perfil não permite alterar os processos.'],
]

test.each(RECUSAS)('%s vira a frase da tela', async (_nome, mensagem, codigo, frase) => {
  const modulo = criar(clienteQueRecusa({ message: mensagem, code: codigo }))
  const falha = await modulo.gravarAnotacoes('p1', null, 'a').catch((erro: unknown) => erro)
  expect(falha).toBeInstanceOf(TravaDoBanco)
  expect((falha as Error).message).toBe(frase)
})

test('processo excluído por outra pessoa vira cadastro inexistente', async () => {
  const modulo = criar(clienteQueRecusa({ message: 'registro_inexistente', code: 'P0001' }))
  expect(await modulo.gravarAnotacoes('p1', null, 'a').catch((erro: unknown) => erro)).toBeInstanceOf(CadastroInexistente)
})
