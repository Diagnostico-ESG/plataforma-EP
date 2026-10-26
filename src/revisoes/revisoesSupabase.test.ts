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

test('listar lê as revisões do processo, da mais recente para a mais antiga, com o revisor e as versões', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['revisoes_internas.select'] = {
    data: [
      { id: 'r2', resultado: 'corrigida', escopo: 'ambos', comentario: 'Ajustei', revisada_em: '2026-10-13',
        revisor: { nome: 'Bia Teste' }, revisada: { numero: 7 }, corrigida: { numero: 8 }, passagem: { saiu_em: null } },
      { id: 'r1', resultado: 'sem_alteracao', escopo: null, comentario: null, revisada_em: '2026-10-12',
        revisor: null, revisada: { numero: 6 }, corrigida: null, passagem: { saiu_em: '2026-10-12T15:00:00Z' } },
    ],
    error: null,
  }
  const revisoes = await criar(cliente).listarRevisoes('p1')
  expect(revisoes).toEqual([
    { id: 'r2', versaoRevisada: 7, versaoCorrigida: 8, resultado: 'corrigida', escopo: 'ambos', comentario: 'Ajustei',
      revisor: 'Bia Teste', revisadaEm: '2026-10-13', daPassagemAberta: true },
    { id: 'r1', versaoRevisada: 6, versaoCorrigida: null, resultado: 'sem_alteracao', escopo: null, comentario: null,
      revisor: null, revisadaEm: '2026-10-12', daPassagemAberta: false },
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

test('lerAprovacao lê a aprovação do processo com a versão e quem registrou', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['aprovacoes.select'] = {
    data: [{ id: 'ap1', numero_eprotocolo: 'PROT-1', link: 'https://eprotocolo.example/a', aprovada_em: '2026-10-13',
      registrada_em: '2026-10-13T12:00:00Z', versao: { numero: 8 }, registrador: { nome: 'Bia Teste' } }],
    error: null,
  }
  expect(await criar(cliente).lerAprovacao('p1')).toEqual({
    id: 'ap1', versao: 8, numeroEprotocolo: 'PROT-1', link: 'https://eprotocolo.example/a', aprovadaEm: '2026-10-13',
    registradaPor: 'Bia Teste', registradaEm: '2026-10-13T12:00:00Z', pdf: null,
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
  await criar(cliente).editarRevisao('r1', { resultado: 'corrigida', escopo: 'relatorio', comentario: null })
  expect(cliente.pedidos).toEqual([{
    tabela: 'revisoes_internas', operacao: 'update', valores: { resultado: 'corrigida', escopo: 'relatorio', comentario: null },
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
  ['revisoes_internas', 'processo_parado:suspenso', 'Este processo está suspenso; retome-o para mudar a etapa, a etiqueta ou o responsável.'],
  ['aprovacoes', 'link_invalido', 'O link do E-protocolo precisa começar com http:// ou https://.'],
  ['aprovacoes', 'data_no_futuro:2026-10-20', 'A data 20/10/2026 está no futuro.'],
] as const)('a recusa %s de %s na edição vira a frase da tela', async (tabela, codigo, frase) => {
  const cliente = clienteQueRecusaAEdicao(tabela, { message: codigo, code: 'P0001' })
  const modulo = criar(cliente)
  const falha = await (tabela === 'aprovacoes'
    ? modulo.editarAprovacao('ap1', { numeroEprotocolo: null, link: null, aprovadaEm: null })
    : modulo.editarRevisao('r1', { resultado: 'sem_alteracao', escopo: null, comentario: null })).catch((erro: unknown) => erro)
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
  const falha = await criar(cliente).editarRevisao('r1', { resultado: 'sem_alteracao', escopo: null, comentario: 'x' }).catch((erro: unknown) => erro)
  expect(falha).toBeInstanceOf(TravaDoBanco)
  expect((falha as Error).message).toBe('Seu perfil não permite alterar os processos.')
})

test('nenhuma linha alterada e o registro ilegível é cadastro inexistente (sumiu)', async () => {
  const falha = await criar(new ClienteSupabaseFalso())
    .editarAprovacao('ap1', { numeroEprotocolo: 'PROT-9', link: null, aprovadaEm: null }).catch((erro: unknown) => erro)
  expect(falha).toBeInstanceOf(CadastroInexistente)
})

test('registrarRevisao inclui só o processo, o resultado, o escopo e o comentário: o resto é do banco', async () => {
  const cliente = clienteQueGrava('revisoes_internas')
  await criar(cliente).registrarRevisao('p1', { resultado: 'corrigida', escopo: 'ambos', comentario: 'Ajustei' })
  expect(cliente.pedidos).toEqual([{
    tabela: 'revisoes_internas', operacao: 'insert',
    valores: { processo_id: 'p1', resultado: 'corrigida', escopo: 'ambos', comentario: 'Ajustei' },
  }])
})

test('registrarAprovacao chama a função do banco com o processo, o número, o link e a data', async () => {
  const cliente = new ClienteSupabaseFalso()
  await criar(cliente).registrarAprovacao('p1', { numeroEprotocolo: 'PROT-1', link: null, aprovadaEm: '2026-10-13' })
  expect(cliente.pedidos).toEqual([{
    tabela: 'rpc', operacao: 'registrar_aprovacao',
    valores: { p_processo: 'p1', p_numero: 'PROT-1', p_link: null, p_data: '2026-10-13' },
  }])
})

test.each([
  ['revisao_fora_da_etapa', 'Registre a revisão com o processo na Revisão interna.'],
  ['revisao_ja_registrada', 'Já há uma revisão registrada nesta passagem pela Revisão interna; edite-a.'],
  ['corrigida_sem_versao_na_passagem', "Para 'corrigida', envie a versão corrigida com o processo na Revisão interna."],
  ['sem_versao', 'O processo ainda não tem versão.'],
])('a recusa %s do banco ao registrar a revisão vira a frase pronta', async (motivo, frase) => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['revisoes_internas.insert'] = { data: null, error: { message: motivo, code: 'P0001' } }
  const falha = await criar(cliente).registrarRevisao('p1', { resultado: 'sem_alteracao', escopo: null, comentario: null })
    .catch((erro: unknown) => erro)
  expect(falha).toBeInstanceOf(TravaDoBanco)
  expect((falha as Error).message).toBe(frase)
})

test('a recusa da aprovação fora da etapa vira a frase pronta', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['rpc.registrar_aprovacao'] = { data: null, error: { message: 'aprovacao_fora_da_etapa', code: 'P0001' } }
  const falha = await criar(cliente).registrarAprovacao('p1', { numeroEprotocolo: null, link: null, aprovadaEm: null })
    .catch((erro: unknown) => erro)
  expect((falha as Error).message).toBe('Registre a aprovação com o processo na Aprovação pelo setor.')
})
