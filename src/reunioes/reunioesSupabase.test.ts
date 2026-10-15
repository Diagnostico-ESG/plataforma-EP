import type { SupabaseClient } from '@supabase/supabase-js'
import { expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { ClienteSupabaseFalso } from '../testes/ClienteSupabaseFalso'
import type { Database } from '../types/database'
import { criarReunioesSupabase } from './reunioesSupabase'
import type { DadosDaReuniao } from './tipos'

const LINHA = {
  id: 'r1', tipo: 'modelagem', data: '2026-10-20', hora: '09:30:00', local: 'Sala 1', anotacoes: null, setor_id: 's1',
  setores: { sigla: 'TSA', ativo: true },
  reunioes_processos: [
    { processos: { id: 'p2', nome: 'Pagar Diária', situacao: 'em_andamento' } },
    { processos: { id: 'p1', nome: 'Arquivar Pasta', situacao: 'cancelado' } },
  ],
}
const DADOS: DadosDaReuniao = {
  tipo: 'modelagem', setorId: 's1', data: '2026-10-20', hora: '09:30', local: 'Sala 1', anotacoes: null, processosIds: ['p1'],
}

function criar(cliente: ClienteSupabaseFalso) {
  return criarReunioesSupabase(cliente as unknown as SupabaseClient<Database>)
}

test('lista as reuniões com o setor e os processos por nome, a hora sem os segundos e o cancelado marcado', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['reunioes.select'] = { data: [LINHA], error: null }
  expect(await criar(cliente).listarReunioes()).toEqual([{
    id: 'r1', tipo: 'modelagem', setorId: 's1', setorSigla: 'TSA', setorAtivo: true, data: '2026-10-20', hora: '09:30',
    local: 'Sala 1', anotacoes: null,
    processos: [{ id: 'p1', nome: 'Arquivar Pasta', cancelado: true }, { id: 'p2', nome: 'Pagar Diária', cancelado: false }],
  }])
  expect(cliente.pedidos[0]).toMatchObject({ tabela: 'reunioes', operacao: 'select' })
})

test('lê uma reunião pelo id; sem linha, devolve null', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['reunioes.select'] = { data: [LINHA], error: null }
  expect((await criar(cliente).lerReuniao('r1'))?.id).toBe('r1')
  expect(cliente.pedidos[0]).toMatchObject({ tabela: 'reunioes', filtro: ['id', 'r1'] })
  cliente.respostas['reunioes.select'] = { data: [], error: null }
  expect(await criar(cliente).lerReuniao('r2')).toBeNull()
})

test('a leitura que falha vira erro com o motivo', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['reunioes.select'] = { data: null, error: { message: 'sem rede' } }
  await expect(criar(cliente).listarReunioes()).rejects.toThrow('Falha ao ler as reuniões: sem rede')
})

test('os setores da escolha são só os ativos, por sigla', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['setores.select'] = { data: [{ id: 's1', sigla: 'TSA', nome: 'Setor A' }], error: null }
  expect(await criar(cliente).listarSetoresAtivos()).toEqual([{ id: 's1', sigla: 'TSA', nome: 'Setor A' }])
  expect(cliente.pedidos[0]).toMatchObject({ tabela: 'setores', filtro: ['ativo', true], ordem: [['sigla', true]] })
})

test('os processos da escolha são os do setor, em qualquer situação, por nome', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['processos.select'] = { data: [{ id: 'p1', nome: 'Arquivar Pasta', situacao: 'cancelado' }], error: null }
  expect(await criar(cliente).listarProcessosDoSetor('s1')).toEqual([{ id: 'p1', nome: 'Arquivar Pasta', cancelado: true }])
  expect(cliente.pedidos[0]).toMatchObject({ tabela: 'processos', filtro: ['setor_id', 's1'], ordem: [['nome', true]] })
})

test('salvar chama a função do banco com os parâmetros; id nulo cria', async () => {
  const cliente = new ClienteSupabaseFalso()
  await criar(cliente).salvarReuniao(null, DADOS)
  expect(cliente.pedidos[0]).toMatchObject({
    tabela: 'rpc', operacao: 'salvar_reuniao',
    valores: {
      p_id: null, p_tipo: 'modelagem', p_setor_id: 's1', p_data: '2026-10-20', p_hora: '09:30', p_local: 'Sala 1',
      p_anotacoes: null, p_outros: [], p_processos: ['p1'],
    },
  })
})

test('a recusa do banco ao salvar chega como TravaDoBanco com a frase pronta', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['rpc.salvar_reuniao'] = { data: null, error: { message: 'modelagem_sem_processo', code: 'P0001' } }
  const falha = await criar(cliente).salvarReuniao(null, DADOS).catch((erro: unknown) => erro)
  expect(falha).toBeInstanceOf(TravaDoBanco)
  expect((falha as Error).message).toBe('A reunião de modelagem precisa de ao menos um processo.')
})
