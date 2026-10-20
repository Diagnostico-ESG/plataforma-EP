import { describe, expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import type { ClienteSupabase } from '../lib/supabase'
import { ClienteSupabaseFalso } from '../testes/ClienteSupabaseFalso'
import { criarPlanilhasSupabase } from './planilhasSupabase'

function moduloComCliente() {
  const cliente = new ClienteSupabaseFalso()
  return { cliente, modulo: criarPlanilhasSupabase(cliente as unknown as ClienteSupabase) }
}

const LINHA = {
  id: 't1', iniciada_em: '2026-10-20T09:00:00Z', origem: 'botao', pedida_por_nome: 'Ana Teste',
  motivo: 'planilha_publica_recusada', resultado: 'falhou',
}

describe('listarAtualizacoes', () => {
  test('lê a view do resultado, da mais recente para a mais antiga, no máximo 10, e converte as linhas', async () => {
    const { cliente, modulo } = moduloComCliente()
    cliente.respostas['resultado_das_atualizacoes_das_planilhas.select'] = {
      data: [LINHA, { ...LINHA, id: 't0', origem: 'automatica', pedida_por_nome: null, motivo: null, resultado: 'concluida' }],
      error: null,
    }
    const lista = await modulo.listarAtualizacoes()
    expect(lista).toEqual([
      { id: 't1', iniciadaEm: '2026-10-20T09:00:00Z', origem: 'botao', pedidaPor: 'Ana Teste',
        resultado: 'falhou', motivo: 'planilha_publica_recusada' },
      { id: 't0', iniciadaEm: '2026-10-20T09:00:00Z', origem: 'automatica', pedidaPor: null,
        resultado: 'concluida', motivo: null },
    ])
    const pedido = cliente.pedidos[0]
    expect(pedido.tabela).toBe('resultado_das_atualizacoes_das_planilhas')
    expect(pedido.ordem).toEqual([['iniciada_em', false]])
    expect(pedido.limite).toBe(10)
  })

  test('falha ao ler vira erro com o motivo do banco', async () => {
    const { cliente, modulo } = moduloComCliente()
    cliente.respostas['resultado_das_atualizacoes_das_planilhas.select'] = { data: null, error: { message: 'sem rede' } }
    await expect(modulo.listarAtualizacoes())
      .rejects.toThrow('Falha ao ler as atualizações das planilhas: sem rede')
  })
})

describe('lerLinks', () => {
  test('a linha com os dois endereços vira os links', async () => {
    const { cliente, modulo } = moduloComCliente()
    cliente.respostas['rpc.links_das_planilhas'] = {
      data: [{ planilha_interna: 'https://docs.example/i', planilha_publica: 'https://docs.example/p' }], error: null,
    }
    expect(await modulo.lerLinks()).toEqual({ interna: 'https://docs.example/i', publica: 'https://docs.example/p' })
  })

  test.each([
    [[{ planilha_interna: null, planilha_publica: null }]],
    [[]],
  ])('sem endereços (%j) devolve null', async (data) => {
    const { cliente, modulo } = moduloComCliente()
    cliente.respostas['rpc.links_das_planilhas'] = { data, error: null }
    expect(await modulo.lerLinks()).toBeNull()
  })

  test('falha ao ler vira erro com o motivo do banco', async () => {
    const { cliente, modulo } = moduloComCliente()
    cliente.respostas['rpc.links_das_planilhas'] = { data: null, error: { message: 'sem rede' } }
    await expect(modulo.lerLinks()).rejects.toThrow('Falha ao ler os links das planilhas: sem rede')
  })
})

describe('pedirAtualizacao', () => {
  test('chama a função do banco', async () => {
    const { cliente, modulo } = moduloComCliente()
    await modulo.pedirAtualizacao()
    expect(cliente.pedidos).toEqual([{ tabela: 'rpc', operacao: 'pedir_atualizacao_das_planilhas', valores: undefined }])
  })

  test.each([
    [{ message: 'atualizacao_em_andamento' }, 'Já há uma atualização em andamento.'],
    [{ message: 'planilhas_nao_configuradas' }, 'As planilhas ainda não foram configuradas neste ambiente.'],
    [{ message: 'permission denied', code: '42501' }, 'Seu perfil não permite atualizar as planilhas.'],
  ])('a recusa %j chega como trava com a frase pronta', async (erro, frase) => {
    const { cliente, modulo } = moduloComCliente()
    cliente.respostas['rpc.pedir_atualizacao_das_planilhas'] = { data: null, error: erro }
    const falha = await modulo.pedirAtualizacao().catch((e: unknown) => e)
    expect(falha).toBeInstanceOf(TravaDoBanco)
    expect((falha as Error).message).toBe(frase)
  })

  test('outra falha vira erro inesperado, com a mensagem do banco', async () => {
    const { cliente, modulo } = moduloComCliente()
    cliente.respostas['rpc.pedir_atualizacao_das_planilhas'] = { data: null, error: { message: 'sem rede' } }
    const falha = await modulo.pedirAtualizacao().catch((e: unknown) => e)
    expect(falha).not.toBeInstanceOf(TravaDoBanco)
    expect((falha as Error).message).toBe('erro inesperado do banco (sem rede)')
  })
})
