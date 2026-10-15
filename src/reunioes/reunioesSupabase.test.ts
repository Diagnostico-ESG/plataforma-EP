import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { CadastroInexistente } from '../cadastros/cadastroInexistente'
import { ClienteSupabaseFalso } from '../testes/ClienteSupabaseFalso'
import type { Database } from '../types/database'
import { criarReunioesSupabase } from './reunioesSupabase'
import type { DadosDaReuniao } from './tipos'

const LINHA = {
  id: 'r1', tipo: 'modelagem', data: '2026-10-20', hora: '09:30:00', local: 'Sala 1', anotacoes: null, outros_participantes: ['Ana'], setor_id: 's1',
  setores: { sigla: 'TSA', ativo: true },
  reunioes_processos: [
    { processos: { id: 'p2', nome: 'Pagar Diária', situacao: 'em_andamento' } },
    { processos: { id: 'p1', nome: 'Arquivar Pasta', situacao: 'cancelado' } },
  ],
  reunioes_usuarios: [
    { usuarios: { id: 'u2', nome: 'Caio Teste', ativo: false } },
    { usuarios: { id: 'u1', nome: 'Ana Teste', ativo: true } },
  ],
  reunioes_responsaveis: [{ responsaveis_do_setor: { id: 'x1', nome: 'Dani Teste' } }],
}
const DADOS: DadosDaReuniao = {
  tipo: 'modelagem', setorId: 's1', data: '2026-10-20', hora: '09:30', local: 'Sala 1', anotacoes: null, processosIds: ['p1'],
  usuariosIds: ['u1'], responsaveisIds: ['x1'], outrosParticipantes: ['Ana'],
}

function criar(cliente: ClienteSupabaseFalso) {
  return criarReunioesSupabase(cliente as unknown as SupabaseClient<Database>)
}

test('lista as reuniões com o setor e os processos por nome, a hora sem os segundos e o cancelado marcado', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['reunioes.select'] = { data: [LINHA], error: null }
  expect(await criar(cliente).listarReunioes()).toEqual([{
    id: 'r1', tipo: 'modelagem', setorId: 's1', setorSigla: 'TSA', setorAtivo: true, data: '2026-10-20', hora: '09:30',
    local: 'Sala 1', anotacoes: null, outrosParticipantes: ['Ana'],
    processos: [{ id: 'p1', nome: 'Arquivar Pasta', cancelado: true }, { id: 'p2', nome: 'Pagar Diária', cancelado: false }],
    usuarios: [{ id: 'u1', nome: 'Ana Teste', ativo: true }, { id: 'u2', nome: 'Caio Teste', ativo: false }],
    responsaveis: [{ id: 'x1', nome: 'Dani Teste' }],
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

test('os usuários da escolha são só os ativos, por nome', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['usuarios.select'] = { data: [{ id: 'u1', nome: 'Ana Teste', ativo: true }], error: null }
  expect(await criar(cliente).listarUsuariosAtivos()).toEqual([{ id: 'u1', nome: 'Ana Teste', ativo: true }])
  expect(cliente.pedidos[0]).toMatchObject({ tabela: 'usuarios', filtro: ['ativo', true], ordem: [['nome', true]] })
})

test('os responsáveis da escolha são os do setor, por nome', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['responsaveis_do_setor.select'] = { data: [{ id: 'x1', nome: 'Dani Teste' }], error: null }
  expect(await criar(cliente).listarResponsaveisDoSetor('s1')).toEqual([{ id: 'x1', nome: 'Dani Teste' }])
  expect(cliente.pedidos[0]).toMatchObject({ tabela: 'responsaveis_do_setor', filtro: ['setor_id', 's1'], ordem: [['nome', true]] })
})

test('a leitura dos usuários e a dos responsáveis que falham viram erro com o motivo', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['usuarios.select'] = { data: null, error: { message: 'sem rede' } }
  cliente.respostas['responsaveis_do_setor.select'] = { data: null, error: { message: 'sem rede' } }
  await expect(criar(cliente).listarUsuariosAtivos()).rejects.toThrow('Falha ao ler os usuários: sem rede')
  await expect(criar(cliente).listarResponsaveisDoSetor('s1'))
    .rejects.toThrow('Falha ao ler os responsáveis do setor s1: sem rede')
})

test('a recusa de responsável de outro setor chega como TravaDoBanco com a frase pronta', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['rpc.salvar_reuniao'] = { data: null, error: { message: 'responsavel_de_outro_setor:Olga Teste', code: 'P0001' } }
  const falha = await criar(cliente).salvarReuniao(null, DADOS).catch((erro: unknown) => erro)
  expect(falha).toBeInstanceOf(TravaDoBanco)
  expect((falha as Error).message).toBe('O responsável Olga Teste não é do setor da reunião.')
})

test('salvar chama a função do banco com os parâmetros, inclusive os participantes; id nulo cria', async () => {
  const cliente = new ClienteSupabaseFalso()
  await criar(cliente).salvarReuniao(null, DADOS)
  expect(cliente.pedidos[0]).toMatchObject({
    tabela: 'rpc', operacao: 'salvar_reuniao',
    valores: {
      p_id: null, p_tipo: 'modelagem', p_setor_id: 's1', p_data: '2026-10-20', p_hora: '09:30', p_local: 'Sala 1',
      p_anotacoes: null, p_outros: ['Ana'], p_processos: ['p1'], p_usuarios: ['u1'], p_responsaveis: ['x1'],
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

test('alterar chama a função do banco com o id da reunião', async () => {
  const cliente = new ClienteSupabaseFalso()
  await criar(cliente).salvarReuniao('r1', DADOS)
  expect(cliente.pedidos[0]).toMatchObject({ tabela: 'rpc', operacao: 'salvar_reuniao', valores: { p_id: 'r1' } })
})

test('alterar reunião que sumiu chega como CadastroInexistente', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['rpc.salvar_reuniao'] = { data: null, error: { message: 'registro_inexistente', code: 'P0001' } }
  await expect(criar(cliente).salvarReuniao('r1', DADOS)).rejects.toBeInstanceOf(CadastroInexistente)
})

test('excluir apaga pelo id e confere a linha afetada', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['reunioes.delete'] = { data: [{ id: 'r1' }], error: null }
  await criar(cliente).excluirReuniao('r1')
  expect(cliente.pedidos[0]).toMatchObject({ tabela: 'reunioes', operacao: 'delete', filtro: ['id', 'r1'], colunas: 'id' })
})

test('excluir sem linha afetada: reunião que sumiu é CadastroInexistente, reunião ainda lá é falta de permissão', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['reunioes.delete'] = { data: [], error: null }
  cliente.respostas['reunioes.select'] = { data: [], error: null }
  await expect(criar(cliente).excluirReuniao('r1')).rejects.toBeInstanceOf(CadastroInexistente)
  cliente.respostas['reunioes.select'] = { data: [{ id: 'r1' }], error: null }
  const falha = await criar(cliente).excluirReuniao('r1').catch((erro: unknown) => erro)
  expect(falha).toBeInstanceOf(TravaDoBanco)
  expect((falha as Error).message).toBe('Seu perfil não permite alterar as reuniões.')
})

test('excluir com recusa de perfil do banco chega como TravaDoBanco', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['reunioes.delete'] = { data: null, error: { message: 'permission denied', code: '42501' } }
  await expect(criar(cliente).excluirReuniao('r1')).rejects.toBeInstanceOf(TravaDoBanco)
})

test('o histórico da reunião pede os eventos dela, do mais recente para o mais antigo, e converte as linhas', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['eventos.select'] = { data: [{
    id: 7, ocorrido_em: '2026-10-14T15:00:00Z', acao: 'editar', entidade: 'reuniao', entidade_ref: 'r1',
    detalhes: { antes: { local: 'Sala 1' }, depois: { local: 'Sala 2' } }, autor: { nome: 'Pessoa Fictícia' },
  }], error: null }
  expect(await criar(cliente).lerHistoricoDaReuniao('r1')).toEqual([{
    id: 7, ocorridoEm: '2026-10-14T15:00:00Z', autor: 'Pessoa Fictícia', acao: 'editar', entidade: 'reuniao',
    entidadeRef: 'r1', antes: { local: 'Sala 1' }, depois: { local: 'Sala 2' },
  }])
  expect(cliente.pedidos[0]).toMatchObject({
    tabela: 'eventos', filtros: [['entidade', 'reuniao'], ['entidade_ref', 'r1']], ordem: [['ocorrido_em', false], ['id', false]],
  })
})

test('o histórico que falha vira erro com o motivo', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['eventos.select'] = { data: null, error: { message: 'sem rede' } }
  await expect(criar(cliente).lerHistoricoDaReuniao('r1')).rejects.toThrow('Falha ao ler o histórico da reunião r1: sem rede')
})

describe('eventos de reunião de um processo', () => {
  const evento = (id: number, antes: unknown, depois: unknown) => ({
    id, ocorrido_em: `2026-10-1${id}T15:00:00Z`, acao: 'editar', entidade: 'reuniao', entidade_ref: `r${id}`,
    detalhes: { antes, depois }, autor: { nome: 'Pessoa Fictícia' },
  })
  const COM_P1 = { processos: [{ id: 'p1', nome: 'Emitir Ofício' }] }
  const COM_P2 = { processos: [{ id: 'p2', nome: 'Pagar Diária' }] }

  test('traz só os eventos que citam o processo no estado de antes ou de depois, inclusive a reunião excluída', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['eventos.select'] = { data: [
      evento(1, null, COM_P1), evento(2, COM_P2, COM_P2), evento(3, COM_P1, null), evento(4, { local: 'x' }, { local: 'y' }),
    ], error: null }
    const lidos = await criar(cliente).lerEventosDeReuniaoDoProcesso('p1')
    expect(lidos.map((lido) => lido.id)).toEqual([1, 3])
    expect(cliente.pedidos[0]).toMatchObject({
      tabela: 'eventos', filtros: [['entidade', 'reuniao']], ordem: [['ocorrido_em', false], ['id', false]],
    })
  })

  test('a leitura que falha vira erro com o motivo', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['eventos.select'] = { data: null, error: { message: 'sem rede' } }
    await expect(criar(cliente).lerEventosDeReuniaoDoProcesso('p1'))
      .rejects.toThrow('Falha ao ler as reuniões do histórico do processo p1: sem rede')
  })
})
