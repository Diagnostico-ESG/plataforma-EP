import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { CadastroInexistente } from '../cadastros/cadastroInexistente'
import { ClienteSupabaseFalso } from '../testes/ClienteSupabaseFalso'
import type { Database } from '../types/database'
import { criarProcessosSupabase } from './processosSupabase'

function criar(cliente: ClienteSupabaseFalso) {
  return criarProcessosSupabase(cliente as unknown as SupabaseClient<Database>)
}

function clienteQueRecusa(tabela: string, erro: { message: string; code?: string }) {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas[tabela] = { data: null, error: erro }
  return cliente
}

async function falhaDe(promessa: Promise<unknown>): Promise<Error> {
  return (await promessa.catch((erro: unknown) => erro)) as Error
}

describe('mover', () => {
  test('chama a função do banco só com o processo e a etapa quando não há dados da chegada', async () => {
    const cliente = new ClienteSupabaseFalso()
    await criar(cliente).moverProcesso('p1', 'e4')
    expect(cliente.pedidos).toEqual([{ tabela: 'rpc', operacao: 'mover_processo', valores: { p_processo: 'p1', p_etapa: 'e4' } }])
  })

  test('leva a data e o link da publicação, ou a explicação, quando a chegada os traz', async () => {
    const cliente = new ClienteSupabaseFalso()
    const modulo = criar(cliente)
    await modulo.moverProcesso('p1', 'e8', { dataDaPublicacao: '2026-10-10', linkDaPublicacao: 'https://exemplo.test/d', explicacao: null })
    await modulo.moverProcesso('p1', 'e8', { dataDaPublicacao: null, linkDaPublicacao: null, explicacao: 'O setor desistiu' })
    expect(cliente.pedidos.map((pedido) => pedido.valores)).toEqual([
      { p_processo: 'p1', p_etapa: 'e8', p_data_da_publicacao: '2026-10-10', p_link_da_publicacao: 'https://exemplo.test/d' },
      { p_processo: 'p1', p_etapa: 'e8', p_explicacao_sem_publicacao: 'O setor desistiu' },
    ])
  })

  test.each([
    ['processo_parado:suspenso', 'Este processo está suspenso; retome-o para mudar a etapa, a etiqueta ou o responsável.'],
    ['processo_parado:cancelado', 'Este processo está cancelado; retome-o para mudar a etapa, a etiqueta ou o responsável.'],
    ['processo_arquivado', 'Este processo está arquivado; desarquive-o para alterar.'],
    ['etapa_inativa:Publicação', 'A etapa Publicação está inativa.'],
    ['publicacao_ou_explicacao_obrigatoria',
      'Para concluir, informe a data da publicação ou a explicação de concluir sem publicação.'],
    ['explicacao_obrigatoria', 'A explicação é obrigatória.'],
    ['explicacao_longa:2001', 'A explicação tem 2001 caracteres; o máximo é 2.000.'],
  ])('a recusa %s vira a frase', async (mensagem, frase) => {
    const cliente = clienteQueRecusa('rpc.mover_processo', { message: mensagem, code: 'P0001' })
    const falha = await falhaDe(criar(cliente).moverProcesso('p1', 'e4'))
    expect(falha).toBeInstanceOf(TravaDoBanco)
    expect(falha.message).toBe(frase)
  })

  test('a recusa por perfil (42501) vira "Seu perfil não permite alterar os processos."', async () => {
    const cliente = clienteQueRecusa('rpc.mover_processo', { message: 'sem permissão para mover o processo', code: '42501' })
    expect((await falhaDe(criar(cliente).moverProcesso('p1', 'e4'))).message).toBe('Seu perfil não permite alterar os processos.')
  })

  test('processo ou etapa que já não existe avisa como cadastro inexistente', async () => {
    const cliente = clienteQueRecusa('rpc.mover_processo', { message: 'registro_inexistente', code: 'P0001' })
    expect(await falhaDe(criar(cliente).moverProcesso('p1', 'e4'))).toBeInstanceOf(CadastroInexistente)
  })

  test('outra falha vira erro com o motivo do banco', async () => {
    const cliente = clienteQueRecusa('rpc.mover_processo', { message: 'conexão perdida' })
    expect((await falhaDe(criar(cliente).moverProcesso('p1', 'e4'))).message).toBe('erro inesperado do banco (conexão perdida)')
  })
})

describe('etiqueta', () => {
  test('grava na passagem aberta do processo (a que ainda não tem saída)', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['passagens.update'] = { data: [{ id: 'g1' }], error: null }
    await criar(cliente).mudarEtiqueta('p1', 'em_andamento')
    expect(cliente.pedidos[0]).toMatchObject({
      tabela: 'passagens', operacao: 'update', valores: { etiqueta: 'em_andamento' }, filtro: ['processo_id', 'p1'],
      ehNulo: ['saiu_em', null],
    })
  })

  test('em Concluídos a etiqueta é fixa: a recusa vira a frase', async () => {
    const cliente = clienteQueRecusa('passagens.update', { message: 'etiqueta_fixa_em_concluidos', code: 'P0001' })
    expect((await falhaDe(criar(cliente).mudarEtiqueta('p1', 'a_fazer'))).message)
      .toBe('Em Concluídos a etiqueta é sempre Concluído e não muda.')
  })

  test('processo parado, passagem fechada e etiqueta que não existe viram frases', async () => {
    const parado = clienteQueRecusa('passagens.update', { message: 'processo_parado:suspenso', code: 'P0001' })
    expect((await falhaDe(criar(parado).mudarEtiqueta('p1', 'a_fazer'))).message).toContain('Este processo está suspenso')
    const fechada = clienteQueRecusa('passagens.update', { message: 'passagem_fechada', code: 'P0001' })
    expect(await falhaDe(criar(fechada).mudarEtiqueta('p1', 'a_fazer'))).toBeInstanceOf(TravaDoBanco)
    const invalida = clienteQueRecusa('passagens.update', { message: 'invalid input value for enum etiqueta_da_etapa: "x"', code: '22P02' })
    expect((await falhaDe(criar(invalida).mudarEtiqueta('p1', 'x' as 'a_fazer'))).message)
      .toBe('A etiqueta x não existe; use A fazer, Em andamento ou Concluído.')
  })

  test('nada mudou com o processo ainda legível: a RLS recusou pelo perfil', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['passagens.update'] = { data: [], error: null }
    cliente.respostas['processos.select'] = { data: [{ id: 'p1' }], error: null }
    const falha = await falhaDe(criar(cliente).mudarEtiqueta('p1', 'concluido'))
    expect(falha).toBeInstanceOf(TravaDoBanco)
    expect(falha.message).toBe('Seu perfil não permite alterar os processos.')
  })

  test('nada mudou e o processo sumiu: aviso de cadastro inexistente', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['passagens.update'] = { data: [], error: null }
    expect(await falhaDe(criar(cliente).mudarEtiqueta('p1', 'concluido'))).toBeInstanceOf(CadastroInexistente)
  })
})

describe('responsável do processo', () => {
  test('grava o usuário no processo, e null o tira', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['processos.update'] = { data: [{ id: 'p1' }], error: null }
    const modulo = criar(cliente)
    await modulo.mudarResponsavel('p1', 'u1')
    await modulo.mudarResponsavel('p1', null)
    expect(cliente.pedidos.map(({ tabela, valores, filtro }) => [tabela, valores, filtro])).toEqual([
      ['processos', { responsavel_id: 'u1' }, ['id', 'p1']], ['processos', { responsavel_id: null }, ['id', 'p1']],
    ])
  })

  test('responsável inválido vira a frase com o nome do usuário', async () => {
    const cliente = clienteQueRecusa('processos.update', { message: 'responsavel_invalido:Maria Teste', code: 'P0001' })
    const falha = await falhaDe(criar(cliente).mudarResponsavel('p1', 'u3'))
    expect(falha).toBeInstanceOf(TravaDoBanco)
    expect(falha.message).toBe('Maria Teste não pode ser responsável: só usuários ativos de perfil Administrador ou Integrante do EP.')
  })

  test('processo parado vira a frase do congelamento', async () => {
    const cliente = clienteQueRecusa('processos.update', { message: 'processo_parado:cancelado', code: 'P0001' })
    expect((await falhaDe(criar(cliente).mudarResponsavel('p1', 'u1'))).message)
      .toBe('Este processo está cancelado; retome-o para mudar a etapa, a etiqueta ou o responsável.')
  })

  test('nada mudou: perfil quando o processo ainda é legível, cadastro inexistente quando sumiu', async () => {
    const legivel = new ClienteSupabaseFalso()
    legivel.respostas['processos.update'] = { data: [], error: null }
    legivel.respostas['processos.select'] = { data: [{ id: 'p1' }], error: null }
    expect((await falhaDe(criar(legivel).mudarResponsavel('p1', 'u1'))).message).toBe('Seu perfil não permite alterar os processos.')
    const sumiu = new ClienteSupabaseFalso()
    sumiu.respostas['processos.update'] = { data: [], error: null }
    expect(await falhaDe(criar(sumiu).mudarResponsavel('p1', 'u1'))).toBeInstanceOf(CadastroInexistente)
  })
})

test('quem pode ser responsável: usuários ativos Administrador ou Integrante, por nome', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['usuarios.select'] = { data: [{ id: 'u1', nome: 'Ana' }], error: null }
  expect(await criar(cliente).listarResponsaveisPossiveis()).toEqual([{ id: 'u1', nome: 'Ana' }])
  expect(cliente.pedidos[0]).toMatchObject({
    tabela: 'usuarios', filtro: ['ativo', true],
    dentro: ['perfil', ['administrador', 'integrante_ep']], ordem: [['nome', true]],
  })
})
