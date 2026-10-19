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

function clienteQueRecusa(tabela: string, erro: { message: string; code?: string }) {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas[tabela] = { data: null, error: erro }
  return cliente
}

async function falhaDe(promessa: Promise<void>): Promise<Error> {
  return (await promessa.catch((erro: unknown) => erro)) as Error
}

test('voltar chama a função do banco com o andamento e o motivo', async () => {
  const cliente = new ClienteSupabaseFalso()
  await criar(cliente).voltarParaEtapa('a4', 'Mudou o escopo')
  expect(cliente.pedidos).toEqual([
    { tabela: 'rpc', operacao: 'voltar_a_etapa', valores: { p_andamento: 'a4', p_motivo: 'Mudou o escopo', p_responsavel: null } },
  ])
})

test('corrigir as datas grava início e conclusão no andamento escolhido', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['andamentos.update'] = { data: [{ id: 'a4' }], error: null }
  await criar(cliente).corrigirDatasDaEtapa('a4', { iniciadaEm: '2026-10-10', resolvidaEm: null })
  expect(cliente.pedidos[0]).toMatchObject({
    tabela: 'andamentos', operacao: 'update', valores: { iniciada_em: '2026-10-10', resolvida_em: null }, filtro: ['id', 'a4'],
  })
})

test('mudar o responsável grava o usuário, e null o tira', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['andamentos.update'] = { data: [{ id: 'a4' }], error: null }
  const modulo = criar(cliente)
  await modulo.mudarResponsavelDaEtapa('a4', 'u1')
  await modulo.mudarResponsavelDaEtapa('a4', null)
  expect(cliente.pedidos.map((pedido) => pedido.valores)).toEqual([{ responsavel_id: 'u1' }, { responsavel_id: null }])
})

test('a data no futuro vira a frase com a data em DD/MM/AAAA', async () => {
  const cliente = clienteQueRecusa('andamentos.update', { message: 'data_no_futuro:2026-10-20', code: 'P0001' })
  const falha = await falhaDe(criar(cliente).corrigirDatasDaEtapa('a4', { iniciadaEm: '2026-10-20', resolvidaEm: null }))
  expect(falha).toBeInstanceOf(TravaDoBanco)
  expect(falha.message).toBe('A data 20/10/2026 está no futuro.')
})

test('a conclusão antes do início vira a frase com as duas datas', async () => {
  const cliente = clienteQueRecusa('andamentos.update', { message: 'resolvida_antes_do_inicio:2026-10-01:2026-10-05', code: 'P0001' })
  const falha = await falhaDe(criar(cliente).corrigirDatasDaEtapa('a4', { iniciadaEm: '2026-10-05', resolvidaEm: '2026-10-01' }))
  expect(falha.message).toBe('A conclusão (01/10/2026) não pode ser antes do início (05/10/2026).')
})

test('responsável inválido vira a frase com o nome do usuário', async () => {
  const cliente = clienteQueRecusa('andamentos.update', { message: 'responsavel_invalido:Maria Teste', code: 'P0001' })
  const falha = await falhaDe(criar(cliente).mudarResponsavelDaEtapa('a4', 'u3'))
  expect(falha).toBeInstanceOf(TravaDoBanco)
  expect(falha.message).toBe(
    'Maria Teste não pode ser responsável: só usuários ativos de perfil Administrador ou Integrante do EP.')
})

test('voltar sem motivo e voltar a etapa não resolvida viram frases', async () => {
  const semMotivo = clienteQueRecusa('rpc.voltar_a_etapa', { message: 'motivo_obrigatorio', code: 'P0001' })
  expect((await falhaDe(criar(semMotivo).voltarParaEtapa('a4', ' '))).message).toBe('O motivo é obrigatório.')
  const pendente = clienteQueRecusa('rpc.voltar_a_etapa',
    { message: 'etapa_nao_resolvida:Reunião de modelagem', code: 'P0001' })
  expect((await falhaDe(criar(pendente).voltarParaEtapa('a4', 'Motivo'))).message)
    .toBe('A etapa Reunião de modelagem ainda não foi resolvida.')
})

test('voltar recusado pela permissão (42501) vira "Seu perfil não permite alterar os processos."', async () => {
  const cliente = clienteQueRecusa('rpc.voltar_a_etapa', { message: 'sem permissão para voltar a etapa', code: '42501' })
  const falha = await falhaDe(criar(cliente).voltarParaEtapa('a4', 'Motivo'))
  expect(falha).toBeInstanceOf(TravaDoBanco)
  expect(falha.message).toBe('Seu perfil não permite alterar os processos.')
})

test('voltar a uma etapa que já não existe avisa como cadastro inexistente', async () => {
  const cliente = clienteQueRecusa('rpc.voltar_a_etapa', { message: 'registro_inexistente', code: 'P0001' })
  expect(await falhaDe(criar(cliente).voltarParaEtapa('a4', 'Motivo'))).toBeInstanceOf(CadastroInexistente)
})

test('corrigir datas sem linha afetada: perfil se a etapa ainda é legível, aviso se sumiu', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['andamentos.update'] = { data: [], error: null }
  expect(await falhaDe(criar(cliente).corrigirDatasDaEtapa('a4', { iniciadaEm: null, resolvidaEm: null })))
    .toBeInstanceOf(CadastroInexistente)
  cliente.respostas['andamentos.select'] = { data: [{ id: 'a4' }], error: null }
  const falha = await falhaDe(criar(cliente).corrigirDatasDaEtapa('a4', { iniciadaEm: null, resolvidaEm: null }))
  expect(falha.message).toBe('Seu perfil não permite alterar os processos.')
})

test('lista só usuários ativos de perfil Administrador ou Integrante, por nome', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['usuarios.select'] = { data: [{ id: 'u1', nome: 'Ana Teste' }, { id: 'u2', nome: 'Bia Teste' }], error: null }
  expect(await criar(cliente).listarResponsaveisPossiveis()).toEqual([
    { id: 'u1', nome: 'Ana Teste' }, { id: 'u2', nome: 'Bia Teste' }])
  expect(cliente.pedidos[0]).toMatchObject({
    tabela: 'usuarios', filtro: ['ativo', true], dentro: ['perfil', ['administrador', 'integrante_ep']], ordem: [['nome', true]],
  })
})

test('falha ao listar os responsáveis possíveis vira erro com o motivo do banco', async () => {
  const cliente = clienteQueRecusa('usuarios.select', { message: 'sem conexão' })
  await expect(criar(cliente).listarResponsaveisPossiveis()).rejects
    .toThrow('Falha ao ler os usuários que podem ser responsáveis: sem conexão')
})
