import type { SupabaseClient } from '@supabase/supabase-js'
import { expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { CadastroInexistente } from '../cadastros/cadastroInexistente'
import { ClienteSupabaseFalso } from '../testes/ClienteSupabaseFalso'
import type { Database } from '../types/database'
import { criarProcessosSupabase } from './processosSupabase'

const MODELAGEM = {
  id: 'e4', codigo: 'modelagem', nome: 'Reunião de modelagem', ordem: 4, fase: 'IV' as const, ativa: true,
}
const NOVA = { codigo: 'nova', nome: 'Nova', fase: 'VI' as const, antesDe: null }

function criar(cliente: ClienteSupabaseFalso) {
  return criarProcessosSupabase(cliente as unknown as SupabaseClient<Database>).catalogo
}

test('lista o catálogo inteiro em ordem', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['etapas.select'] = { data: [MODELAGEM], error: null }
  expect(await criar(cliente).listarCatalogo()).toEqual([MODELAGEM])
  expect(cliente.pedidos[0]).toMatchObject({
    tabela: 'etapas', colunas: 'id, codigo, nome, ordem, fase, ativa', ordem: [['ordem', true]],
  })
})

test('falha ao ler vira erro com o motivo do banco', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['etapas.select'] = { data: null, error: { message: 'sem conexão' } }
  await expect(criar(cliente).listarCatalogo()).rejects.toThrow('Falha ao ler o catálogo de etapas: sem conexão')
})

test('acrescentar chama a função do banco; sem posição vai como nula (logo antes de Concluídos)', async () => {
  const cliente = new ClienteSupabaseFalso()
  await criar(cliente).acrescentarEtapa(NOVA)
  await criar(cliente).acrescentarEtapa({ ...NOVA, antesDe: 'e9' })
  expect(cliente.pedidos).toMatchObject([
    { tabela: 'rpc', operacao: 'acrescentar_etapa', valores: {
      p_codigo: 'nova', p_nome: 'Nova', p_fase: 'VI', p_antes_de: null } },
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
  await catalogo.editarEtapa('e4', { nome: 'Modelagem', fase: 'V' })
  await catalogo.desativarEtapa('e4')
  await catalogo.reativarEtapa('e4')
  await catalogo.excluirEtapa('e4')
  expect(cliente.pedidos).toMatchObject([
    { operacao: 'update', valores: { nome: 'Modelagem', fase: 'V' }, filtro: ['id', 'e4'] },
    { operacao: 'update', valores: { ativa: false }, filtro: ['id', 'e4'] },
    { operacao: 'update', valores: { ativa: true }, filtro: ['id', 'e4'] },
    { operacao: 'delete', filtro: ['id', 'e4'] },
  ])
})

test.each([
  ['etapa_usada:Extra', 'A etapa Extra já recebeu processos; desative-a em vez de excluir.'],
  ['etapa_protegida:Revisão interna', 'A etapa Revisão interna tem campos próprios e não pode ser desativada nem excluída.'],
  ['etapa_fixa', 'As etapas Não iniciados e Concluídos não mudam de nome nem de lugar e não saem do catálogo.'],
  ['etapas_fixas_nas_pontas', 'As etapas Não iniciados e Concluídos não mudam de nome nem de lugar e não saem do catálogo.'],
])('a recusa "%s" do banco vira a frase da spec', async (mensagem, frase) => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['etapas.delete'] = { data: null, error: { message: mensagem, code: 'P0001' } }
  cliente.respostas['rpc.mover_etapa'] = { data: null, error: { message: mensagem, code: 'P0001' } }
  await expect(criar(cliente).excluirEtapa('e4')).rejects.toEqual(new TravaDoBanco(frase))
  await expect(criar(cliente).moverEtapa('e4', 'subir')).rejects.toEqual(new TravaDoBanco(frase))
})

test('etapa com processos dentro: a frase traz a contagem e o verbo da ação tentada', async () => {
  const cliente = new ClienteSupabaseFalso()
  const recusa = { data: null, error: { message: 'etapa_com_processos:Revisão interna:3', code: 'P0001' } }
  cliente.respostas['etapas.update'] = recusa
  cliente.respostas['etapas.delete'] = recusa
  await expect(criar(cliente).desativarEtapa('e4'))
    .rejects.toEqual(new TravaDoBanco('A etapa Revisão interna tem 3 processos; mova-os antes de desativar.'))
  await expect(criar(cliente).excluirEtapa('e4'))
    .rejects.toEqual(new TravaDoBanco('A etapa Revisão interna tem 3 processos; mova-os antes de excluir.'))
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
  await expect(criar(cliente).editarEtapa('e4', { nome: 'Publicação', fase: 'VII' }))
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
})test.each([
  ['etapa_usada:Extra', 'A etapa Extra já recebeu processos; desative-a em vez de excluir.'],
  ['etapa_protegida:Revisão interna', 'A etapa Revisão interna tem campos próprios e não pode ser desativada nem excluída.'],
  ['etapa_fixa', 'As etapas Não iniciados e Concluídos não mudam de nome nem de lugar e não saem do catálogo.'],
  ['etapas_fixas_nas_pontas', 'As etapas Não iniciados e Concluídos não mudam de nome nem de lugar e não saem do catálogo.'],
])('a recusa "%s" do banco vira a frase da spec', async (mensagem, frase) => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['etapas.delete'] = { data: null, error: { message: mensagem, code: 'P0001' } }
  cliente.respostas['rpc.mover_etapa'] = { data: null, error: { message: mensagem, code: 'P0001' } }
  await expect(criar(cliente).excluirEtapa('e4')).rejects.toEqual(new TravaDoBanco(frase))
  await expect(criar(cliente).moverEtapa('e4', 'subir')).rejects.toEqual(new TravaDoBanco(frase))
})

test('etapa com processos dentro: a frase traz a contagem e o verbo da ação tentada', async () => {
  const cliente = new ClienteSupabaseFalso()
  const recusa = { data: null, error: { message: 'etapa_com_processos:Revisão interna:3', code: 'P0001' } }
  cliente.respostas['etapas.update'] = recusa
  cliente.respostas['etapas.delete'] = recusa
  await expect(criar(cliente).desativarEtapa('e4'))
    .rejects.toEqual(new TravaDoBanco('A etapa Revisão interna tem 3 processos; mova-os antes de desativar.'))
  await expect(criar(cliente).excluirEtapa('e4'))
    .rejects.toEqual(new TravaDoBanco('A etapa Revisão interna tem 3 processos; mova-os antes de excluir.'))
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
  await expect(criar(cliente).editarEtapa('e4', { nome: 'Publicação', fase: 'VII' }))
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
