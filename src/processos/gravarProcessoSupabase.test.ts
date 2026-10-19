import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { CadastroInexistente } from '../cadastros/cadastroInexistente'
import { ClienteSupabaseFalso } from '../testes/ClienteSupabaseFalso'
import type { Database } from '../types/database'
import { criarProcessosSupabase } from './processosSupabase'
import type { DadosDoProcesso } from './tipos'

const DADOS: DadosDoProcesso = {
  nome: 'Emitir Ofício Fictício', setorId: 's1', macroprocessoId: 'm1', tipo: 'a_classificar', processoPaiId: null,
  origem: 'novo', contexto: 'Contexto inventado', observacoes: null,
}
const PERFIL = 'Seu perfil não permite alterar os processos.'

function criar(cliente: ClienteSupabaseFalso) {
  return criarProcessosSupabase(cliente as unknown as SupabaseClient<Database>)
}
type Modulo = ReturnType<typeof criar>

async function falhaDe(gravar: Promise<unknown>): Promise<Error> {
  return (await gravar.catch((erro: unknown) => erro)) as Error
}

describe('gravação de processos no módulo real', () => {
  test('criar devolve o id do processo criado e o pede ao banco', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['processos.insert'] = { data: [{ id: 'p9' }], error: null }
    expect(await criar(cliente).criarProcesso(DADOS)).toBe('p9')
    expect(cliente.pedidos[0].colunas).toBe('id')
  })

  test('criar sem o id de volta é falha, com o valor recebido e o formato esperado', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['processos.insert'] = { data: [], error: null }
    const falha = await falhaDe(criar(cliente).criarProcesso(DADOS))
    expect(falha.message).toBe('O banco não devolveu o id do processo criado: recebido [], esperado uma linha com id.')
  })

  test('criar insere os campos do cadastro, com o tipo', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['processos.insert'] = { data: [{ id: 'p9' }], error: null }
    await criar(cliente).criarProcesso(DADOS)
    expect(cliente.pedidos[0]).toMatchObject({ tabela: 'processos', operacao: 'insert', valores: {
      setor_id: 's1', macroprocesso_id: 'm1', nome: DADOS.nome, tipo: 'a_classificar', processo_pai_id: null,
      origem: 'novo', contexto: 'Contexto inventado', observacoes: null } })
  })

  test('criar um subprocesso manda o pai', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['processos.insert'] = { data: [{ id: 'p9' }], error: null }
    await criar(cliente).criarProcesso({ ...DADOS, tipo: 'subprocesso', processoPaiId: 'p0' })
    expect(cliente.pedidos[0].valores).toMatchObject({ tipo: 'subprocesso', processo_pai_id: 'p0' })
  })

  test('o pai que não é Processo vira a frase do critério', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['processos.insert'] = { data: null, error: { code: 'P0001', message: 'pai_nao_e_processo' } }
    const falha = await falhaDe(criar(cliente).criarProcesso({ ...DADOS, tipo: 'subprocesso', processoPaiId: 'p0' }))
    expect(falha).toBeInstanceOf(TravaDoBanco)
    expect(falha.message).toBe('O processo pai precisa ser do tipo Processo.')
  })

  test('excluir processo com subprocessos vira a frase com a contagem', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['processos.delete'] = { data: null, error: { code: 'P0001', message: 'processo_com_subprocessos:3' } }
    const falha = await falhaDe(criar(cliente).excluirProcesso('p1'))
    expect(falha).toBeInstanceOf(TravaDoBanco)
    expect(falha.message).toBe('Este processo tem 3 subprocessos; reclassifique-os ou exclua-os antes.')
  })

  test('editar atualiza os campos editáveis pelo id e não manda o tipo nem o pai', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['processos.update'] = { data: [{ id: 'p1' }], error: null }
    await criar(cliente).editarProcesso('p1', { ...DADOS, tipo: 'processo' })
    expect(cliente.pedidos[0]).toMatchObject({ tabela: 'processos', operacao: 'update', filtro: ['id', 'p1'] })
    expect(cliente.pedidos[0].valores).not.toHaveProperty('tipo')
    expect(cliente.pedidos[0].valores).not.toHaveProperty('processo_pai_id')
    expect(cliente.pedidos[0].valores).toMatchObject({ nome: DADOS.nome, setor_id: 's1', macroprocesso_id: 'm1' })
  })

  test('excluir apaga pelo id', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['processos.delete'] = { data: [{ id: 'p1' }], error: null }
    await criar(cliente).excluirProcesso('p1')
    expect(cliente.pedidos[0]).toMatchObject({ tabela: 'processos', operacao: 'delete', filtro: ['id', 'p1'] })
  })

  test.each([
    ['insert', (m: Modulo) => m.criarProcesso(DADOS)],
    ['update', (m: Modulo) => m.editarProcesso('p1', DADOS)],
  ])('nome repetido no setor (%s) vira a frase com o nome e a sigla, buscada em setores', async (operacao, gravar) => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas[`processos.${operacao}`] = { data: null, error: { code: '23505',
      message: 'duplicate key value violates unique constraint "processos_nome_unico"' } }
    cliente.respostas['setores.select'] = { data: [{ sigla: 'TSA' }], error: null }
    const falha = await falhaDe(gravar(criar(cliente)))
    expect(falha).toBeInstanceOf(TravaDoBanco)
    expect(falha.message).toBe('Já existe um processo com o nome Emitir Ofício Fictício no setor TSA.')
  })

  test('recusa por perfil vira a frase dos processos', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['processos.insert'] = { data: null, error: { code: '42501', message: 'violates row-level security' } }
    const falha = await falhaDe(criar(cliente).criarProcesso(DADOS))
    expect(falha).toBeInstanceOf(TravaDoBanco)
    expect(falha.message).toBe(PERFIL)
  })

  test('setor ou macroprocesso excluído enquanto o formulário estava aberto: CadastroInexistente', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['processos.insert'] = { data: null, error: { code: '23503', message: 'violates foreign key' } }
    await expect(criar(cliente).criarProcesso(DADOS)).rejects.toBeInstanceOf(CadastroInexistente)
  })

  test.each([
    ['update', (m: Modulo) => m.editarProcesso('p1', DADOS)],
    ['delete', (m: Modulo) => m.excluirProcesso('p1')],
  ])('%s sem nenhuma linha afetada e processo que sumiu: CadastroInexistente', async (operacao, gravar) => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas[`processos.${operacao}`] = { data: [], error: null }
    cliente.respostas['processos.select'] = { data: [], error: null }
    await expect(gravar(criar(cliente))).rejects.toBeInstanceOf(CadastroInexistente)
  })

  test('nenhuma linha afetada com o processo ainda lá: o perfil não permite', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['processos.update'] = { data: [], error: null }
    cliente.respostas['processos.select'] = { data: [{ id: 'p1' }], error: null }
    const falha = await falhaDe(criar(cliente).editarProcesso('p1', DADOS))
    expect(falha).toBeInstanceOf(TravaDoBanco)
    expect(falha.message).toBe(PERFIL)
  })

  test.each([['2026-10-20'], [null]])('marcar a reunião grava a data (%s) pelo id', async (data) => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['processos.update'] = { data: [{ id: 'p1' }], error: null }
    await criar(cliente).marcarReuniao('p1', data)
    expect(cliente.pedidos[0]).toMatchObject({
      tabela: 'processos', operacao: 'update', filtro: ['id', 'p1'], valores: { data_da_reuniao: data },
    })
  })

  test('marcar a reunião sem linha afetada: perfil ou processo que sumiu', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['processos.update'] = { data: [], error: null }
    cliente.respostas['processos.select'] = { data: [{ id: 'p1' }], error: null }
    expect((await falhaDe(criar(cliente).marcarReuniao('p1', '2026-10-20'))).message).toBe(PERFIL)
    cliente.respostas['processos.select'] = { data: [], error: null }
    await expect(criar(cliente).marcarReuniao('p1', null)).rejects.toBeInstanceOf(CadastroInexistente)
  })

  test('falha do banco ao marcar a reunião vira Error com o motivo', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['processos.update'] = { data: null, error: { code: '08006', message: 'conexão caiu' } }
    expect((await falhaDe(criar(cliente).marcarReuniao('p1', '2026-10-20'))).message).toContain('conexão caiu')
  })
})
