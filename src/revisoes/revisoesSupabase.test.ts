import type { SupabaseClient } from '@supabase/supabase-js'
import { expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { CadastroInexistente } from '../cadastros/cadastroInexistente'
import { RECUSAS_DOS_PROCESSOS } from '../processos/processosSupabase'
import { ClienteSupabaseFalso } from '../testes/ClienteSupabaseFalso'
import type { Database } from '../types/database'
import { criarRevisoesSupabase } from './revisoesSupabase'

function criar(cliente: ClienteSupabaseFalso) {
  return criarRevisoesSupabase(cliente as unknown as SupabaseClient<Database>, RECUSAS_DOS_PROCESSOS)
}

function clienteQueRecusa(erro: { message: string; code?: string }) {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['rpc.concluir_revisao_interna'] = { data: null, error: erro }
  return cliente
}

const DADOS = { resultado: 'corrigida', escopo: 'ambos', comentario: 'Ajustei' } as const

test('listar lê as revisões do processo, da mais recente para a mais antiga, com o revisor e as versões', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['revisoes_internas.select'] = {
    data: [
      { id: 'r2', resultado: 'corrigida', escopo: 'ambos', comentario: 'Ajustei', revisada_em: '2026-10-13',
        revisor: { nome: 'Bia Teste' }, revisada: { numero: 7 }, corrigida: { numero: 8 } },
      { id: 'r1', resultado: 'sem_alteracao', escopo: null, comentario: null, revisada_em: '2026-10-12',
        revisor: null, revisada: { numero: 6 }, corrigida: null },
    ],
    error: null,
  }
  const revisoes = await criar(cliente).listarRevisoes('p1')
  expect(revisoes).toEqual([
    { id: 'r2', versaoRevisada: 7, versaoCorrigida: 8, resultado: 'corrigida', escopo: 'ambos', comentario: 'Ajustei',
      revisor: 'Bia Teste', revisadaEm: '2026-10-13' },
    { id: 'r1', versaoRevisada: 6, versaoCorrigida: null, resultado: 'sem_alteracao', escopo: null, comentario: null,
      revisor: null, revisadaEm: '2026-10-12' },
  ])
  expect(cliente.pedidos[0]).toMatchObject({
    tabela: 'revisoes_internas', filtros: [['processo_id', 'p1']], ordem: [['registrada_em', false]],
  })
})

test('falha ao ler as revisões vira erro com o processo e o motivo do banco', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['revisoes_internas.select'] = { data: null, error: { message: 'sem conexão' } }
  await expect(criar(cliente).listarRevisoes('p1')).rejects.toThrow('Falha ao ler as revisões do processo p1: sem conexão')
})

test('concluir chama a função do banco com o andamento, o resultado e o responsável', async () => {
  const cliente = new ClienteSupabaseFalso()
  await criar(cliente).concluirRevisaoInterna('a3', DADOS, 'u2')
  expect(cliente.pedidos).toEqual([{
    tabela: 'rpc', operacao: 'concluir_revisao_interna',
    valores: { p_andamento: 'a3', p_resultado: 'corrigida', p_escopo: 'ambos', p_comentario: 'Ajustei', p_responsavel: 'u2' },
  }])
})

test('sem escopo, comentário e responsável, vão como null', async () => {
  const cliente = new ClienteSupabaseFalso()
  await criar(cliente).concluirRevisaoInterna('a3', { resultado: 'sem_alteracao', escopo: null, comentario: null }, null)
  expect(cliente.pedidos[0].valores).toEqual({
    p_andamento: 'a3', p_resultado: 'sem_alteracao', p_escopo: null, p_comentario: null, p_responsavel: null,
  })
})

test('o autor da versão recusado pelo banco vira a frase da tela', async () => {
  const cliente = clienteQueRecusa({ message: 'revisor_e_autor:7', code: 'P0001' })
  const falha = await criar(cliente).concluirRevisaoInterna('a3', DADOS, null).catch((erro: unknown) => erro)
  expect(falha).toBeInstanceOf(TravaDoBanco)
  expect((falha as Error).message).toBe('Quem enviou a versão V7 não pode revisá-la.')
})

test('falta de privilégio vira a frase do perfil', async () => {
  const cliente = clienteQueRecusa({ message: 'sem permissão para registrar a revisão', code: '42501' })
  const falha = await criar(cliente).concluirRevisaoInterna('a3', DADOS, null).catch((erro: unknown) => erro)
  expect(falha).toBeInstanceOf(TravaDoBanco)
  expect((falha as Error).message).toBe('Seu perfil não permite alterar os processos.')
})

test('etapa que já não existe vira o aviso de cadastro inexistente', async () => {
  const cliente = clienteQueRecusa({ message: 'registro_inexistente', code: 'P0001' })
  const falha = await criar(cliente).concluirRevisaoInterna('a3', DADOS, null).catch((erro: unknown) => erro)
  expect(falha).toBeInstanceOf(CadastroInexistente)
})

const DADOS_DA_APROVACAO = { numeroEprotocolo: 'PROT-1', link: null, aprovadaEm: '2026-10-13' }

function clienteQueRecusaAAprovacao(erro: { message: string; code?: string }) {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['rpc.concluir_aprovacao'] = { data: null, error: erro }
  return cliente
}

test('lerAprovacao lê a aprovação do processo com a versão e quem registrou', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['aprovacoes.select'] = {
    data: [{ id: 'ap1', numero_eprotocolo: 'PROT-1', link: 'https://eprotocolo.example/a', aprovada_em: '2026-10-13',
      registrada_em: '2026-10-13T12:00:00Z', versao: { numero: 8 }, registrador: { nome: 'Bia Teste' } }],
    error: null,
  }
  expect(await criar(cliente).lerAprovacao('p1')).toEqual({
    id: 'ap1', versao: 8, numeroEprotocolo: 'PROT-1', link: 'https://eprotocolo.example/a', aprovadaEm: '2026-10-13',
    registradaPor: 'Bia Teste', registradaEm: '2026-10-13T12:00:00Z',
  })
  expect(cliente.pedidos[0]).toMatchObject({ tabela: 'aprovacoes', filtros: [['processo_id', 'p1']] })
})

test('sem aprovação, lerAprovacao devolve null', async () => {
  expect(await criar(new ClienteSupabaseFalso()).lerAprovacao('p1')).toBeNull()
})

test('falha ao ler a aprovação vira erro com o processo e o motivo do banco', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['aprovacoes.select'] = { data: null, error: { message: 'sem conexão' } }
  await expect(criar(cliente).lerAprovacao('p1')).rejects.toThrow('Falha ao ler a aprovação do processo p1: sem conexão')
})

test('concluirAprovacao chama a função do banco com o andamento, os três campos e o responsável', async () => {
  const cliente = new ClienteSupabaseFalso()
  await criar(cliente).concluirAprovacao('a5', DADOS_DA_APROVACAO, 'u2')
  expect(cliente.pedidos).toEqual([{
    tabela: 'rpc', operacao: 'concluir_aprovacao',
    valores: { p_andamento: 'a5', p_numero: 'PROT-1', p_link: null, p_data: '2026-10-13', p_responsavel: 'u2' },
  }])
})

test.each([
  ['versao_incompleta:8:relatorio', 'A V8 está sem relatório.'],
  ['link_invalido', 'O link do E-protocolo precisa começar com http:// ou https://.'],
  ['aprovacao_antes_da_revisao:2026-10-12:2026-10-13',
    'A data da aprovação (12/10/2026) não pode ser antes da última revisão interna (13/10/2026).'],
  ['sem_aprovacao:8', 'A V8 ainda não tem aprovação registrada. Conclua a Aprovação pelo setor pela janela de concluir.'],
])('a recusa %s do banco vira a frase da tela', async (codigo, frase) => {
  const falha = await criar(clienteQueRecusaAAprovacao({ message: codigo, code: 'P0001' }))
    .concluirAprovacao('a5', DADOS_DA_APROVACAO, null).catch((erro: unknown) => erro)
  expect(falha).toBeInstanceOf(TravaDoBanco)
  expect((falha as Error).message).toBe(frase)
})

test('falta de privilégio na aprovação vira a frase do perfil e etapa que sumiu, o aviso de cadastro inexistente', async () => {
  const semPermissao = await criar(clienteQueRecusaAAprovacao({ message: 'x', code: '42501' }))
    .concluirAprovacao('a5', DADOS_DA_APROVACAO, null).catch((erro: unknown) => erro)
  expect((semPermissao as Error).message).toBe('Seu perfil não permite alterar os processos.')
  const sumiu = await criar(clienteQueRecusaAAprovacao({ message: 'registro_inexistente', code: 'P0001' }))
    .concluirAprovacao('a5', DADOS_DA_APROVACAO, null).catch((erro: unknown) => erro)
  expect(sumiu).toBeInstanceOf(CadastroInexistente)
})

// ---- Editar a revisão e a aprovação (ticket 04)

function clienteQueGrava(tabela: 'revisoes_internas' | 'aprovacoes') {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas[`${tabela}.update`] = { data: [{ id: 'x1' }], error: null }
  return cliente
}

function clienteQueRecusaAEdicao(tabela: 'revisoes_internas' | 'aprovacoes', erro: { message: string; code?: string }) {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas[`${tabela}.update`] = { data: null, error: erro }
  return cliente
}

test('editarRevisao altera só o escopo e o comentário da revisão pelo id', async () => {
  const cliente = clienteQueGrava('revisoes_internas')
  await criar(cliente).editarRevisao('r1', { escopo: 'relatorio', comentario: null })
  expect(cliente.pedidos).toEqual([{
    tabela: 'revisoes_internas', operacao: 'update', valores: { escopo: 'relatorio', comentario: null },
    colunas: 'id', filtro: ['id', 'r1'], filtros: [['id', 'r1']],
  }])
})

test('editarAprovacao altera o número, o link e a data da aprovação pelo id', async () => {
  const cliente = clienteQueGrava('aprovacoes')
  await criar(cliente).editarAprovacao('ap1', { numeroEprotocolo: 'PROT-9', link: null, aprovadaEm: '2026-10-13' })
  expect(cliente.pedidos).toEqual([{
    tabela: 'aprovacoes', operacao: 'update',
    valores: { numero_eprotocolo: 'PROT-9', link: null, aprovada_em: '2026-10-13' },
    colunas: 'id', filtro: ['id', 'ap1'], filtros: [['id', 'ap1']],
  }])
})

test.each([
  ['revisoes_internas', 'escopo_obrigatorio', 'Escolha o escopo da correção.'],
  ['revisoes_internas', 'escopo_so_na_corrigida', 'O escopo só vale na revisão corrigida.'],
  ['revisoes_internas', 'processo_parado:suspenso', 'Este processo está suspenso; retome-o para registrar o andamento.'],
  ['aprovacoes', 'link_invalido', 'O link do E-protocolo precisa começar com http:// ou https://.'],
  ['aprovacoes', 'data_no_futuro:2026-10-20', 'A data 20/10/2026 está no futuro.'],
  ['aprovacoes', 'aprovacao_antes_da_revisao:2026-10-12:2026-10-13',
    'A data da aprovação (12/10/2026) não pode ser antes da última revisão interna (13/10/2026).'],
] as const)('a recusa %s de %s na edição vira a frase da tela', async (tabela, codigo, frase) => {
  const cliente = clienteQueRecusaAEdicao(tabela, { message: codigo, code: 'P0001' })
  const modulo = criar(cliente)
  const falha = await (tabela === 'aprovacoes'
    ? modulo.editarAprovacao('ap1', { numeroEprotocolo: null, link: null, aprovadaEm: null })
    : modulo.editarRevisao('r1', { escopo: null, comentario: null })).catch((erro: unknown) => erro)
  expect(falha).toBeInstanceOf(TravaDoBanco)
  expect((falha as Error).message).toBe(frase)
})

test('falta de privilégio na edição vira a frase do perfil', async () => {
  const cliente = clienteQueRecusaAEdicao('aprovacoes', { message: 'permission denied', code: '42501' })
  const falha = await criar(cliente).editarAprovacao('ap1', { numeroEprotocolo: null, link: null, aprovadaEm: null })
    .catch((erro: unknown) => erro)
  expect((falha as Error).message).toBe('Seu perfil não permite alterar os processos.')
})

test('nenhuma linha alterada com o registro ainda legível é falta de permissão (a política filtrou)', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['revisoes_internas.select'] = { data: [{ id: 'r1' }], error: null }
  const falha = await criar(cliente).editarRevisao('r1', { escopo: null, comentario: 'x' }).catch((erro: unknown) => erro)
  expect(falha).toBeInstanceOf(TravaDoBanco)
  expect((falha as Error).message).toBe('Seu perfil não permite alterar os processos.')
})

test('nenhuma linha alterada e o registro ilegível é cadastro inexistente (sumiu)', async () => {
  const falha = await criar(new ClienteSupabaseFalso())
    .editarAprovacao('ap1', { numeroEprotocolo: 'PROT-9', link: null, aprovadaEm: null }).catch((erro: unknown) => erro)
  expect(falha).toBeInstanceOf(CadastroInexistente)
})
