import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { ClienteSupabaseFalso } from '../testes/ClienteSupabaseFalso'
import type { Database } from '../types/database'
import { CadastroInexistente } from './cadastroInexistente'
import { criarCadastrosSupabase } from './cadastrosSupabase'

const NOVO = { nome: 'Núcleo Fictício de Teste', sigla: 'NFT', observacoes: null }

function criar(cliente: ClienteSupabaseFalso) {
  return criarCadastrosSupabase(cliente as unknown as SupabaseClient<Database>)
}

describe('criarCadastrosSupabase', () => {
  test('lista os setores pedindo ao banco a ordem pela sigla', async () => {
    const cliente = new ClienteSupabaseFalso()
    const linha = { id: 's1', sigla: 'NFT', nome: NOVO.nome, observacoes: null, ativo: true }
    cliente.respostas['setores.select'] = { data: [linha], error: null }
    expect(await criar(cliente).listarSetores()).toEqual([linha])
    expect(cliente.pedidos[0]).toMatchObject({ tabela: 'setores', colunas: 'id, sigla, nome, observacoes, ativo',
      ordem: [['sigla', true]] })
  })

  test('falha ao listar vira erro com o motivo do banco', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['setores.select'] = { data: null, error: { message: 'sem conexão' } }
    await expect(criar(cliente).listarSetores()).rejects.toThrow('Falha ao listar os setores: sem conexão')
  })

  test('criar envia nome, sigla e observações à tabela setores', async () => {
    const cliente = new ClienteSupabaseFalso()
    await criar(cliente).criarSetor(NOVO)
    expect(cliente.pedidos[0]).toMatchObject({ tabela: 'setores', operacao: 'insert', valores: NOVO })
  })

  test.each([
    ['23505', 'duplicate key value violates unique constraint "setores_sigla_key"', 'Já existe um setor com a sigla NFT.'],
    ['23505', 'duplicate key value violates unique constraint "setores_nome_unico"',
      'Já existe um setor com o nome Núcleo Fictício de Teste.'],
    ['42501', 'new row violates row-level security policy for table "setores"', 'Seu perfil não permite alterar os cadastros.'],
  ])('a recusa %s (%s) vira a frase pronta da tela', async (code, message, frase) => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['setores.insert'] = { data: null, error: { code, message } }
    const falha = await criar(cliente).criarSetor(NOVO).catch((erro: unknown) => erro)
    expect(falha).toBeInstanceOf(TravaDoBanco)
    expect((falha as Error).message).toBe(frase)
  })

  test('outra falha de gravação vira motivo genérico com a mensagem do banco', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['setores.insert'] = { data: null, error: { code: '08006', message: 'conexão perdida' } }
    const falha = await criar(cliente).criarSetor(NOVO).catch((erro: unknown) => erro)
    expect(falha).not.toBeInstanceOf(TravaDoBanco)
    expect((falha as Error).message).toBe('erro inesperado do banco (conexão perdida)')
  })

  const LINHA = { id: 's1', sigla: 'NFT', nome: NOVO.nome, observacoes: null, ativo: true }
  type Modulo = ReturnType<typeof criar>

  test('ler pede o setor pelo id e devolve a linha', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['setores.select'] = { data: [LINHA], error: null }
    expect(await criar(cliente).lerSetor('s1')).toEqual(LINHA)
    expect(cliente.pedidos[0]).toMatchObject({ tabela: 'setores', filtro: ['id', 's1'] })
  })

  test('ler um setor que não existe devolve null', async () => {
    expect(await criar(new ClienteSupabaseFalso()).lerSetor('sumiu')).toBeNull()
  })

  test('falha ao ler vira erro com o motivo do banco', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['setores.select'] = { data: null, error: { message: 'sem conexão' } }
    await expect(criar(cliente).lerSetor('s1')).rejects.toThrow('Falha ao ler o setor: sem conexão')
  })

  test.each([
    ['editar', (m: Modulo) => m.editarSetor('s1', NOVO), NOVO],
    ['desativar', (m: Modulo) => m.desativarSetor('s1'), { ativo: false }],
    ['reativar', (m: Modulo) => m.reativarSetor('s1'), { ativo: true }],
  ])('%s grava só o que muda, filtrando pelo id', async (_nome, chamar, valores) => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['setores.update'] = { data: [{ id: 's1' }], error: null }
    await chamar(criar(cliente))
    expect(cliente.pedidos[0]).toMatchObject({ tabela: 'setores', operacao: 'update', valores, filtro: ['id', 's1'] })
  })

  test('excluir apaga pelo id', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['setores.delete'] = { data: [{ id: 's1' }], error: null }
    await criar(cliente).excluirSetor('s1')
    expect(cliente.pedidos[0]).toMatchObject({ tabela: 'setores', operacao: 'delete', filtro: ['id', 's1'] })
  })

  test('editar com sigla repetida vira a frase pronta da tela', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['setores.update'] = { data: null, error: { code: '23505',
      message: 'duplicate key value violates unique constraint "setores_sigla_key"' } }
    const falha = await criar(cliente).editarSetor('s1', NOVO).catch((erro: unknown) => erro)
    expect(falha).toBeInstanceOf(TravaDoBanco)
    expect((falha as Error).message).toBe('Já existe um setor com a sigla NFT.')
  })

  test.each([
    ['update', (m: Modulo) => m.desativarSetor('s1')],
    ['delete', (m: Modulo) => m.excluirSetor('s1')],
  ])('%s sem nenhuma linha afetada e setor que sumiu: CadastroInexistente', async (operacao, chamar) => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas[`setores.${operacao}`] = { data: [], error: null }
    cliente.respostas['setores.select'] = { data: [], error: null }
    await expect(chamar(criar(cliente))).rejects.toBeInstanceOf(CadastroInexistente)
  })

  test('nenhuma linha afetada com o setor ainda lá: o perfil não permite', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['setores.update'] = { data: [], error: null }
    cliente.respostas['setores.select'] = { data: [LINHA], error: null }
    const falha = await criar(cliente).desativarSetor('s1').catch((erro: unknown) => erro)
    expect(falha).toBeInstanceOf(TravaDoBanco)
    expect((falha as Error).message).toBe('Seu perfil não permite alterar os cadastros.')
  })
})
