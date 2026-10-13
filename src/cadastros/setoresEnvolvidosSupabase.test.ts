import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { ClienteSupabaseFalso } from '../testes/ClienteSupabaseFalso'
import type { Database } from '../types/database'
import { CadastroInexistente } from './cadastroInexistente'
import { criarCadastrosSupabase } from './cadastrosSupabase'

function criar(cliente: ClienteSupabaseFalso) {
  return criarCadastrosSupabase(cliente as unknown as SupabaseClient<Database>)
}
type Modulo = ReturnType<typeof criar>

const FILTROS = [['macroprocesso_id', 'm1'], ['setor_id', 's1']]
const PERFIL = 'Seu perfil não permite alterar os cadastros.'

describe('setores envolvidos no módulo real', () => {
  test('pôr insere os dois ids em setores_envolvidos', async () => {
    const cliente = new ClienteSupabaseFalso()
    await criar(cliente).porSetorNoMacroprocesso('m1', 's1')
    expect(cliente.pedidos[0]).toMatchObject({
      tabela: 'setores_envolvidos', operacao: 'insert', valores: { macroprocesso_id: 'm1', setor_id: 's1' } })
  })

  test('pôr um setor que já está lá vira a frase com a sigla, buscada em setores', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['setores_envolvidos.insert'] = { data: null, error: { code: '23505',
      message: 'duplicate key value violates unique constraint "setores_envolvidos_pkey"' } }
    cliente.respostas['setores.select'] = { data: [{ sigla: 'TSA' }], error: null }
    const falha = await criar(cliente).porSetorNoMacroprocesso('m1', 's1').catch((erro: unknown) => erro)
    expect(falha).toBeInstanceOf(TravaDoBanco)
    expect((falha as Error).message).toBe('O setor TSA já está neste macroprocesso.')
    expect(cliente.pedidos[1]).toMatchObject({ tabela: 'setores', colunas: 'sigla', filtro: ['id', 's1'] })
  })

  test('pôr com setor ou macroprocesso que sumiu (23503) vira CadastroInexistente', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['setores_envolvidos.insert'] = { data: null, error: { code: '23503',
      message: 'insert or update on table "setores_envolvidos" violates foreign key constraint' } }
    await expect(criar(cliente).porSetorNoMacroprocesso('m1', 's1')).rejects.toBeInstanceOf(CadastroInexistente)
  })

  test('pôr recusado pelo perfil (42501) vira a frase pronta', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['setores_envolvidos.insert'] = { data: null, error: { code: '42501',
      message: 'new row violates row-level security policy for table "setores_envolvidos"' } }
    const falha = await criar(cliente).porSetorNoMacroprocesso('m1', 's1').catch((erro: unknown) => erro)
    expect(falha).toBeInstanceOf(TravaDoBanco)
    expect((falha as Error).message).toBe(PERFIL)
  })

  test('outra falha vira motivo genérico com a mensagem do banco', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['setores_envolvidos.insert'] = { data: null, error: { code: '08006', message: 'conexão perdida' } }
    const falha = await criar(cliente).porSetorNoMacroprocesso('m1', 's1').catch((erro: unknown) => erro)
    expect(falha).not.toBeInstanceOf(TravaDoBanco)
    expect((falha as Error).message).toBe('erro inesperado do banco (conexão perdida)')
  })

  test('tirar apaga pelos dois ids', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['setores_envolvidos.delete'] = { data: [{ setor_id: 's1' }], error: null }
    await criar(cliente).tirarSetorDoMacroprocesso('m1', 's1')
    expect(cliente.pedidos[0]).toMatchObject({ tabela: 'setores_envolvidos', operacao: 'delete', filtros: FILTROS })
  })

  test('anotar grava só a observação, pelos dois ids', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['setores_envolvidos.update'] = { data: [{ setor_id: 's1' }], error: null }
    await criar(cliente).mudarObservacaoDoSetorEnvolvido('m1', 's1', 'Papel fictício')
    expect(cliente.pedidos[0]).toMatchObject({
      tabela: 'setores_envolvidos', operacao: 'update', valores: { observacao: 'Papel fictício' }, filtros: FILTROS })
  })

  test.each([
    ['delete', (m: Modulo) => m.tirarSetorDoMacroprocesso('m1', 's1')],
    ['update', (m: Modulo) => m.mudarObservacaoDoSetorEnvolvido('m1', 's1', null)],
  ])('%s sem nenhuma linha afetada e vínculo que não existe mais: resolve em silêncio', async (operacao, chamar) => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas[`setores_envolvidos.${operacao}`] = { data: [], error: null }
    cliente.respostas['setores_envolvidos.select'] = { data: [], error: null }
    await expect(chamar(criar(cliente))).resolves.toBeUndefined()
  })

  test.each([
    ['delete', (m: Modulo) => m.tirarSetorDoMacroprocesso('m1', 's1')],
    ['update', (m: Modulo) => m.mudarObservacaoDoSetorEnvolvido('m1', 's1', null)],
  ])('%s sem nenhuma linha afetada com o vínculo ainda lá: o perfil não permite', async (operacao, chamar) => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas[`setores_envolvidos.${operacao}`] = { data: [], error: null }
    cliente.respostas['setores_envolvidos.select'] = { data: [{ setor_id: 's1' }], error: null }
    const falha = await chamar(criar(cliente)).catch((erro: unknown) => erro)
    expect(falha).toBeInstanceOf(TravaDoBanco)
    expect((falha as Error).message).toBe(PERFIL)
  })
})
