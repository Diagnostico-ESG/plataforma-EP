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
  etapa_atual_nome: 'Reunião de modelagem', etapa_atual_ordem: 4,
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

function criar(cliente: ClienteSupabaseFalso) {
  return criarProcessosSupabase(cliente as unknown as SupabaseClient<Database>)
}

test('lê o processo com as etapas do processo (ordem do catálogo, com o responsável), sem ler etapas do setor', async () => {
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
    [['processo_id', 'p1']])
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

const VIEW = 'processos_com_andamento.select'
const linhaDaEstrutura = (id: string, nome: string, pai: string | null, mudancas: object = {}) => ({
  id, nome, processo_pai_id: pai, situacao: 'em_andamento', etapa_atual_nome: 'Revisão interna', ...mudancas,
})

test('o processo traz os subprocessos, por nome, com a etapa atual e a situação de cada um', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.filaDeRespostas[VIEW] = [{ data: [LINHA], error: null }, { data: [
    linhaDaEstrutura('p2', 'Filho A', 'p1'),
    linhaDaEstrutura('p3', 'Filho B', 'p1', { situacao: 'concluido', etapa_atual_nome: null }),
  ], error: null }]
  const lido = await criar(cliente).lerProcesso('p1')
  expect(lido).toMatchObject({ processoPai: null, subprocessos: [
    { id: 'p2', nome: 'Filho A', etapaAtual: 'Revisão interna', situacao: 'em_andamento' },
    { id: 'p3', nome: 'Filho B', etapaAtual: null, situacao: 'concluido' },
  ] })
  expect(cliente.pedidos.filter((pedido) => pedido.tabela === 'processos_com_andamento')[1]).toMatchObject({
    colunas: 'id, nome, processo_pai_id, situacao, etapa_atual_nome', ou: 'processo_pai_id.eq.p1', ordem: [['nome', true]] })
})

test('o subprocesso traz o pai, com a etapa atual e a situação', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.filaDeRespostas[VIEW] = [
    { data: [{ ...LINHA, tipo: 'subprocesso', processo_pai_id: 'p0' }], error: null },
    { data: [linhaDaEstrutura('p0', 'Pai Fictício', null, { situacao: 'suspenso' })], error: null },
  ]
  const lido = await criar(cliente).lerProcesso('p1')
  expect(lido).toMatchObject({
    processoPaiId: 'p0', subprocessos: [],
    processoPai: { id: 'p0', nome: 'Pai Fictício', etapaAtual: 'Revisão interna', situacao: 'suspenso' },
  })
  expect(cliente.pedidos.filter((pedido) => pedido.tabela === 'processos_com_andamento')[1]?.ou).toBe('processo_pai_id.eq.p1,id.eq.p0')
})

test('falha ao ler o pai e os subprocessos vira erro com o motivo do banco', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.filaDeRespostas[VIEW] = [{ data: [LINHA], error: null }, { data: null, error: { message: 'sem conexão' } }]
  await expect(criar(cliente).lerProcesso('p1')).rejects.toThrow('Falha ao ler o pai e os subprocessos do processo: sem conexão')
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
    tabela: 'eventos', dentro: ['entidade', ['processo', 'andamento', 'versao']], parecido: ['entidade_ref', 'p1%'],
    ordem: [['ocorrido_em', false], ['id', false]],
  })
})

test('falha ao ler o histórico vira erro com o motivo do banco', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['eventos.select'] = { data: null, error: { message: 'sem conexão' } }
  await expect(criar(cliente).lerHistoricoDoProcesso('p1')).rejects.toThrow('Falha ao ler o histórico do processo: sem conexão')
})

test.each([['2026-10-20'], [null]])('a data da reunião (%s) chega com o processo', async (data) => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['processos_com_andamento.select'] = { data: [{ ...LINHA, data_da_reuniao: data }], error: null }
  cliente.respostas['andamentos.select'] = { data: [], error: null }
  expect((await criar(cliente).lerProcesso('p1'))?.dataDaReuniao).toBe(data)
})

test('o processo traz a versão mais recente não histórica, com o autor e os papéis dos arquivos', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['processos_com_andamento.select'] = { data: [LINHA], error: null }
  cliente.respostas['versoes.select'] = {
    data: [{ numero: 3, enviada_por: 'u1', autor: { nome: 'Ana Teste' }, arquivos: [{ papel: 'bpmn' }, { papel: 'png' }] }], error: null,
  }
  const lido = await criar(cliente).lerProcesso('p1')
  expect(lido?.ultimaVersao).toEqual({ numero: 3, autorId: 'u1', autorNome: 'Ana Teste', papeis: ['bpmn', 'png'] })
  expect(cliente.pedidos.find((pedido) => pedido.tabela === 'versoes')).toMatchObject({
    filtros: [['processo_id', 'p1'], ['historica', false]], ordem: [['numero', false]], limite: 2,
  })
})

test('com duas versões, a anterior (número e autor) vem junto, para a revisão corrigida', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['processos_com_andamento.select'] = { data: [LINHA], error: null }
  cliente.respostas['versoes.select'] = {
    data: [
      { numero: 8, enviada_por: 'u1', autor: { nome: 'Ana Teste' }, arquivos: [{ papel: 'bpmn' }] },
      { numero: 7, enviada_por: 'u2', autor: { nome: 'Bia Teste' }, arquivos: [{ papel: 'bpmn' }, { papel: 'png' }] },
    ],
    error: null,
  }
  const lido = await criar(cliente).lerProcesso('p1')
  expect(lido?.ultimaVersao).toEqual({
    numero: 8, autorId: 'u1', autorNome: 'Ana Teste', papeis: ['bpmn'], anterior: { numero: 7, autorId: 'u2' },
  })
})

test('sem versão não histórica, o processo não tem última versão', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['processos_com_andamento.select'] = { data: [LINHA], error: null }
  cliente.respostas['versoes.select'] = { data: [], error: null }
  expect((await criar(cliente).lerProcesso('p1'))?.ultimaVersao).toBeNull()
})

test('falha ao ler a versão mais recente vira erro com o motivo do banco', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['processos_com_andamento.select'] = { data: [LINHA], error: null }
  cliente.respostas['versoes.select'] = { data: null, error: { message: 'sem conexão' } }
  await expect(criar(cliente).lerProcesso('p1')).rejects.toThrow('Falha ao ler a versão mais recente do processo: sem conexão')
})
