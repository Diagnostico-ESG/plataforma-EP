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
  etapa_atual_nome: 'Reunião de modelagem', etapa_atual_ordem: 4, aguardando_o_setor: false,
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
      etapaAtual: { codigo: 'modelagem', nome: 'Reunião de modelagem', ordem: 4 }, aguardandoOSetor: false,
      responsavel: { id: 'u1', nome: 'Ana Teste', fotoUrl: null },
    }],
  })
  expect(cliente.pedidos).toMatchObject([
    { tabela: 'processos_com_andamento', ordem: [['nome', true]] },
    { tabela: 'etapas', filtro: ['nivel', 'processo'], ordem: [['ordem', true]] },
  ])
})

test('processo sem etapa atual e sem responsável chega com nulos; aguardando o setor vem da view', async () => {
  const cliente = new ClienteSupabaseFalso()
  const aguardando = { ...LINHA, etapa_atual_codigo: null, etapa_atual_nome: null, etapa_atual_ordem: null,
    etapa_atual_id: null, aguardando_o_setor: true, responsavel_id: null, responsavel_nome: null }
  cliente.respostas['processos_com_andamento.select'] = { data: [aguardando], error: null }
  const { processos } = await criar(cliente).listarProcessos()
  expect(processos[0]).toMatchObject({ etapaAtual: null, aguardandoOSetor: true, responsavel: null })
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
