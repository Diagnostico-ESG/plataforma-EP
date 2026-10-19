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
  etapa_atual_nome: 'Reunião de modelagem', etapa_atual_ordem: 4,
  responsavel_id: 'u1', responsavel_nome: 'Ana Teste', responsavel_foto_url: null,
}
const ETAPA = { id: 'e4', codigo: 'modelagem', nome: 'Reunião de modelagem', ordem: 4, ativa: true }

function criar(cliente: ClienteSupabaseFalso) {
  return criarProcessosSupabase(cliente as unknown as SupabaseClient<Database>)
}

test('lista os processos por nome e as etapas de nível processo na ordem do catálogo', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['processos_com_andamento.select'] = { data: [LINHA], error: null }
  cliente.respostas['etapas.select'] = { data: [ETAPA], error: null }
  expect(await criar(cliente).listarProcessos()).toEqual({
    etapas: [ETAPA],
    processos: [{
      id: 'p1', nome: 'Emitir Ofício Fictício', tipo: 'a_classificar', setorId: 's1', setorSigla: 'TSA',
      macroprocessoId: 'm1', macroprocessoNome: 'Macro de Teste', processoPaiId: null, situacao: 'em_andamento',
      etapaAtual: { codigo: 'modelagem', nome: 'Reunião de modelagem', ordem: 4 },
      responsavel: { id: 'u1', nome: 'Ana Teste', fotoUrl: null },
      // As linhas deste teste não trazem os campos novos da view: o cartão chega vazio.
      cartao: { etapaAtualStatus: null, etapaAtualIniciadaEm: null, responsavelAtivo: null, caminho: [], ultimaVersao: null, subprocessos: 0 },
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
  const completa = { ...LINHA, etapa_atual_status: 'em_andamento', etapa_atual_iniciada_em: '2026-10-01', responsavel_ativo: false,
    caminho: [{ etapa_id: 'e4', codigo: 'modelagem', status: 'em_andamento' }], ultima_versao_numero: 2,
    ultima_versao_historica: false, ultima_versao_tem_relatorio: true, subprocessos_quantidade: 3, data_da_reuniao: '2026-10-25' }
  cliente.respostas['processos_com_andamento.select'] = { data: [completa], error: null }
  const { processos } = await criar(cliente).listarProcessos()
  expect(processos[0].dataDaReuniao).toBe('2026-10-25')
  expect(processos[0].cartao).toEqual({ etapaAtualStatus: 'em_andamento', etapaAtualIniciadaEm: '2026-10-01', responsavelAtivo: false,
    caminho: [{ codigo: 'modelagem', status: 'em_andamento' }], ultimaVersao: { numero: 2, historica: false, temRelatorio: true },
    subprocessos: 3 })
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
