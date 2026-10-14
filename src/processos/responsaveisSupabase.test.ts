import type { SupabaseClient } from '@supabase/supabase-js'
import { expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { CadastroInexistente } from '../cadastros/cadastroInexistente'
import { ClienteSupabaseFalso } from '../testes/ClienteSupabaseFalso'
import type { Database } from '../types/database'
import { criarProcessosSupabase } from './processosSupabase'

const ANA = { id: 'r1', nome: 'Ana Teste', email: 'ana.teste@exemplo.com', cargo: null }
const DADOS = { nome: 'Ana Teste', email: 'ana.teste@exemplo.com', cargo: 'Chefe' }

function criar(cliente: ClienteSupabaseFalso) {
  return criarProcessosSupabase(cliente as unknown as SupabaseClient<Database>)
}

test('lê os responsáveis do setor em ordem de nome', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['responsaveis_do_setor.select'] = { data: [ANA], error: null }
  expect(await criar(cliente).lerResponsaveisDoSetor('s1')).toEqual([ANA])
  expect(cliente.pedidos[0]).toMatchObject({
    tabela: 'responsaveis_do_setor', colunas: 'id, nome, email, cargo', filtro: ['setor_id', 's1'], ordem: [['nome', true]],
  })
})

test('falha ao ler vira erro com o motivo do banco', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['responsaveis_do_setor.select'] = { data: null, error: { message: 'sem conexão' } }
  await expect(criar(cliente).lerResponsaveisDoSetor('s1'))
    .rejects.toThrow('Falha ao ler os responsáveis do setor: sem conexão')
})

test('criar inclui no setor; editar e excluir mexem só no responsável escolhido', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['responsaveis_do_setor.update'] = { data: [{ id: 'r1' }], error: null }
  cliente.respostas['responsaveis_do_setor.delete'] = { data: [{ id: 'r1' }], error: null }
  const modulo = criar(cliente)
  await modulo.criarResponsavel('s1', DADOS)
  await modulo.editarResponsavel('r1', DADOS)
  await modulo.excluirResponsavel('r1')
  expect(cliente.pedidos).toMatchObject([
    { operacao: 'insert', valores: { setor_id: 's1', ...DADOS } },
    { operacao: 'update', valores: DADOS, filtro: ['id', 'r1'] },
    { operacao: 'delete', filtro: ['id', 'r1'] },
  ])
})

test.each(['insert', 'update'])('a recusa do e-mail no %s vira a frase da spec com o valor recebido', async (operacao) => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas[`responsaveis_do_setor.${operacao}`] = {
    data: null, error: { message: 'email_mal_formado:Ana@Exemplo', code: 'P0001' },
  }
  const modulo = criar(cliente)
  const gravar = operacao === 'insert' ? modulo.criarResponsavel('s1', DADOS) : modulo.editarResponsavel('r1', DADOS)
  await expect(gravar).rejects.toEqual(
    new TravaDoBanco('O e-mail deve ter o formato nome@dominio. Recebido: "Ana@Exemplo".'))
})

test('recusa por perfil vira a frase dos processos', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['responsaveis_do_setor.insert'] = { data: null, error: { message: 'violates row-level security', code: '42501' } }
  await expect(criar(cliente).criarResponsavel('s1', DADOS))
    .rejects.toEqual(new TravaDoBanco('Seu perfil não permite alterar os processos.'))
})

test('nada alterado: ainda legível é perfil; ilegível, o responsável sumiu', async () => {
  const comPerfil = new ClienteSupabaseFalso()
  comPerfil.respostas['responsaveis_do_setor.update'] = { data: [], error: null }
  comPerfil.respostas['responsaveis_do_setor.select'] = { data: [{ id: 'r1' }], error: null }
  await expect(criar(comPerfil).editarResponsavel('r1', DADOS))
    .rejects.toEqual(new TravaDoBanco('Seu perfil não permite alterar os processos.'))
  const sumiu = new ClienteSupabaseFalso()
  sumiu.respostas['responsaveis_do_setor.delete'] = { data: [], error: null }
  await expect(criar(sumiu).excluirResponsavel('r1')).rejects.toBeInstanceOf(CadastroInexistente)
})
