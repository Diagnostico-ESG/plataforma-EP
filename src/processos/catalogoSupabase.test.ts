import type { SupabaseClient } from '@supabase/supabase-js'
import { expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { CadastroInexistente } from '../cadastros/cadastroInexistente'
import { ClienteSupabaseFalso } from '../testes/ClienteSupabaseFalso'
import type { Database } from '../types/database'
import { criarProcessosSupabase } from './processosSupabase'

const MODELAGEM = {
  id: 'e4', codigo: 'modelagem', nome: 'Reunião de modelagem', ordem: 4, nivel: 'processo', obrigatoria: true, ativa: true,
}
const NOVA = { codigo: 'nova', nome: 'Nova', nivel: 'processo' as const, obrigatoria: false, antesDe: null }

function criar(cliente: ClienteSupabaseFalso) {
  return criarProcessosSupabase(cliente as unknown as SupabaseClient<Database>).catalogo
}

test('lista o catálogo inteiro em ordem', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['etapas.select'] = { data: [MODELAGEM], error: null }
  expect(await criar(cliente).listarCatalogo()).toEqual([MODELAGEM])
  expect(cliente.pedidos[0]).toMatchObject({
    tabela: 'etapas', colunas: 'id, codigo, nome, ordem, nivel, obrigatoria, ativa', ordem: [['ordem', true]],
  })
})

test('falha ao ler vira erro com o motivo do banco', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['etapas.select'] = { data: null, error: { message: 'sem conexão' } }
  await expect(criar(cliente).listarCatalogo()).rejects.toThrow('Falha ao ler o catálogo de etapas: sem conexão')
})

test('acrescentar chama a função do banco; "No fim" vai como posição nula', async () => {
  const cliente = new ClienteSupabaseFalso()
  await criar(cliente).acrescentarEtapa(NOVA)
  await criar(cliente).acrescentarEtapa({ ...NOVA, antesDe: 'e9' })
  expect(cliente.pedidos).toMatchObject([
    { tabela: 'rpc', operacao: 'acrescentar_etapa', valores: {
      p_codigo: 'nova', p_nome: 'Nova', p_nivel: 'processo', p_obrigatoria: false, p_antes_de: null } },
    { tabela: 'rpc', operacao: 'acrescentar_etapa', valores: { p_antes_de: 'e9' } },
  ])
})

test('mover chama a função do banco com o sentido', async () => {
  const cliente = new ClienteSupabaseFalso()
  await criar(cliente).moverEtapa('e4', 'descer')
  expect(cliente.pedidos[0]).toMatchObject({ tabela: 'rpc', operacao: 'mover_etapa', valores: { p_etapa: 'e4', p_sentido: 'descer' } })
})

test('editar, desativar, reativar e excluir mexem só na etapa escolhida', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['etapas.update'] = { data: [{ id: 'e4' }], error: null }
  cliente.respostas['etapas.delete'] = { data: [{ id: 'e4' }], error: null }
  const catalogo = criar(cliente)
  await catalogo.editarEtapa('e4', { nome: 'Modelagem', obrigatoria: false })
  await catalogo.desativarEtapa('e4')
  await catalogo.reativarEtapa('e4')
  await catalogo.excluirEtapa('e4')
  expect(cliente.pedidos).toMatchObject([
    { operacao: 'update', valores: { nome: 'Modelagem', obrigatoria: false }, filtro: ['id', 'e4'] },
    { operacao: 'update', valores: { ativa: false }, filtro: ['id', 'e4'] },
    { operacao: 'update', valores: { ativa: true }, filtro: ['id', 'e4'] },
    { operacao: 'delete', filtro: ['id', 'e4'] },
  ])
})

test.each([
  ['etapa_usada:Reunião de modelagem', 'A etapa Reunião de modelagem já foi usada; desative-a em vez de excluir.'],
  ['etapas_do_setor_primeiro', 'As etapas do setor precisam vir antes das etapas do processo.'],
])('a recusa "%s" do banco vira a frase da spec', async (mensagem, frase) => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['etapas.delete'] = { data: null, error: { message: mensagem, code: 'P0001' } }
  cliente.respostas['rpc.mover_etapa'] = { data: null, error: { message: mensagem, code: 'P0001' } }
  await expect(criar(cliente).excluirEtapa('e4')).rejects.toEqual(new TravaDoBanco(frase))
  await expect(criar(cliente).moverEtapa('e4', 'subir')).rejects.toEqual(new TravaDoBanco(frase))
})

test('nome e código repetidos viram a frase com o valor', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['rpc.acrescentar_etapa'] = {
    data: null, error: { message: 'duplicate key value violates unique constraint "etapas_nome_unico"', code: '23505' },
  }
  await expect(criar(cliente).acrescentarEtapa(NOVA)).rejects.toEqual(new TravaDoBanco('Já existe uma etapa com o nome Nova.'))
  cliente.respostas['rpc.acrescentar_etapa'] = {
    data: null, error: { message: 'duplicate key value violates unique constraint "etapas_codigo_key"', code: '23505' },
  }
  await expect(criar(cliente).acrescentarEtapa(NOVA)).rejects.toEqual(new TravaDoBanco('Já existe uma etapa com o código nova.'))
})

test('nome repetido na edição vira a frase com o valor', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['etapas.update'] = {
    data: null, error: { message: 'duplicate key value violates unique constraint "etapas_nome_unico"', code: '23505' },
  }
  await expect(criar(cliente).editarEtapa('e4', { nome: 'Publicação', obrigatoria: true }))
    .rejects.toEqual(new TravaDoBanco('Já existe uma etapa com o nome Publicação.'))
})

test('recusa por perfil vira a frase dos processos', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['rpc.acrescentar_etapa'] = { data: null, error: { message: 'violates row-level security', code: '42501' } }
  await expect(criar(cliente).acrescentarEtapa(NOVA))
    .rejects.toEqual(new TravaDoBanco('Seu perfil não permite alterar os processos.'))
})

test('nada mudou: etapa ainda legível é perfil; etapa que sumiu é cadastro inexistente', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['etapas.update'] = { data: [], error: null }
  cliente.respostas['etapas.select'] = { data: [{ id: 'e4' }], error: null }
  await expect(criar(cliente).desativarEtapa('e4')).rejects.toEqual(new TravaDoBanco('Seu perfil não permite alterar os processos.'))
  cliente.respostas['etapas.select'] = { data: [], error: null }
  await expect(criar(cliente).desativarEtapa('e4')).rejects.toBeInstanceOf(CadastroInexistente)
})
