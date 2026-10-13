import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { ClienteSupabaseFalso } from '../testes/ClienteSupabaseFalso'
import type { Database } from '../types/database'
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
})
