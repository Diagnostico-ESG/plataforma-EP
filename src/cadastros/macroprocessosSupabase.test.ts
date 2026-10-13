import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { ClienteSupabaseFalso } from '../testes/ClienteSupabaseFalso'
import type { Database } from '../types/database'
import { CadastroInexistente } from './cadastroInexistente'
import { criarCadastrosSupabase } from './cadastrosSupabase'
import type { DadosDoMacroprocesso } from './tipos'

const NOVO: DadosDoMacroprocesso = {
  codigo: 'MPT01', nome: 'Planejamento Fictício de Teste', descricao: 'Descrição inventada', categoria: 'apoio',
}
const LINHA = { id: 'm1', ...NOVO, ativo: true }
const COLUNAS = 'id, codigo, nome, descricao, categoria, ativo'

function criar(cliente: ClienteSupabaseFalso) {
  return criarCadastrosSupabase(cliente as unknown as SupabaseClient<Database>)
}
type Modulo = ReturnType<typeof criar>

describe('macroprocessos no módulo real', () => {
  test('lista pedindo ao banco a ordem pelo código, sem código depois, e depois pelo nome', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['macroprocessos.select'] = { data: [LINHA], error: null }
    expect(await criar(cliente).listarMacroprocessos()).toEqual([LINHA])
    expect(cliente.pedidos[0]).toMatchObject({ tabela: 'macroprocessos', colunas: COLUNAS,
      ordem: [['codigo', true, false], ['nome', true]] })
  })

  test('falha ao listar vira erro com o motivo do banco', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['macroprocessos.select'] = { data: null, error: { message: 'sem conexão' } }
    await expect(criar(cliente).listarMacroprocessos()).rejects.toThrow('Falha ao listar os macroprocessos: sem conexão')
  })

  test('criar envia código, nome, descrição e categoria à tabela macroprocessos', async () => {
    const cliente = new ClienteSupabaseFalso()
    await criar(cliente).criarMacroprocesso(NOVO)
    expect(cliente.pedidos[0]).toMatchObject({ tabela: 'macroprocessos', operacao: 'insert', valores: NOVO })
  })

  test.each([
    ['23505', 'duplicate key value violates unique constraint "macroprocessos_nome_unico"',
      'Já existe um macroprocesso com o nome Planejamento Fictício de Teste.'],
    ['23505', 'duplicate key value violates unique constraint "macroprocessos_codigo_key"',
      'Já existe um macroprocesso com o código MPT01.'],
    ['42501', 'new row violates row-level security policy for table "macroprocessos"',
      'Seu perfil não permite alterar os cadastros.'],
  ])('a recusa %s (%s) vira a frase pronta da tela', async (code, message, frase) => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['macroprocessos.insert'] = { data: null, error: { code, message } }
    const falha = await criar(cliente).criarMacroprocesso(NOVO).catch((erro: unknown) => erro)
    expect(falha).toBeInstanceOf(TravaDoBanco)
    expect((falha as Error).message).toBe(frase)
  })

  test('outra falha de gravação vira motivo genérico com a mensagem do banco', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['macroprocessos.insert'] = { data: null, error: { code: '08006', message: 'conexão perdida' } }
    const falha = await criar(cliente).criarMacroprocesso(NOVO).catch((erro: unknown) => erro)
    expect(falha).not.toBeInstanceOf(TravaDoBanco)
    expect((falha as Error).message).toBe('erro inesperado do banco (conexão perdida)')
  })

  test('ler pede o macroprocesso pelo id e devolve a linha', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['macroprocessos.select'] = { data: [LINHA], error: null }
    expect(await criar(cliente).lerMacroprocesso('m1')).toEqual(LINHA)
    expect(cliente.pedidos[0]).toMatchObject({ tabela: 'macroprocessos', filtro: ['id', 'm1'] })
  })

  test('ler um macroprocesso que não existe devolve null', async () => {
    expect(await criar(new ClienteSupabaseFalso()).lerMacroprocesso('sumiu')).toBeNull()
  })

  test('falha ao ler vira erro com o motivo do banco', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['macroprocessos.select'] = { data: null, error: { message: 'sem conexão' } }
    await expect(criar(cliente).lerMacroprocesso('m1')).rejects.toThrow('Falha ao ler o macroprocesso: sem conexão')
  })

  test.each([
    ['editar', (m: Modulo) => m.editarMacroprocesso('m1', NOVO), NOVO],
    ['desativar', (m: Modulo) => m.desativarMacroprocesso('m1'), { ativo: false }],
    ['reativar', (m: Modulo) => m.reativarMacroprocesso('m1'), { ativo: true }],
  ])('%s grava só o que muda, filtrando pelo id', async (_nome, chamar, valores) => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['macroprocessos.update'] = { data: [{ id: 'm1' }], error: null }
    await chamar(criar(cliente))
    expect(cliente.pedidos[0]).toMatchObject({
      tabela: 'macroprocessos', operacao: 'update', valores, filtro: ['id', 'm1'] })
  })

  test('excluir apaga pelo id', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['macroprocessos.delete'] = { data: [{ id: 'm1' }], error: null }
    await criar(cliente).excluirMacroprocesso('m1')
    expect(cliente.pedidos[0]).toMatchObject({ tabela: 'macroprocessos', operacao: 'delete', filtro: ['id', 'm1'] })
  })

  test('editar com código repetido vira a frase pronta da tela', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['macroprocessos.update'] = { data: null, error: { code: '23505',
      message: 'duplicate key value violates unique constraint "macroprocessos_codigo_key"' } }
    const falha = await criar(cliente).editarMacroprocesso('m1', NOVO).catch((erro: unknown) => erro)
    expect(falha).toBeInstanceOf(TravaDoBanco)
    expect((falha as Error).message).toBe('Já existe um macroprocesso com o código MPT01.')
  })

  test.each([
    ['update', (m: Modulo) => m.desativarMacroprocesso('m1')],
    ['delete', (m: Modulo) => m.excluirMacroprocesso('m1')],
  ])('%s sem nenhuma linha afetada e item que sumiu: CadastroInexistente', async (operacao, chamar) => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas[`macroprocessos.${operacao}`] = { data: [], error: null }
    cliente.respostas['macroprocessos.select'] = { data: [], error: null }
    await expect(chamar(criar(cliente))).rejects.toBeInstanceOf(CadastroInexistente)
  })

  test('nenhuma linha afetada com o item ainda lá: o perfil não permite', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['macroprocessos.update'] = { data: [], error: null }
    cliente.respostas['macroprocessos.select'] = { data: [LINHA], error: null }
    const falha = await criar(cliente).desativarMacroprocesso('m1').catch((erro: unknown) => erro)
    expect(falha).toBeInstanceOf(TravaDoBanco)
    expect((falha as Error).message).toBe('Seu perfil não permite alterar os cadastros.')
  })
})
