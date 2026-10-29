import type { SupabaseClient } from '@supabase/supabase-js'
import { expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { RECUSAS_DOS_PROCESSOS } from '../processos/processosSupabase'
import { ClienteSupabaseFalso } from '../testes/ClienteSupabaseFalso'
import type { Database } from '../types/database'
import { criarRevisoesSupabase } from './revisoesSupabase'

// A data da validação e o .pdf da aprovação no módulo real (revisoes-aprovacao, ticket 06).

function criar(cliente: ClienteSupabaseFalso) {
  return criarRevisoesSupabase(cliente as unknown as SupabaseClient<Database>, RECUSAS_DOS_PROCESSOS)
}

test('registrarDataDaValidacao chama a função do banco com o processo e a data, e com null para apagar', async () => {
  const cliente = new ClienteSupabaseFalso()
  await criar(cliente).registrarDataDaValidacao('p1', '2026-10-13')
  await criar(cliente).registrarDataDaValidacao('p1', null)
  expect(cliente.pedidos).toEqual([
    { tabela: 'rpc', operacao: 'registrar_data_da_validacao', valores: { p_processo: 'p1', p_data: '2026-10-13' } },
    { tabela: 'rpc', operacao: 'registrar_data_da_validacao', valores: { p_processo: 'p1', p_data: null } },
  ])
})

test.each([
  ['data_so_na_validacao', 'Registre a data da validação com o processo na Validação com o setor.'],
  ['data_no_futuro:2026-10-20', 'A data da validação não pode ser futura.'],
  ['data_da_validacao_so_pela_funcao', 'A data da validação só muda pelo campo do Agora.'],
])('a recusa %s do banco ao registrar a data vira a frase pronta', async (motivo, frase) => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['rpc.registrar_data_da_validacao'] = { data: null, error: { message: motivo, code: 'P0001' } }
  const falha = await criar(cliente).registrarDataDaValidacao('p1', '2026-10-20').catch((erro: unknown) => erro)
  expect(falha).toBeInstanceOf(TravaDoBanco)
  expect((falha as Error).message).toBe(frase)
})

test('a data da aprovação no futuro continua com a frase antiga: o contexto da validação não vaza', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['rpc.registrar_aprovacao'] = { data: null, error: { message: 'data_no_futuro:2026-10-20', code: 'P0001' } }
  const falha = await criar(cliente).registrarAprovacao('p1', { numeroEprotocolo: null, link: null, aprovadaEm: '2026-10-20' })
    .catch((erro: unknown) => erro)
  expect((falha as Error).message).toBe('A data 20/10/2026 está no futuro.')
})

test('lerAprovacao traz o .pdf atual e ignora os guardados de aprovações trocadas', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['aprovacoes.select'] = {
    data: [{
      id: 'ap1', numero_eprotocolo: 'PROT-1', link: null, aprovada_em: '2026-10-13', registrada_em: '2026-10-13T12:00:00Z',
      versao: { numero: 8 }, registrador: { nome: 'Bia Teste' },
      pdfs: [
        { id: 'pdf1', nome: 'TSA_V7_Emitir_Aprovação.pdf', tamanho: 50, guardado_em: '2026-10-12T10:00:00Z' },
        { id: 'pdf2', nome: 'TSA_V8_Emitir_Aprovação.pdf', tamanho: 99, guardado_em: null },
      ],
    }],
    error: null,
  }
  const aprovacao = await criar(cliente).lerAprovacao('p1')
  expect(aprovacao?.pdf).toEqual({ id: 'pdf2', papel: 'pdf_da_aprovacao', nome: 'TSA_V8_Emitir_Aprovação.pdf', formato: 'pdf', tamanho: 99 })
  expect(cliente.pedidos[0].colunas).toContain('pdfs:pdfs_da_aprovacao(id, nome, tamanho, guardado_em)')
})

test('sem .pdf atual, a aprovação vem com pdf null', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['aprovacoes.select'] = {
    data: [{
      id: 'ap1', numero_eprotocolo: null, link: null, aprovada_em: null, registrada_em: '2026-10-13T12:00:00Z',
      versao: { numero: 8 }, registrador: null, pdfs: [{ id: 'pdf1', nome: 'x.pdf', tamanho: 5, guardado_em: '2026-10-12T10:00:00Z' }],
    }],
    error: null,
  }
  expect((await criar(cliente).lerAprovacao('p1'))?.pdf).toBeNull()
})
