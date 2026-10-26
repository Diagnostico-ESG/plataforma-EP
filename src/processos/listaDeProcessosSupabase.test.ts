import type { SupabaseClient } from '@supabase/supabase-js'
import { expect, test } from 'vitest'
import { ClienteSupabaseFalso } from '../testes/ClienteSupabaseFalso'
import type { Database } from '../types/database'
import { criarProcessosSupabase } from './processosSupabase'

const LINHA = {
  id: 'p1', nome: 'Emitir Ofício Fictício', tipo: 'a_classificar', processo_pai_id: null, origem: 'novo',
  situacao_guardada: 'em_andamento', motivo_da_situacao: null, contexto: null, observacoes: null,
  criado_em: '2026-10-14T10:00:00Z', setor_id: 's1', setor_sigla: 'TSA', macroprocesso_id: 'm1',
  macroprocesso_nome: 'Macro de Teste', situacao: 'em_andamento', etapa_atual_id: 'e4', etapa_atual_codigo: 'modelagem',
  etapa_atual_nome: 'Modelagem piloto', etapa_atual_ordem: 2, etapa_atual_posicao: 2, etiqueta: 'em_andamento',
  entrou_na_etapa_em: '2026-10-01T15:30:00+00:00',
  responsavel_id: 'u1', responsavel_nome: 'Ana Teste', responsavel_foto_url: null,
}
const ETAPAS = [
  { id: 'e1', codigo: 'nao_iniciados', nome: 'Não iniciados', ordem: 1, ativa: true },
  { id: 'e4', codigo: 'modelagem', nome: 'Modelagem piloto', ordem: 2, ativa: true },
  { id: 'e9', codigo: 'antiga', nome: 'Antiga', ordem: 3, ativa: false },
  { id: 'e8', codigo: 'concluidos', nome: 'Concluídos', ordem: 4, ativa: true },
]

function criar(cliente: ClienteSupabaseFalso) {
  return criarProcessosSupabase(cliente as unknown as SupabaseClient<Database>)
}

test('lista os processos por nome e as etapas na ordem do catálogo, com a posição e o total entre as ativas', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['processos_com_andamento.select'] = { data: [LINHA], error: null }
  cliente.respostas['etapas.select'] = { data: ETAPAS, error: null }
  expect(await criar(cliente).listarProcessos()).toEqual({
    etapas: ETAPAS,
    processos: [{
      id: 'p1', nome: 'Emitir Ofício Fictício', tipo: 'a_classificar', setorId: 's1', setorSigla: 'TSA',
      macroprocessoId: 'm1', macroprocessoNome: 'Macro de Teste', processoPaiId: null, situacao: 'em_andamento',
      etapaAtual: { id: 'e4', codigo: 'modelagem', nome: 'Modelagem piloto', ordem: 2, posicao: 2, total: 3 },
      etiqueta: 'em_andamento', entrouNaEtapaEm: '2026-10-01',
      responsavel: { id: 'u1', nome: 'Ana Teste', fotoUrl: null },
      cartao: { responsavelAtivo: null, ultimaVersao: null, subprocessos: 0 },
      arquivos: { versaoPiloto: false, versaoEmSequencia: false, relatorioNumerado: false },
    }],
  })
  expect(cliente.pedidos).toMatchObject([
    { tabela: 'processos_com_andamento', ordem: [['nome', true]] },
    { tabela: 'etapas', ordem: [['ordem', true]] },
  ])
})

test('processo sem etapa atual e sem responsável chega com nulos', async () => {
  const cliente = new ClienteSupabaseFalso()
  const semEtapa = { ...LINHA, etapa_atual_codigo: null, etapa_atual_nome: null, etapa_atual_ordem: null,
    etapa_atual_id: null, responsavel_id: null, responsavel_nome: null }
  cliente.respostas['processos_com_andamento.select'] = { data: [semEtapa], error: null }
  const { processos } = await criar(cliente).listarProcessos()
  expect(processos[0]).toMatchObject({ etapaAtual: null, responsavel: null })
})

test('os campos novos da view chegam ao cartão do processo na lista', async () => {
  const cliente = new ClienteSupabaseFalso()
  const completa = { ...LINHA, responsavel_ativo: false, ultima_versao_numero: 2,
    ultima_versao_historica: false, ultima_versao_tem_relatorio: true, subprocessos_quantidade: 3, data_da_modelagem_piloto: '2026-10-25',
    publicado_em: '2026-10-20' }
  cliente.respostas['processos_com_andamento.select'] = { data: [completa], error: null }
  const { processos } = await criar(cliente).listarProcessos()
  expect(processos[0].dataDaModelagemPiloto).toBe('2026-10-25')
  expect(processos[0].publicadoEm).toBe('2026-10-20')
  expect(processos[0].cartao).toEqual({ responsavelAtivo: false, ultimaVersao: { numero: 2, historica: false, temRelatorio: true }, subprocessos: 3 })
})

test('o que o processo tem de arquivos chega para a trava de arquivos', async () => {
  const cliente = new ClienteSupabaseFalso()
  const comArquivos = { ...LINHA, tem_versao_piloto: true, tem_versao_em_sequencia: false, tem_relatorio_numerado: true }
  cliente.respostas['processos_com_andamento.select'] = { data: [comArquivos], error: null }
  const { processos } = await criar(cliente).listarProcessos()
  expect(processos[0].arquivos).toEqual({ versaoPiloto: true, versaoEmSequencia: false, relatorioNumerado: true })
})

test('a situação calculada "concluido" chega como está', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['processos_com_andamento.select'] = { data: [{ ...LINHA, situacao: 'concluido' }], error: null }
  expect((await criar(cliente).listarProcessos()).processos[0].situacao).toBe('concluido')
})

test.each(['processos_com_andamento', 'etapas'])('falha ao ler %s vira erro com o motivo do banco', async (tabela) => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas[`${tabela}.select`] = { data: null, error: { message: 'sem conexão' } }
  await expect(criar(cliente).listarProcessos()).rejects.toThrow(/sem conexão/)
})
