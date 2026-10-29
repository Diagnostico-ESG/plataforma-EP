import type { SupabaseClient } from '@supabase/supabase-js'
import { expect, test } from 'vitest'
import { ClienteSupabaseFalso } from '../testes/ClienteSupabaseFalso'
import type { Database } from '../types/database'
import { criarProcessosSupabase } from './processosSupabase'

const LINHA = {
  id: 'p1', nome: 'Emitir Ofício Fictício', tipo: 'processo', processo_pai_id: null,
  situacao_guardada: 'em_andamento', motivo_da_situacao: null,
  criado_em: '2026-10-14T10:00:00Z', setor_id: 's1', setor_sigla: 'TSA', macroprocesso_id: 'm1',
  macroprocesso_nome: 'Macro de Teste', situacao: 'em_andamento', etapa_atual_id: 'e4', etapa_atual_codigo: 'modelagem',
  etapa_atual_nome: 'Modelagem piloto', etapa_atual_ordem: 2, etapa_atual_posicao: 2, etiqueta: 'a_fazer',
  entrou_na_etapa_em: '2026-10-04T12:00:00+00:00', responsavel_id: null, responsavel_nome: null, responsavel_foto_url: null,
}
const ETAPAS = [
  { id: 'e1', codigo: 'nao_iniciados', nome: 'Não iniciados', ordem: 1 },
  { id: 'e4', codigo: 'modelagem', nome: 'Modelagem piloto', ordem: 2 },
  { id: 'e8', codigo: 'concluidos', nome: 'Concluídos', ordem: 3 },
]

function criar(cliente: ClienteSupabaseFalso) {
  return criarProcessosSupabase(cliente as unknown as SupabaseClient<Database>)
}

test('lê o processo com as etapas ativas (ordem do catálogo) e as passagens dele em dias de Brasília, a mais recente primeiro', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['processos_com_andamento.select'] = { data: [LINHA], error: null }
  cliente.respostas['etapas.select'] = { data: ETAPAS, error: null }
  cliente.respostas['passagens.select'] = { data: [
    { etapa_id: 'e4', entrou_em: '2026-10-05T02:00:00+00:00', saiu_em: null },
    { etapa_id: 'e1', entrou_em: '2026-10-01T15:00:00+00:00', saiu_em: '2026-10-05T02:00:00+00:00' },
  ], error: null }
  const lido = await criar(cliente).lerProcesso('p1')
  expect(lido).toMatchObject({
    id: 'p1', nome: 'Emitir Ofício Fictício',
    motivoDaSituacao: null, etapaAtual: { codigo: 'modelagem', posicao: 2, total: 3 },
  })
  expect(lido?.etapasDoVerso).toEqual([
    { id: 'e1', codigo: 'nao_iniciados', nome: 'Não iniciados', ordem: 1, passagens: [{ entrouEm: '2026-10-01', saiuEm: '2026-10-04' }] },
    { id: 'e4', codigo: 'modelagem', nome: 'Modelagem piloto', ordem: 2, passagens: [{ entrouEm: '2026-10-04', saiuEm: null }] },
    { id: 'e8', codigo: 'concluidos', nome: 'Concluídos', ordem: 3, passagens: [] },
  ])
  expect(cliente.pedidos.find((pedido) => pedido.tabela === 'passagens')).toMatchObject({
    filtro: ['processo_id', 'p1'], ordem: [['entrou_em', false]],
  })
  expect(cliente.pedidos.find((pedido) => pedido.tabela === 'etapas')).toMatchObject({ filtro: ['ativa', true], ordem: [['ordem', true]] })
})

test('a etapa nunca visitada vem sem passagens', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['processos_com_andamento.select'] = { data: [LINHA], error: null }
  cliente.respostas['etapas.select'] = { data: ETAPAS, error: null }
  const lido = await criar(cliente).lerProcesso('p1')
  expect(lido?.etapasDoVerso.map((etapa) => etapa.passagens)).toEqual([[], [], []])
})

test.each(['etapas', 'passagens'])('falha ao ler %s vira erro com o motivo do banco', async (tabela) => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['processos_com_andamento.select'] = { data: [LINHA], error: null }
  cliente.respostas[`${tabela}.select`] = { data: null, error: { message: 'sem conexão' } }
  await expect(criar(cliente).lerProcesso('p1')).rejects.toThrow(/sem conexão/)
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
    tabela: 'eventos', dentro: ['entidade', ['processo', 'passagem', 'versao', 'revisao_interna', 'aprovacao', 'anexo']], parecido: ['entidade_ref', 'p1%'],
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
  cliente.respostas['processos_com_andamento.select'] = { data: [{ ...LINHA, data_da_modelagem_piloto: data }], error: null }

  expect((await criar(cliente).lerProcesso('p1'))?.dataDaModelagemPiloto).toBe(data)
})

test('o processo traz a versão mais recente não histórica, com o autor e os papéis dos arquivos', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['processos_com_andamento.select'] = { data: [LINHA], error: null }
  cliente.respostas['versoes.select'] = {
    data: [{ numero: 3, enviada_por: 'u1', autor: { nome: 'Ana Teste' }, arquivos: [{ papel: 'bpmn' }, { papel: 'png' }] }], error: null,
  }
  const lido = await criar(cliente).lerProcesso('p1')
  expect(lido?.ultimaVersao).toEqual({ numero: 3, autorId: 'u1', autorNome: 'Ana Teste', papeis: ['bpmn', 'png'], enviadaNestaPassagem: false })
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
    enviadaNestaPassagem: false,
  })
})

// A "corrigida" só vale para a versão enviada pela Revisão interna depois da entrada na passagem aberta.
test.each([
  ['enviada pela Revisão interna depois da entrada', 'revisao_interna', '2026-10-20T15:00:00Z', true],
  ['enviada antes da entrada na passagem', 'revisao_interna', '2026-10-20T09:00:00Z', false],
  ['enviada por outra etapa', 'modelagem', '2026-10-20T15:00:00Z', false],
])('a última versão %s: enviadaNestaPassagem', async (_nome, etapa, enviadaEm, esperado) => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['processos_com_andamento.select'] = { data: [LINHA], error: null }
  cliente.respostas['versoes.select'] = {
    data: [{ numero: 8, enviada_por: 'u1', enviada_em: enviadaEm, autor: { nome: 'Ana Teste' }, etapa: { codigo: etapa }, arquivos: [] }],
    error: null,
  }
  cliente.respostas['passagens.select'] = { data: [{ entrou_em: '2026-10-20T12:00:00Z' }], error: null }
  expect((await criar(cliente).lerProcesso('p1'))?.ultimaVersao?.enviadaNestaPassagem).toBe(esperado)
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
