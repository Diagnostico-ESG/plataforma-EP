import type { SupabaseClient } from '@supabase/supabase-js'
import { expect, test } from 'vitest'
import { ClienteSupabaseFalso } from '../testes/ClienteSupabaseFalso'
import type { Database } from '../types/database'
import { criarProcessosSupabase } from './processosSupabase'

const LINHA = {
  id: 'p1', nome: 'Emitir Ofício Fictício', tipo: 'processo', processo_pai_id: null, origem: 'retomado',
  situacao_guardada: 'em_andamento', motivo_da_situacao: null, contexto: 'Contexto inventado', observacoes: null,
  criado_em: '2026-10-14T10:00:00Z', setor_id: 's1', setor_sigla: 'TSA', macroprocesso_id: 'm1',
  macroprocesso_nome: 'Macro de Teste', situacao: 'em_andamento', etapa_atual_id: 'e4', etapa_atual_codigo: 'modelagem',
  etapa_atual_nome: 'Reunião de modelagem', etapa_atual_ordem: 4, aguardando_o_setor: false,
  responsavel_id: null, responsavel_nome: null, responsavel_foto_url: null,
}
const MODELAGEM = {
  id: 'a4', status: 'pendente', nota: null, iniciada_em: null, resolvida_em: null, responsavel: { id: 'u1', nome: 'Ana Teste', ativo: true },
  etapas: { codigo: 'modelagem', nome: 'Reunião de modelagem', ordem: 4, obrigatoria: true },
}
const RELATORIO = {
  id: 'a5', status: 'pendente', nota: null, iniciada_em: null, resolvida_em: null, responsavel: null,
  etapas: { codigo: 'relatorio_modelagem_tecnica', nome: 'Relatório e modelagem técnica', ordem: 5, obrigatoria: true },
}
const DO_SETOR = {
  id: 'a1', status: 'dispensada', nota: 'Nota inventada', iniciada_em: null, resolvida_em: '2026-10-13',
  etapas: { codigo: 'identificacao_responsaveis', nome: 'Identificação dos responsáveis', ordem: 1, obrigatoria: false },
}

function criar(cliente: ClienteSupabaseFalso) {
  return criarProcessosSupabase(cliente as unknown as SupabaseClient<Database>)
}

test('lê o processo com as etapas do processo (ordem do catálogo, com o responsável) e as do setor', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['processos_com_andamento.select'] = { data: [LINHA], error: null }
  cliente.respostas['andamentos.select'] = { data: [RELATORIO, MODELAGEM], error: null }
  const lido = await criar(cliente).lerProcesso('p1')
  expect(lido).toMatchObject({
    id: 'p1', nome: 'Emitir Ofício Fictício', origem: 'retomado', contexto: 'Contexto inventado', observacoes: null,
    motivoDaSituacao: null,
  })
  expect(lido?.etapasDoProcesso.map((etapa) => [etapa.codigo, etapa.responsavelNome])).toEqual([
    ['modelagem', 'Ana Teste'], ['relatorio_modelagem_tecnica', null]])
  expect(cliente.pedidos.filter((pedido) => pedido.tabela === 'andamentos').map((pedido) => pedido.filtro)).toEqual(
    expect.arrayContaining([['processo_id', 'p1'], ['setor_id', 's1']]))
})

test('a etapa traz o id do responsável e se ele foi desativado depois de escolhido', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['processos_com_andamento.select'] = { data: [LINHA], error: null }
  const inativo = { ...MODELAGEM, responsavel: { id: 'u2', nome: 'Caio Teste', ativo: false } }
  cliente.respostas['andamentos.select'] = { data: [inativo, RELATORIO, MODELAGEM], error: null }
  const lido = await criar(cliente).lerProcesso('p1')
  expect(lido?.etapasDoProcesso.map((etapa) => [etapa.responsavelId, etapa.responsavelInativo])).toEqual([
    ['u2', true], ['u1', false], [null, false]])
})

test('as etapas do setor também chegam, no mesmo formato da tela do setor', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['processos_com_andamento.select'] = { data: [LINHA], error: null }
  cliente.respostas['andamentos.select'] = { data: [DO_SETOR], error: null }
  const lido = await criar(cliente).lerProcesso('p1')
  expect(lido?.etapasDoSetor[0]).toMatchObject({ codigo: 'identificacao_responsaveis', status: 'dispensada', nota: 'Nota inventada' })
})

test('processo que não existe: null', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['processos_com_andamento.select'] = { data: [], error: null }
  expect(await criar(cliente).lerProcesso('p9')).toBeNull()
})

test('falha ao ler o processo vira erro com o motivo do banco', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['processos_com_andamento.select'] = { data: null, error: { message: 'sem conexão' } }
  await expect(criar(cliente).lerProcesso('p1')).rejects.toThrow('Falha ao ler o processo: sem conexão')
})

test('o histórico do processo vem do mais recente ao mais antigo, só dos eventos dele', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['eventos.select'] = { data: [{
    id: 7, ocorrido_em: '2026-10-14T10:00:00Z', acao: 'criar', entidade: 'processo', entidade_ref: 'p1',
    detalhes: { antes: null, depois: { nome: 'Emitir Ofício Fictício' } }, autor: { nome: 'Ana Teste' },
  }], error: null }
  expect(await criar(cliente).lerHistoricoDoProcesso('p1')).toEqual([{
    id: 7, ocorridoEm: '2026-10-14T10:00:00Z', autor: 'Ana Teste', acao: 'criar', entidade: 'processo',
    entidadeRef: 'p1', antes: null, depois: { nome: 'Emitir Ofício Fictício' }, motivo: undefined,
  }])
  expect(cliente.pedidos[0]).toMatchObject({
    tabela: 'eventos', dentro: ['entidade', ['processo', 'andamento']], parecido: ['entidade_ref', 'p1%'],
    ordem: [['ocorrido_em', false], ['id', false]],
  })
})

test('falha ao ler o histórico vira erro com o motivo do banco', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['eventos.select'] = { data: null, error: { message: 'sem conexão' } }
  await expect(criar(cliente).lerHistoricoDoProcesso('p1')).rejects.toThrow('Falha ao ler o histórico do processo: sem conexão')
})
