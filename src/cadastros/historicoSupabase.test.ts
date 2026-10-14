import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, test } from 'vitest'
import { ClienteSupabaseFalso } from '../testes/ClienteSupabaseFalso'
import type { Database } from '../types/database'
import { criarCadastrosSupabase } from './cadastrosSupabase'

const LINHA = {
  id: 7, ocorrido_em: '2026-10-13T15:00:00Z', acao: 'editar', entidade: 'setor', entidade_ref: 's1',
  detalhes: { antes: { nome: 'Antes' }, depois: { nome: 'Depois' } }, autor: { nome: 'Pessoa Fictícia' },
}

function criar(cliente: ClienteSupabaseFalso) {
  return criarCadastrosSupabase(cliente as unknown as SupabaseClient<Database>)
}

describe('histórico dos cadastros no módulo real', () => {
  test('pede só os eventos dos cadastros e das etapas do setor, do mais recente para o mais antigo', async () => {
    const cliente = new ClienteSupabaseFalso()
    await criar(cliente).listarHistoricoDosCadastros()
    expect(cliente.pedidos[0]).toMatchObject({
      tabela: 'eventos', colunas: 'id, ocorrido_em, acao, entidade, entidade_ref, detalhes, autor:usuarios(nome)',
      dentro: ['entidade', ['setor', 'macroprocesso', 'setor_envolvido', 'andamento', 'responsavel_do_setor', 'processo', 'etapa']],
      ordem: [['ocorrido_em', false], ['id', false]],
    })
  })

  test('converte cada linha, com o autor pelo nome', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['eventos.select'] = { data: [LINHA], error: null }
    expect(await criar(cliente).listarHistoricoDosCadastros()).toEqual([{
      id: 7, ocorridoEm: '2026-10-13T15:00:00Z', autor: 'Pessoa Fictícia', acao: 'editar', entidade: 'setor',
      entidadeRef: 's1', antes: { nome: 'Antes' }, depois: { nome: 'Depois' },
    }])
  })

  test('a nota gravada em detalhes.motivo vem no evento', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['eventos.select'] = { data: [{ ...LINHA, entidade: 'andamento', entidade_ref: 's1:a2',
      detalhes: { ...LINHA.detalhes, motivo: 'Setor já conhecido' } }], error: null }
    expect((await criar(cliente).listarHistoricoDosCadastros())[0]?.motivo).toBe('Setor já conhecido')
  })

  test('autor ausente (mudança direta no banco) vira nulo', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['eventos.select'] = { data: [{ ...LINHA, autor: null }], error: null }
    expect((await criar(cliente).listarHistoricoDosCadastros())[0]?.autor).toBeNull()
  })

  test('falha de leitura vira erro com o motivo do banco', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['eventos.select'] = { data: null, error: { message: 'sem conexão' } }
    await expect(criar(cliente).listarHistoricoDosCadastros())
      .rejects.toThrow('Falha ao ler o histórico dos cadastros: sem conexão')
  })
})
