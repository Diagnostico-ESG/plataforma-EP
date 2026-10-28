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
  test('lista os setores com a quantidade de macroprocessos, pedindo ao banco a ordem pela sigla', async () => {
    const cliente = new ClienteSupabaseFalso()
    const linha = { id: 's1', sigla: 'NFT', nome: NOVO.nome, observacoes: null, ativo: true, cor: 3 }
    const outra = { ...linha, id: 's2', sigla: 'OUT' }
    cliente.respostas['setores.select'] = { data: [
      { ...linha, setores_envolvidos: [{ count: 2 }] }, { ...outra, setores_envolvidos: [] }], error: null }
    expect(await criar(cliente).listarSetores()).toEqual([
      { ...linha, quantidadeDeMacroprocessos: 2 }, { ...outra, quantidadeDeMacroprocessos: 0 }])
    expect(cliente.pedidos[0]).toMatchObject({ tabela: 'setores',
      colunas: 'id, sigla, nome, observacoes, ativo, cor, setores_envolvidos(count)', ordem: [['sigla', true]] })
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
    // A cor é escolhida pelo banco (gatilho da primeira cor livre).
    expect(cliente.pedidos[0].valores).not.toHaveProperty('cor')
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

  const LINHA = { id: 's1', sigla: 'NFT', nome: NOVO.nome, observacoes: null, ativo: true, cor: 3 }
  const LINHA_LIDA = { ...LINHA, setores_envolvidos: [] }
  type Modulo = ReturnType<typeof criar>

  test('ler pede o setor pelo id e devolve a linha com os macroprocessos na ordem da lista', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['setores.select'] = { data: [{ ...LINHA, setores_envolvidos: [
      { observacao: 'Papel B', macroprocessos: { id: 'm2', codigo: null, nome: 'Beta Fictício' } },
      { observacao: null, macroprocessos: { id: 'm1', codigo: 'MPT01', nome: 'Alfa Fictício' } },
    ] }], error: null }
    expect(await criar(cliente).lerSetor('s1')).toEqual({ ...LINHA, macroprocessos: [
      { id: 'm1', codigo: 'MPT01', nome: 'Alfa Fictício', observacao: null },
      { id: 'm2', codigo: null, nome: 'Beta Fictício', observacao: 'Papel B' },
    ] })
    expect(cliente.pedidos[0]).toMatchObject({ tabela: 'setores', filtro: ['id', 's1'],
      colunas: 'id, sigla, nome, observacoes, ativo, cor, setores_envolvidos(observacao, macroprocessos(id, codigo, nome))' })
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

  test('editar envia a cor escolhida junto com o resto do setor', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['setores.update'] = { data: [{ id: 's1' }], error: null }
    await criar(cliente).editarSetor('s1', { ...NOVO, cor: 7 })
    expect(cliente.pedidos[0]).toMatchObject({ operacao: 'update', valores: { ...NOVO, cor: 7 } })
  })

  test('excluir apaga pelo id', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['setores.delete'] = { data: [{ id: 's1' }], error: null }
    await criar(cliente).excluirSetor('s1')
    expect(cliente.pedidos[0]).toMatchObject({ tabela: 'setores', operacao: 'delete', filtro: ['id', 's1'] })
  })

  test('excluir setor com processos vira a frase com a quantidade', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['setores.delete'] = { data: null, error: { code: 'P0001', message: 'setor_com_processos:2' } }
    const falha = await criar(cliente).excluirSetor('s1').catch((erro: unknown) => erro)
    expect(falha).toBeInstanceOf(TravaDoBanco)
    expect((falha as Error).message).toBe('Não é possível excluir: setor tem 2 processos ligados.')
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
    cliente.respostas['setores.select'] = { data: [LINHA_LIDA], error: null }
    const falha = await criar(cliente).desativarSetor('s1').catch((erro: unknown) => erro)
    expect(falha).toBeInstanceOf(TravaDoBanco)
    expect((falha as Error).message).toBe('Seu perfil não permite alterar os cadastros.')
  })
})
